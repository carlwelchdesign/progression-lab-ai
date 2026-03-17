import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../lib/prisma';
import type { CreateProgressionRequest } from '../../../lib/types';

const DEMO_USER_ID = 'demo-user-id';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProgressionRequest;
    const {
      title,
      chords,
      pianoVoicings,
      feel,
      scale,
      notes,
      tags = [],
      isPublic = false,
    } = body;

    if (!title || !chords) {
      return NextResponse.json(
        { message: 'Title and chords are required' },
        { status: 400 }
      );
    }

    const progression = await prisma.progression.create({
      data: {
        title,
        chords,
        pianoVoicings,
        feel,
        scale,
        notes,
        tags,
        isPublic,
        userId: DEMO_USER_ID,
      },
    });

    return NextResponse.json(progression, { status: 201 });
  } catch (error) {
    console.error('Failed to save progression:', error);
    return NextResponse.json(
      { message: 'Failed to save progression', error },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const progressions = await prisma.progression.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(progressions);
  } catch (error) {
    console.error('Failed to fetch progressions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch progressions', error },
      { status: 500 }
    );
  }
}
