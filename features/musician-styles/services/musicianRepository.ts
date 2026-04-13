import { Prisma, type MusicianProfile, type PrismaClient } from '@prisma/client';

import type { MusicianProfileSummary } from '../types';

type MusicianProfileRecord = MusicianProfileSummary & {
  aliases: string[];
  isActive: boolean;
  promptTemplate: string;
  promptVersion: number;
};

const legacyMusicianSelect = Prisma.validator<Prisma.MusicianProfileSelect>()({
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
  isActive: true,
  promptTemplate: true,
  promptVersion: true,
});

type LegacyMusicianProfile = Prisma.MusicianProfileGetPayload<{
  select: typeof legacyMusicianSelect;
}>;

function mapMusicianProfile(profile: MusicianProfile): MusicianProfileRecord {
  return {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.displayName,
    genre: profile.genre,
    era: profile.era,
    tagline: profile.tagline,
    signatureTechniques: profile.signatureTechniques,
    exampleSongs: profile.exampleSongs,
    preferredKeys: profile.preferredKeys,
    sortOrder: profile.sortOrder,
    isCustom: profile.isCustom,
    aliases: profile.aliases,
    isActive: profile.isActive,
    promptTemplate: profile.promptTemplate,
    promptVersion: profile.promptVersion,
  };
}

function isMissingColumnError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2022') {
    return false;
  }

  const column =
    typeof error.meta?.column === 'string'
      ? error.meta.column
      : typeof error.meta?.message === 'string'
        ? error.meta.message
        : '';

  return column.includes('aliases') || column.includes('isCustom');
}

function mapLegacyMusicianProfile(profile: LegacyMusicianProfile): MusicianProfileRecord {
  return {
    id: profile.id,
    slug: profile.slug,
    displayName: profile.displayName,
    genre: profile.genre,
    era: profile.era,
    tagline: profile.tagline,
    signatureTechniques: profile.signatureTechniques,
    exampleSongs: profile.exampleSongs,
    preferredKeys: profile.preferredKeys,
    sortOrder: profile.sortOrder,
    isCustom: false,
    aliases: [],
    isActive: profile.isActive,
    promptTemplate: profile.promptTemplate,
    promptVersion: profile.promptVersion,
  };
}

export async function listActiveMusicians(
  prismaClient: PrismaClient,
): Promise<MusicianProfileRecord[]> {
  try {
    const records = await prismaClient.musicianProfile.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return records.map(mapMusicianProfile);
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const records = await prismaClient.musicianProfile.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: legacyMusicianSelect,
    });

    return records.map(mapLegacyMusicianProfile);
  }
}

export async function findMusicianBySlug(
  prismaClient: PrismaClient,
  slug: string,
): Promise<MusicianProfileRecord | null> {
  try {
    const record = await prismaClient.musicianProfile.findUnique({
      where: { slug },
    });

    return record ? mapMusicianProfile(record) : null;
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const record = await prismaClient.musicianProfile.findUnique({
      where: { slug },
      select: legacyMusicianSelect,
    });

    return record ? mapLegacyMusicianProfile(record) : null;
  }
}

export async function searchMusicians(
  prismaClient: PrismaClient,
  searchText: string,
  limit = 8,
): Promise<MusicianProfileRecord[]> {
  const query = searchText.trim().toLowerCase();
  if (query.length < 2) {
    return [];
  }

  const activeMusicians = await listActiveMusicians(prismaClient);

  return activeMusicians
    .filter((musician) => {
      const names = [musician.displayName, ...musician.aliases].map((value) => value.toLowerCase());
      return names.some((value) => value.includes(query));
    })
    .slice(0, limit);
}
