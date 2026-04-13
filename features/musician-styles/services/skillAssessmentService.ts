import type { PrismaClient } from '@prisma/client';

import type { PreviousLessonSummary, SkillLevel } from '../types';
import { countCompletedLessons, listRecentLessonProgress } from './lessonProgressRepository';

export function resolveSkillLevel(completedLessonCount: number): SkillLevel {
  if (completedLessonCount <= 2) {
    return 'beginner';
  }

  if (completedLessonCount <= 9) {
    return 'intermediate';
  }

  return 'advanced';
}

export async function assessUserSkillLevel(
  prismaClient: PrismaClient,
  userId: string,
): Promise<SkillLevel> {
  const completedCount = await countCompletedLessons(prismaClient, userId);
  return resolveSkillLevel(completedCount);
}

export async function summarizePreviousLessons(
  prismaClient: PrismaClient,
  userId: string,
): Promise<PreviousLessonSummary[]> {
  const progressRows = await listRecentLessonProgress(prismaClient, userId, 20);

  return progressRows
    .filter((row) => row.completed)
    .slice(0, 10)
    .map((row) => ({
      lessonId: row.lessonId,
      title: row.lessonId,
      conceptCovered: 'Previously completed lesson segment',
      skillLevel: resolveSkillLevel(10),
    }));
}
