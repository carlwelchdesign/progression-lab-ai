import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getSessionFromRequest } from '../../../lib/auth';
import { checkCsrfToken } from '../../../lib/csrf';
import { prisma } from '../../../lib/prisma';
import type { CreateArrangementRequest } from '../../../lib/types';

const toPrismaJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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

    const body = (await request.json()) as CreateArrangementRequest;
    const {
      title,
      timeline,
      playbackSnapshot,
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

    const resolvedIsPublic = isPublic && session.role === 'ADMIN';

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
