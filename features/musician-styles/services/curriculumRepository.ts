import type { GeneratedCurriculum, PrismaClient } from '@prisma/client';

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

function isSkillLevel(value: string): value is SkillLevel {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

function mapCurriculumRecord(record: GeneratedCurriculum): GeneratedCurriculumRecord {
  return {
    id: record.id,
    userId: record.userId,
    musicianId: record.musicianId,
    promptVersion: record.promptVersion,
    skillLevel: isSkillLevel(record.skillLevel) ? record.skillLevel : 'beginner',
    curriculumJson: record.curriculumJson as GeneratedCurriculumData,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getCurriculumByUserAndMusician(
  prismaClient: PrismaClient,
  userId: string,
  musicianId: string,
): Promise<GeneratedCurriculumRecord | null> {
  const record = await prismaClient.generatedCurriculum.findUnique({
    where: {
      userId_musicianId: {
        userId,
        musicianId,
      },
    },
  });

  return record ? mapCurriculumRecord(record) : null;
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
  const record = await prismaClient.generatedCurriculum.upsert({
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

  return mapCurriculumRecord(record);
}
