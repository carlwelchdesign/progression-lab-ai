import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getSessionFromRequest } from '../../../../lib/auth';
import { checkCsrfToken } from '../../../../lib/csrf';
import { getAccessContextForSession, hasReachedLimit } from '../../../../lib/entitlements';
import { prisma } from '../../../../lib/prisma';
import { createPlanLimitResponse } from '../../../../lib/subscriptionResponses';
import type { UpdateArrangementRequest } from '../../../../lib/types';

const toPrismaJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function getPublicShareCount(userId: string): Promise<number> {
  const [publicProgressions, publicArrangements] = await Promise.all([
    prisma.progression.count({ where: { userId, isPublic: true } }),
    prisma.arrangement.count({ where: { userId, isPublic: true } }),
  ]);

  return publicProgressions + publicArrangements;
}

/**
 * Fetches a saved arrangement for the authenticated user.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const accessContext = await getAccessContextForSession(session);
    if (!accessContext) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const arrangement = await prisma.arrangement.findFirst({
      where: {
        id,
        ...(session.role === 'ADMIN' ? {} : { userId: session.userId }),
      },
    });

    if (!arrangement) {
      return NextResponse.json({ message: 'Arrangement not found' }, { status: 404 });
    }

    return NextResponse.json(arrangement);
  } catch (error) {
    console.error('Failed to fetch arrangement:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

    return NextResponse.json({ message: 'Failed to fetch arrangement' }, { status: 500 });
  }
}

/**
 * Updates a saved arrangement owned by the authenticated user.
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

    const { id } = await params;
    const body = (await request.json()) as UpdateArrangementRequest;
    const { title, timeline, playbackSnapshot, sourceChords, notes, tags, isPublic } = body;

    const existing = await prisma.arrangement.findFirst({
      where: {
        id,
        ...(session.role === 'ADMIN' ? {} : { userId: session.userId }),
      },
      select: { id: true, isPublic: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Arrangement not found' }, { status: 404 });
    }

    const shouldEnforcePlanLimits = existing.userId === session.userId;

    if (
      shouldEnforcePlanLimits &&
      isPublic === true &&
      !accessContext.entitlements.canSharePublicly
    ) {
      return createPlanLimitResponse({
        code: 'PUBLIC_SHARING_NOT_AVAILABLE',
        message: 'Public sharing is not available on your current plan',
        plan: accessContext.plan,
      });
    }

    if (shouldEnforcePlanLimits && isPublic === true && !existing.isPublic) {
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

    const arrangement = await prisma.arrangement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(timeline !== undefined && { timeline: toPrismaJson(timeline) }),
        ...(playbackSnapshot !== undefined && { playbackSnapshot: toPrismaJson(playbackSnapshot) }),
        ...(sourceChords !== undefined && { sourceChords: toPrismaJson(sourceChords) }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(arrangement);
  } catch (error) {
    console.error('Failed to update arrangement:', error);

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

    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      return NextResponse.json(
        {
          message: 'Failed to update arrangement',
          detail: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Failed to update arrangement' }, { status: 500 });
  }
}

/**
 * Deletes a saved arrangement owned by the authenticated user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = checkCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await prisma.arrangement.deleteMany({
      where: {
        id,
        ...(session.role === 'ADMIN' ? {} : { userId: session.userId }),
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'Arrangement not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete arrangement:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

    return NextResponse.json({ message: 'Failed to delete arrangement' }, { status: 500 });
  }
}
