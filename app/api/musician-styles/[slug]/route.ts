import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import type { MusicianStyleResponse } from '../../../../features/musician-styles/types';

/**
 * GET /api/musician-styles/[slug]
 * Returns the musician profile + the user's cached curriculum (if any).
 * curriculumStale=true when the cached curriculum was generated with an older prompt version.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  const musician = await prisma.musicianProfile.findUnique({
    where: { slug, isActive: true },
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
      promptVersion: true,
      sortOrder: true,
    },
  });

  if (!musician) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const cached = await prisma.generatedCurriculum.findUnique({
    where: { userId_musicianId: { userId: session.userId, musicianId: musician.id } },
  });

  const response: MusicianStyleResponse = {
    musician,
    curriculum: cached ? (cached.curriculumJson as MusicianStyleResponse['curriculum']) : null,
    curriculumStale: cached ? cached.promptVersion !== musician.promptVersion : false,
  };

  return NextResponse.json(response);
}
