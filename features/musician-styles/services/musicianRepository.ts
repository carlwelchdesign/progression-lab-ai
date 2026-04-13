import type { PrismaClient } from '@prisma/client';

import type { MusicianProfileSummary } from '../types';

type MusicianProfileRecord = MusicianProfileSummary & {
  aliases: string[];
  isActive: boolean;
  promptTemplate: string;
  promptVersion: number;
};

type MusicianProfileModel = {
  findMany(args: {
    where?: { isActive?: boolean };
    orderBy?: { sortOrder: 'asc' | 'desc' };
    take?: number;
  }): Promise<MusicianProfileRecord[]>;
  findUnique(args: { where: { slug: string } }): Promise<MusicianProfileRecord | null>;
  findFirst(args: { where: { slug: string } }): Promise<MusicianProfileRecord | null>;
  create(args: { data: Omit<MusicianProfileRecord, 'id'> }): Promise<MusicianProfileRecord>;
};

type MusicianClient = PrismaClient & {
  musicianProfile: MusicianProfileModel;
};

export async function listActiveMusicians(
  prismaClient: PrismaClient,
): Promise<MusicianProfileRecord[]> {
  const prisma = prismaClient as unknown as MusicianClient;

  return prisma.musicianProfile.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function findMusicianBySlug(
  prismaClient: PrismaClient,
  slug: string,
): Promise<MusicianProfileRecord | null> {
  const prisma = prismaClient as unknown as MusicianClient;

  return prisma.musicianProfile.findUnique({
    where: { slug },
  });
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
