import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

/**
 * GET /api/musician-styles
 * Returns the active musician roster (no curriculum, just profiles).
 */
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const musicians = await prisma.musicianProfile.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      displayName: true,
      genre: true,
      era: true,
      tagline: true,
      signatureTechniques: true,
      exampleSongs: true,
      preferredKeys: true,
      sortOrder: true,
    },
  });

  return NextResponse.json(musicians);
}
