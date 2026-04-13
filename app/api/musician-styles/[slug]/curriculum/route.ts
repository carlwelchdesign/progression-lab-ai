import { UsageEventType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../../lib/auth';
import { checkCsrfToken } from '../../../../../lib/csrf';
import { getAccessContextForSession, hasReachedLimit } from '../../../../../lib/entitlements';
import { prisma } from '../../../../../lib/prisma';
import { createPlanLimitResponse } from '../../../../../lib/subscriptionResponses';
import { getCurrentMonthUsageCount, recordUsageEvent } from '../../../../../lib/usage';
import { generateCurriculumBatch } from '../../../../../features/musician-styles/services/curriculumGenerationService';
import {
  appendCurriculumBatch,
  getIncompleteLessonIds,
  getNextBatchNumber,
} from '../../../../../features/musician-styles/services/curriculumGenerationService';
import {
  getCurriculumByUserAndMusician,
  upsertCurriculum,
} from '../../../../../features/musician-styles/services/curriculumRepository';
import { getCompletedLessonIdSet } from '../../../../../features/musician-styles/services/lessonProgressRepository';
import { findMusicianBySlug } from '../../../../../features/musician-styles/services/musicianRepository';
import {
  assessUserSkillLevel,
  summarizePreviousLessons,
} from '../../../../../features/musician-styles/services/skillAssessmentService';

/**
 * POST /api/musician-styles/[slug]/curriculum
 * Generates initial curriculum (or regenerates if force=true).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const csrfError = checkCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const accessContext = await getAccessContextForSession(session);
    if (!accessContext) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { force?: boolean };
    const force = Boolean(body.force);

    const musician = await findMusicianBySlug(prisma, slug);
    if (!musician || !musician.isActive) {
      return NextResponse.json({ message: 'Musician not found' }, { status: 404 });
    }

    const existing = await getCurriculumByUserAndMusician(prisma, session.userId, musician.id);
    const isStale = existing ? existing.promptVersion < musician.promptVersion : false;

    if (existing && !force && isStale) {
      return NextResponse.json(existing.curriculumJson);
    }

    if (existing && !force && !isStale) {
      const existingCurriculum = existing.curriculumJson;
      const completedLessonIds = await getCompletedLessonIdSet(
        prisma,
        session.userId,
        existingCurriculum.lessons.map((lesson) => lesson.id),
      );
      const incompleteLessonIds = getIncompleteLessonIds(existingCurriculum, completedLessonIds);

      if (incompleteLessonIds.length > 0) {
        return NextResponse.json(existingCurriculum);
      }
    }

    const used = await getCurrentMonthUsageCount(session.userId, UsageEventType.AI_GENERATION);
    if (hasReachedLimit(accessContext.entitlements.aiGenerationsPerMonth, used)) {
      return createPlanLimitResponse({
        code: 'AI_GENERATION_LIMIT_REACHED',
        message: 'You have reached your monthly AI generation limit for this plan',
        plan: accessContext.plan,
        limit: accessContext.entitlements.aiGenerationsPerMonth,
        used,
      });
    }

    const skillLevel = await assessUserSkillLevel(prisma, session.userId);
    const previousLessons = await summarizePreviousLessons(prisma, session.userId);

    const existingCurriculum = existing?.curriculumJson ?? null;
    const batchNumber = force ? 1 : getNextBatchNumber(existingCurriculum);

    const generatedBatch = await generateCurriculumBatch({
      musician,
      skillLevel,
      batchNumber,
      previousLessons,
      model: accessContext.entitlements.gptModel,
    });

    const generated = appendCurriculumBatch(existingCurriculum, generatedBatch);

    await upsertCurriculum(prisma, {
      userId: session.userId,
      musicianId: musician.id,
      promptVersion: musician.promptVersion,
      skillLevel,
      curriculumJson: generated,
    });

    await recordUsageEvent({
      userId: session.userId,
      eventType: UsageEventType.AI_GENERATION,
      metadata: {
        feature: 'musician-styles',
        musicianSlug: musician.slug,
        promptVersion: musician.promptVersion,
        force,
        batchNumber,
      },
    });

    return NextResponse.json(generated);
  } catch (error) {
    console.error('Failed to generate musician curriculum:', error);
    return NextResponse.json({ message: 'Failed to generate curriculum' }, { status: 500 });
  }
}
