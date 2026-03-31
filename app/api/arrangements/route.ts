import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getSessionFromRequest } from '../../../lib/auth';
import { checkCsrfToken } from '../../../lib/csrf';
import { getAccessContextForSession, hasReachedLimit } from '../../../lib/entitlements';
import { prisma } from '../../../lib/prisma';
import { createPlanLimitResponse } from '../../../lib/subscriptionResponses';
import type { CreateArrangementRequest } from '../../../lib/types';

const toPrismaJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function getPublicShareCount(userId: string): Promise<number> {
  const [publicProgressions, publicArrangements] = await Promise.all([
    prisma.progression.count({ where: { userId, isPublic: true } }),
    prisma.arrangement.count({ where: { userId, isPublic: true } }),
  ]);

  return publicProgressions + publicArrangements;
}

/**
 * Creates a saved arrangement for the authenticated user.
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

    const body = (await request.json()) as CreateArrangementRequest;
    const {
      title,
      timeline,
      playbackSnapshot,
      vocalTakeCount,
      sourceChords,
      notes,
      tags = [],
      isPublic = false,
    } = body;

    if (!timeline || !Array.isArray(timeline.events)) {
      return NextResponse.json({ message: 'Arrangement timeline is required' }, { status: 400 });
    }

    if (!playbackSnapshot) {
      return NextResponse.json(
        { message: 'Arrangement playback settings are required' },
        { status: 400 },
      );
    }

    if (timeline.totalSteps <= 0) {
      return NextResponse.json(
        { message: 'Arrangement timeline must contain at least one step' },
        { status: 400 },
      );
    }

    if (Number.isFinite(vocalTakeCount) && (vocalTakeCount ?? 0) > 0) {
      const maxVocalTakes = accessContext.entitlements.maxVocalTakesPerArrangement;
      const usedVocalTakes = Math.floor(vocalTakeCount ?? 0);
      if (maxVocalTakes !== null && usedVocalTakes > maxVocalTakes) {
        return createPlanLimitResponse({
          code: 'VOCAL_TAKE_LIMIT_REACHED',
          message: 'You have reached your vocal take limit for this plan',
          plan: accessContext.plan,
          limit: maxVocalTakes,
          used: usedVocalTakes,
        });
      }
    }

    const arrangementCount = await prisma.arrangement.count({ where: { userId: session.userId } });
    if (hasReachedLimit(accessContext.entitlements.maxSavedArrangements, arrangementCount)) {
      return createPlanLimitResponse({
        code: 'SAVED_ARRANGEMENT_LIMIT_REACHED',
        message: 'You have reached your saved arrangement limit for this plan',
        plan: accessContext.plan,
        limit: accessContext.entitlements.maxSavedArrangements,
        used: arrangementCount,
      });
    }

    const requestedPublic = Boolean(isPublic);
    const resolvedIsPublic = requestedPublic && accessContext.entitlements.canSharePublicly;

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

    const arrangement = await prisma.arrangement.create({
      data: {
        title: title?.trim() || 'Untitled arrangement',
        timeline: toPrismaJson(timeline),
        playbackSnapshot: toPrismaJson(playbackSnapshot),
        ...(sourceChords !== undefined && { sourceChords: toPrismaJson(sourceChords) }),
        ...(notes !== undefined && { notes }),
        tags,
        isPublic: resolvedIsPublic,
        userId: session.userId,
      },
    });

    return NextResponse.json(arrangement, { status: 201 });
  } catch (error) {
    console.error('Failed to save arrangement:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            message:
              'Your session user was not found in the database. Please sign out and sign in again.',
          },
          { status: 401 },
        );
      }

      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json(
          {
            message:
              'Database schema is out of date for arrangements. Apply Prisma migrations on the active DATABASE_URL.',
          },
          { status: 500 },
        );
      }
    }

    if (error instanceof TypeError && error.message.includes('arrangement')) {
      return NextResponse.json(
        {
          message:
            'Prisma client is stale for Arrangement model. Restart the Next.js dev server after running prisma generate.',
        },
        { status: 500 },
      );
    }

    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      return NextResponse.json(
        {
          message: 'Failed to save arrangement',
          detail: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Failed to save arrangement' }, { status: 500 });
  }
}

/**
 * Lists arrangements for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const arrangements = await prisma.arrangement.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(arrangements);
  } catch (error) {
    console.error('Failed to fetch arrangements:', error);
    return NextResponse.json({ message: 'Failed to fetch arrangements' }, { status: 500 });
  }
}
