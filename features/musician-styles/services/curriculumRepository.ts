import type { PrismaClient } from '@prisma/client';

import type { GeneratedCurriculumData, SkillLevel } from '../types';

type GeneratedCurriculumRecord = {
  id: string;
  userId: string;
  musicianId: string;
  promptVersion: number;
  skillLevel: SkillLevel;
  curriculumJson: GeneratedCurriculumData;
  createdAt: Date;
  updatedAt: Date;
};

type GeneratedCurriculumModel = {
  findUnique(args: {
    where: { userId_musicianId: { userId: string; musicianId: string } };
  }): Promise<GeneratedCurriculumRecord | null>;
  upsert(args: {
    where: { userId_musicianId: { userId: string; musicianId: string } };
    update: {
      promptVersion: number;
      skillLevel: SkillLevel;
      curriculumJson: GeneratedCurriculumData;
    };
    create: {
      userId: string;
      musicianId: string;
      promptVersion: number;
      skillLevel: SkillLevel;
      curriculumJson: GeneratedCurriculumData;
    };
  }): Promise<GeneratedCurriculumRecord>;
};

type CurriculumClient = PrismaClient & {
  generatedCurriculum: GeneratedCurriculumModel;
};

export async function getCurriculumByUserAndMusician(
  prismaClient: PrismaClient,
  userId: string,
  musicianId: string,
): Promise<GeneratedCurriculumRecord | null> {
  const prisma = prismaClient as unknown as CurriculumClient;

  return prisma.generatedCurriculum.findUnique({
    where: {
      userId_musicianId: {
        userId,
        musicianId,
      },
    },
  });
}

export async function upsertCurriculum(
  prismaClient: PrismaClient,
  input: {
    userId: string;
    musicianId: string;
    promptVersion: number;
    skillLevel: SkillLevel;
    curriculumJson: GeneratedCurriculumData;
  },
): Promise<GeneratedCurriculumRecord> {
  const prisma = prismaClient as unknown as CurriculumClient;

  return prisma.generatedCurriculum.upsert({
    where: {
      userId_musicianId: {
        userId: input.userId,
        musicianId: input.musicianId,
      },
    },
    update: {
      promptVersion: input.promptVersion,
      skillLevel: input.skillLevel,
      curriculumJson: input.curriculumJson,
    },
    create: {
      userId: input.userId,
      musicianId: input.musicianId,
      promptVersion: input.promptVersion,
      skillLevel: input.skillLevel,
      curriculumJson: input.curriculumJson,
    },
  });
}
