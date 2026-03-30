import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getSessionFromRequest } from '../../../lib/auth';
import { checkCsrfToken } from '../../../lib/csrf';
import { getAccessContextForSession, hasReachedLimit } from '../../../lib/entitlements';
import {
  buildDefaultProgressionTitle,
  getPrimaryProgressionFromSnapshot,
} from '../../../lib/generatorSnapshot';
import { prisma } from '../../../lib/prisma';
import { createPlanLimitResponse } from '../../../lib/subscriptionResponses';
import type { CreateProgressionRequest, GeneratorSnapshot } from '../../../lib/types';

const hasGeneratorSnapshot = (
  value: CreateProgressionRequest['generatorSnapshot'],
): value is GeneratorSnapshot => !!value;

const toPrismaJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function getPublicShareCount(userId: string): Promise<number> {
  const [publicProgressions, publicArrangements] = await Promise.all([
    prisma.progression.count({ where: { userId, isPublic: true } }),
    prisma.arrangement.count({ where: { userId, isPublic: true } }),
  ]);

  return publicProgressions + publicArrangements;
}

/**
 * Creates a saved progression for the authenticated user.
 */
export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as CreateProgressionRequest;
    const {
      title,
      chords,
      pianoVoicings,
      generatorSnapshot,
      feel,
      scale,
      genre,
      notes,
      tags = [],
      isPublic = false,
    } = body;

    const requestedPublic = Boolean(isPublic);
    const resolvedIsPublic = requestedPublic && accessContext.entitlements.canSharePublicly;

    const snapshot = hasGeneratorSnapshot(generatorSnapshot) ? generatorSnapshot : null;
    const primaryProgression = snapshot ? getPrimaryProgressionFromSnapshot(snapshot) : null;

    const resolvedChords = chords?.length ? chords : primaryProgression?.chords;
    const resolvedPianoVoicings = pianoVoicings ?? primaryProgression?.pianoVoicings;
    const resolvedFeel = feel ?? primaryProgression?.feel;
    const resolvedScale = scale ?? snapshot?.data.inputSummary.mode ?? undefined;
    const resolvedGenre = genre ?? snapshot?.data.inputSummary.genre ?? undefined;
    const resolvedTitle =
      title?.trim() ||
      (snapshot ? buildDefaultProgressionTitle(snapshot) : primaryProgression?.label);

    if (!resolvedChords || resolvedChords.length === 0) {
      return NextResponse.json(
        { message: 'Chords are required to save a progression' },
        { status: 400 },
      );
    }

    const progressionCount = await prisma.progression.count({ where: { userId: session.userId } });
    if (hasReachedLimit(accessContext.entitlements.maxSavedProgressions, progressionCount)) {
      return createPlanLimitResponse({
        code: 'SAVED_PROGRESSION_LIMIT_REACHED',
        message: 'You have reached your saved progression limit for this plan',
        plan: accessContext.plan,
        limit: accessContext.entitlements.maxSavedProgressions,
        used: progressionCount,
      });
    }

    if (requestedPublic && !accessContext.entitlements.canSharePublicly) {
      return createPlanLimitResponse({
        code: 'PUBLIC_SHARING_NOT_AVAILABLE',
        message: 'Public sharing is not available on your current plan',
        plan: accessContext.plan,
      });
    }

    if (resolvedIsPublic) {
      const publicShareCount = await getPublicShareCount(session.userId);
      if (hasReachedLimit(accessContext.entitlements.maxPublicShares, publicShareCount)) {
        return createPlanLimitResponse({
          code: 'PUBLIC_SHARE_LIMIT_REACHED',
          message: 'You have reached your public sharing limit for this plan',
          plan: accessContext.plan,
          limit: accessContext.entitlements.maxPublicShares,
          used: publicShareCount,
        });
      }
    }

    const progressionCreateData = {
      title: resolvedTitle || 'Saved progression',
      chords: toPrismaJson(resolvedChords),
      ...(resolvedPianoVoicings !== undefined && {
        pianoVoicings: toPrismaJson(resolvedPianoVoicings),
      }),
      ...(snapshot !== null && { generatorSnapshot: toPrismaJson(snapshot) }),
      ...(resolvedFeel !== undefined && { feel: resolvedFeel }),
      ...(resolvedScale !== undefined && { scale: resolvedScale }),
      ...(resolvedGenre !== undefined && { genre: resolvedGenre }),
      notes,
      tags,
      isPublic: resolvedIsPublic,
      userId: session.userId,
    };

    let progression;
    try {
      progression = await prisma.progression.create({ data: progressionCreateData });
    } catch (createError) {
      const isMissingSnapshotColumn =
        createError instanceof Prisma.PrismaClientKnownRequestError && createError.code === 'P2022';

      if (!isMissingSnapshotColumn || snapshot === null) {
        throw createError;
      }

      // Backward-compatible fallback when deployed DB is missing the generatorSnapshot column.
      // Saves still succeed, but full-result restore is unavailable until migration is applied.
      const fallbackData = { ...progressionCreateData };
      delete fallbackData.generatorSnapshot;
      progression = await prisma.progression.create({ data: fallbackData });
    }

    return NextResponse.json(progression, { status: 201 });
  } catch (error) {
    console.error('Failed to save progression:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
      return NextResponse.json(
        {
          message:
            'Database schema is out of date for saved generator snapshots. Run Prisma migration on the active DATABASE_URL.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Failed to save progression' }, { status: 500 });
  }
}

/**
 * Lists saved progressions for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const progressions = await prisma.progression.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(progressions);
  } catch (error) {
    console.error('Failed to fetch progressions:', error);
    return NextResponse.json({ message: 'Failed to fetch progressions' }, { status: 500 });
  }
}
