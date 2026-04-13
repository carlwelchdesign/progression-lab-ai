import { UsageEventType } from '@prisma/client';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { checkCsrfToken } from '../../../../../lib/csrf';
import { getSessionFromRequest } from '../../../../../lib/auth';
import { getAccessContextForSession, hasReachedLimit } from '../../../../../lib/entitlements';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentMonthUsageCount, recordUsageEvent } from '../../../../../lib/usage';
import { createPlanLimitResponse } from '../../../../../lib/subscriptionResponses';
import type { GeneratedCurriculumData } from '../../../../../features/musician-styles/types';
import { curriculumSchema } from '../../curriculumSchema';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL_FALLBACKS: Record<string, string> = {
  'gpt-3.5-turbo': 'gpt-4o-mini',
  'gpt-3.5-turbo-0125': 'gpt-4o-mini',
};

function resolveModel(model: string): string {
  return MODEL_FALLBACKS[model] ?? model;
}

function assessSkillLevel(completedLessonCount: number): string {
  if (completedLessonCount <= 2) return 'beginner';
  if (completedLessonCount <= 6) return 'intermediate';
  return 'advanced';
}

/**
 * POST /api/musician-styles/[slug]/curriculum
 * Generates (or returns cached) an AI curriculum for the given musician + user.
 * Pass { force: true } in body to regenerate even if cached.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const csrfError = checkCsrfToken(request);
  if (csrfError) return csrfError;

  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const body = (await request.json()) as { force?: boolean };

  const musician = await prisma.musicianProfile.findUnique({
    where: { slug, isActive: true },
  });

  if (!musician) {
    return NextResponse.json({ message: 'Musician not found' }, { status: 404 });
  }

  // Return cached curriculum unless stale or force-regenerate requested
  if (!body.force) {
    const cached = await prisma.generatedCurriculum.findUnique({
      where: { userId_musicianId: { userId: session.userId, musicianId: musician.id } },
    });
    if (cached && cached.promptVersion === musician.promptVersion) {
      return NextResponse.json(cached.curriculumJson);
    }
  }

  // Check entitlements + usage
  const accessContext = await getAccessContextForSession(session);
  if (!accessContext) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const aiGenerationsUsed = await getCurrentMonthUsageCount(
    session.userId,
    UsageEventType.AI_GENERATION,
  );
  if (hasReachedLimit(accessContext.entitlements.aiGenerationsPerMonth, aiGenerationsUsed)) {
    return createPlanLimitResponse({
      code: 'AI_GENERATION_LIMIT_REACHED',
      message: 'You have reached your monthly AI generation limit for this plan',
      plan: accessContext.plan,
      used: aiGenerationsUsed,
      limit: accessContext.entitlements.aiGenerationsPerMonth,
    });
  }

  // Assess skill level from Piano Course progress
  const completedCount = await prisma.lessonProgress.count({
    where: { userId: session.userId, completed: true },
  });
  const skillLevel = assessSkillLevel(completedCount);

  // Build the AI prompt
  const systemPrompt = musician.promptTemplate
    .replace('{{skillLevel}}', skillLevel)
    .replace('{{styleDescription}}', musician.styleDescription);

  const userInput = JSON.stringify({
    skillLevel,
    completedLessons: completedCount,
    musicianSlug: musician.slug,
    signatureTechniques: musician.signatureTechniques,
    preferredKeys: musician.preferredKeys,
    exampleSongs: musician.exampleSongs,
  });

  const model = resolveModel(accessContext.entitlements.gptModel);

  const aiResponse = await client.responses.create({
    model,
    instructions: systemPrompt,
    input: userInput,
    text: {
      format: {
        type: 'json_schema',
        name: 'generated_curriculum',
        strict: true,
        schema: curriculumSchema,
      },
    },
  });

  await recordUsageEvent({
    userId: session.userId,
    eventType: UsageEventType.AI_GENERATION,
    metadata: { model, musician: musician.slug, promptVersion: musician.promptVersion },
  });

  const curriculum = JSON.parse(aiResponse.output_text) as GeneratedCurriculumData;

  await prisma.generatedCurriculum.upsert({
    where: { userId_musicianId: { userId: session.userId, musicianId: musician.id } },
    update: {
      promptVersion: musician.promptVersion,
      skillLevel,
      curriculumJson: curriculum as object,
    },
    create: {
      userId: session.userId,
      musicianId: musician.id,
      promptVersion: musician.promptVersion,
      skillLevel,
      curriculumJson: curriculum as object,
    },
  });

  return NextResponse.json(curriculum);
}
