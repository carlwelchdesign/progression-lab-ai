import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { checkCsrfToken } from '../../../../lib/csrf';
import { prisma } from '../../../../lib/prisma';
import {
  generateMusicianProfile,
  slugifyMusicianName,
} from '../../../../features/musician-styles/services/profileGenerationService';

/**
 * POST /api/musician-styles/request
 * Scaffold endpoint for custom musician profile requests.
 */
export async function POST(_request: NextRequest) {
  try {
    const csrfError = checkCsrfToken(_request);
    if (csrfError) {
      return csrfError;
    }

    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await _request.json().catch(() => ({}))) as {
      name?: string;
      genre?: string;
    };

    const name = body.name?.trim() ?? '';
    if (!name) {
      return NextResponse.json(
        { code: 'INSUFFICIENT_INFORMATION', message: 'Musician name is required.' },
        { status: 422 },
      );
    }

    const requestedSlug = slugifyMusicianName(name);
    const existing = await prisma.musicianProfile.findUnique({ where: { slug: requestedSlug } });
    if (existing) {
      return NextResponse.json(
        { code: 'PROFILE_ALREADY_EXISTS', slug: existing.slug },
        { status: 409 },
      );
    }

    const profile = await generateMusicianProfile({ name, genre: body.genre?.trim() });
    if (!profile.displayName || !profile.slug) {
      return NextResponse.json(
        {
          code: 'INSUFFICIENT_INFORMATION',
          message: `We couldn't find enough information about ${name} as a pianist.`,
        },
        { status: 422 },
      );
    }

    const slug = slugifyMusicianName(profile.slug || name);
    const conflict = await prisma.musicianProfile.findUnique({ where: { slug } });
    if (conflict) {
      return NextResponse.json(
        { code: 'PROFILE_ALREADY_EXISTS', slug: conflict.slug },
        { status: 409 },
      );
    }

    const created = await prisma.musicianProfile.create({
      data: {
        slug,
        displayName: profile.displayName,
        aliases: profile.aliases,
        genre: profile.genre,
        era: profile.era,
        tagline: profile.tagline,
        styleDescription: profile.styleDescription,
        signatureTechniques: profile.signatureTechniques,
        exampleSongs: profile.exampleSongs,
        preferredKeys: profile.preferredKeys,
        promptTemplate: profile.promptTemplate,
        promptVersion: 1,
        isActive: false,
        isCustom: true,
        sortOrder: 999,
      },
    });

    return NextResponse.json(
      {
        slug: created.slug,
        displayName: created.displayName,
        genre: created.genre,
        era: created.era,
        tagline: created.tagline,
        isCustom: created.isCustom,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create custom musician profile:', error);
    return NextResponse.json(
      { message: 'Failed to create custom musician profile' },
      { status: 500 },
    );
  }
}
