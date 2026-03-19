import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import type { UpdateProgressionRequest } from '../../../../lib/types';

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
    return NextResponse.json({ message: 'Failed to fetch progression', error }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateProgressionRequest;
    const { title, chords, pianoVoicings, feel, scale, genre, notes, tags, isPublic } = body;

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
        ...(chords !== undefined && { chords }),
        ...(pianoVoicings !== undefined && { pianoVoicings }),
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
    return NextResponse.json({ message: 'Failed to update progression', error }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await prisma.progression.deleteMany({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete progression:', error);
    return NextResponse.json({ message: 'Failed to delete progression', error }, { status: 500 });
  }
}
