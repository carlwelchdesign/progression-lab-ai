import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../../lib/prisma';

/**
 * Extracts first chord name from persisted progression chord JSON payload.
 */
function getFirstChordName(chords: Prisma.JsonValue): string {
  if (!Array.isArray(chords) || chords.length === 0) {
    return '';
  }

  const firstChord = chords[0];

  if (typeof firstChord === 'string') {
    return firstChord;
  }

  if (
    firstChord &&
    typeof firstChord === 'object' &&
    'name' in firstChord &&
    typeof firstChord.name === 'string'
  ) {
    return firstChord.name;
  }

  return '';
}

/**
 * Lists public shared progressions with optional tag and key filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const tagQuery = request.nextUrl.searchParams.get('tag')?.trim().toLowerCase() ?? '';
    const keyQuery = request.nextUrl.searchParams.get('key')?.trim().toLowerCase() ?? '';
    const tagQueries = tagQuery
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const keyQueries = keyQuery
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);

    const progressions = await prisma.progression.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 500,
    });

    const filteredProgressions = progressions.filter((progression) => {
      const matchesTag =
        tagQueries.length === 0 ||
        tagQueries.some((query) =>
          progression.tags.some((tag) => tag.toLowerCase().includes(query)),
        );

      const firstChordName = getFirstChordName(progression.chords).trim().toLowerCase();
      const matchesKey =
        keyQueries.length === 0 || keyQueries.some((query) => firstChordName.startsWith(query));

      return matchesTag && matchesKey;
    });

    return NextResponse.json(filteredProgressions);
  } catch (error) {
    console.error('Failed to fetch public progressions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch public progressions', error },
      { status: 500 },
    );
  }
}
