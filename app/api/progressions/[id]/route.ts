import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { checkCsrfToken } from '../../../../lib/csrf';
import { getAccessContextForSession, hasReachedLimit } from '../../../../lib/entitlements';
import { prisma } from '../../../../lib/prisma';
import { createPlanLimitResponse } from '../../../../lib/subscriptionResponses';
import type { UpdateProgressionRequest } from '../../../../lib/types';

const toPrismaJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function getPublicShareCount(userId: string): Promise<number> {
  const [publicProgressions, publicArrangements] = await Promise.all([
    prisma.progression.count({ where: { userId, isPublic: true } }),
    prisma.arrangement.count({ where: { userId, isPublic: true } }),
  ]);

  return publicProgressions + publicArrangements;
}

/**
 * Fetches a single saved progression for the authenticated user.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const progression = await prisma.progression.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!progression) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
    }

    return NextResponse.json(progression);
  } catch (error) {
    console.error('Failed to fetch progression:', error);
    return NextResponse.json({ message: 'Failed to fetch progression' }, { status: 500 });
  }
}

/**
 * Updates a saved progression owned by the authenticated user.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = (await request.json()) as UpdateProgressionRequest;
    const {
      title,
      chords,
      pianoVoicings,
      generatorSnapshot,
      feel,
      scale,
      genre,
      notes,
      tags,
      isPublic,
    } = body;

    const existing = await prisma.progression.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      select: { id: true, isPublic: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
    }

    if (isPublic === true && !accessContext.entitlements.canSharePublicly) {
      return createPlanLimitResponse({
        code: 'PUBLIC_SHARING_NOT_AVAILABLE',
        message: 'Public sharing is not available on your current plan',
        plan: accessContext.plan,
      });
    }

    if (isPublic === true && !existing.isPublic) {
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

    const progression = await prisma.progression.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(chords !== undefined && { chords: toPrismaJson(chords) }),
        ...(pianoVoicings !== undefined && { pianoVoicings: toPrismaJson(pianoVoicings) }),
        ...(generatorSnapshot !== undefined && {
          generatorSnapshot: toPrismaJson(generatorSnapshot),
        }),
        ...(feel !== undefined && { feel }),
        ...(scale !== undefined && { scale }),
        ...(genre !== undefined && { genre }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(progression);
  } catch (error) {
    console.error('Failed to update progression:', error);
    return NextResponse.json({ message: 'Failed to update progression' }, { status: 500 });
  }
}

/**
 * Deletes a saved progression owned by the authenticated user.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = checkCsrfToken(_request);
    if (csrfError) {
      return csrfError;
    }

    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Admin can delete any progression; other users can only delete their own.
    const deleteWhere =
      session.role === 'ADMIN'
        ? { id }
        : {
            id,
            userId: session.userId,
          };

    const result = await prisma.progression.deleteMany({
      where: deleteWhere,
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete progression:', error);
    return NextResponse.json({ message: 'Failed to delete progression' }, { status: 500 });
  }
}
