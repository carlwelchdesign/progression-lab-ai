import type { PrismaClient } from '@prisma/client';

import { upsertLessonProgress } from './lessonProgressRepository';

export async function saveLessonProgress(
  prismaClient: PrismaClient,
  input: {
    userId: string;
    lessonId: string;
    completed: boolean;
    attempts: number;
    stepIndex: number;
    autoAdvance?: boolean;
    metadata?: Record<string, unknown>;
  },
): Promise<{
  id: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  attempts: number;
  nextStepIndex: number | null;
}> {
  const metadata = {
    stepIndex: input.stepIndex,
    autoAdvance: Boolean(input.autoAdvance),
    ...(input.metadata ?? {}),
  };

  const record = await upsertLessonProgress(prismaClient, {
    userId: input.userId,
    lessonId: input.lessonId,
    completed: input.completed,
    attempts: input.attempts,
    metadata,
  });

  return {
    id: record.id,
    lessonId: record.lessonId,
    completed: record.completed,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    attempts: record.attempts,
    nextStepIndex: input.completed ? null : input.stepIndex + 1,
  };
}
