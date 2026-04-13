import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import {
  listActiveMusicians,
  searchMusicians,
} from '../../../features/musician-styles/services/musicianRepository';

/**
 * GET /api/musician-styles
 * Scaffold endpoint for musician roster/search.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchText = _request.nextUrl.searchParams.get('search')?.trim() ?? '';
    if (searchText.length >= 2) {
      const results = await searchMusicians(prisma, searchText);
      return NextResponse.json(results);
    }

    const musicians = await listActiveMusicians(prisma);
    const grouped = musicians.reduce<Record<string, typeof musicians>>((acc, musician) => {
      if (!acc[musician.genre]) {
        acc[musician.genre] = [];
      }

      acc[musician.genre].push(musician);
      return acc;
    }, {});

    const genres = Object.entries(grouped).map(([label, items]) => ({
      label,
      musicians: items,
    }));

    return NextResponse.json({ genres });
  } catch (error) {
    console.error('Failed to list musician styles:', error);
    return NextResponse.json({ message: 'Failed to list musician styles' }, { status: 500 });
  }
}
