import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/prisma';
import type { UpdateProgressionRequest } from '../../../../lib/types';

const DEMO_USER_ID = 'demo-user-id';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const progression = await prisma.progression.findFirst({
      where: {
        id,
        userId: DEMO_USER_ID,
      },
    });

    if (!progression) {
      return NextResponse.json(
        { message: 'Progression not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(progression);
  } catch (error) {
    console.error('Failed to fetch progression:', error);
    return NextResponse.json(
      { message: 'Failed to fetch progression', error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateProgressionRequest;
    const { title, chords, pianoVoicings, feel, scale, notes, tags, isPublic } = body;

    const progression = await prisma.progression.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(chords !== undefined && { chords }),
        ...(pianoVoicings !== undefined && { pianoVoicings }),
        ...(feel !== undefined && { feel }),
        ...(scale !== undefined && { scale }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(progression);
  } catch (error) {
    console.error('Failed to update progression:', error);
    return NextResponse.json(
      { message: 'Failed to update progression', error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.progression.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete progression:', error);
    return NextResponse.json(
      { message: 'Failed to delete progression', error },
      { status: 500 }
    );
  }
}
