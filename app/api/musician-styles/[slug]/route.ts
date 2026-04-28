import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { getCurriculumByUserAndMusician } from '../../../../features/musician-styles/services/curriculumRepository';
import { findMusicianBySlug } from '../../../../features/musician-styles/services/musicianRepository';

/**
 * GET /api/musician-styles/[slug]
 * Scaffold endpoint for musician details.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const musician = await findMusicianBySlug(prisma, slug);

    if (!musician) {
      return NextResponse.json({ message: 'Musician not found' }, { status: 404 });
    }

    const curriculum = await getCurriculumByUserAndMusician(prisma, session.userId, musician.id);
    const curriculumStale =
      curriculum !== null ? curriculum.promptVersion < musician.promptVersion : false;

    return NextResponse.json({
      musician,
      curriculum: curriculum?.curriculumJson ?? null,
      curriculumStale,
    });
  } catch (error) {
    console.error('Failed to fetch musician style detail:', error);
    return NextResponse.json({ message: 'Failed to fetch musician style detail' }, { status: 500 });
  }
}
