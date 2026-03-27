import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { checkCsrfToken } from '../../../../lib/csrf';
import { prisma } from '../../../../lib/prisma';
import type { UpdateProgressionRequest } from '../../../../lib/types';

const toPrismaJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
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
