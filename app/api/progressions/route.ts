import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getSessionFromRequest } from '../../../lib/auth';
import { checkCsrfToken } from '../../../lib/csrf';
import {
  buildDefaultProgressionTitle,
  getPrimaryProgressionFromSnapshot,
} from '../../../lib/generatorSnapshot';
import { prisma } from '../../../lib/prisma';
import type { CreateProgressionRequest, GeneratorSnapshot } from '../../../lib/types';

const hasGeneratorSnapshot = (
  value: CreateProgressionRequest['generatorSnapshot'],
): value is GeneratorSnapshot => !!value;

const toPrismaJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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

    // Only ADMIN users may mark a progression as public (Examples).
    const resolvedIsPublic = isPublic && session.role === 'ADMIN';

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
      const { generatorSnapshot: _omitted, ...fallbackData } = progressionCreateData;
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

    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      return NextResponse.json(
        {
          message: 'Failed to save progression',
          detail: error.message,
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
