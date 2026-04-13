import type { MusicianProfile, PrismaClient } from '@prisma/client';

import type { MusicianProfileSummary } from '../types';

type MusicianProfileRecord = MusicianProfileSummary & {
  aliases: string[];
  isActive: boolean;
  promptTemplate: string;
  promptVersion: number;
};

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

export async function listActiveMusicians(
  prismaClient: PrismaClient,
): Promise<MusicianProfileRecord[]> {
  const records = await prismaClient.musicianProfile.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return records.map(mapMusicianProfile);
}

export async function findMusicianBySlug(
  prismaClient: PrismaClient,
  slug: string,
): Promise<MusicianProfileRecord | null> {
  const record = await prismaClient.musicianProfile.findUnique({
    where: { slug },
  });

  return record ? mapMusicianProfile(record) : null;
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
