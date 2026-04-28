import type { PrismaClient } from '@prisma/client';

type LessonProgressRecord = {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt: Date | null;
  attempts: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

type LessonProgressModel = {
  upsert(args: {
    where: { userId_lessonId: { userId: string; lessonId: string } };
    update: {
      completed: boolean;
      completedAt: Date | null;
      attempts: number;
      metadata?: Record<string, unknown>;
    };
    create: {
      userId: string;
      lessonId: string;
      completed: boolean;
      completedAt: Date | null;
      attempts: number;
      metadata?: Record<string, unknown>;
    };
  }): Promise<LessonProgressRecord>;
  count(args: { where: { userId: string; completed?: boolean } }): Promise<number>;
  findMany(args: {
    where: { userId: string; lessonId?: { in: string[] }; completed?: boolean };
    orderBy?: { updatedAt: 'desc' | 'asc' };
    take?: number;
    select?: { lessonId: true };
  }): Promise<Array<LessonProgressRecord | { lessonId: string }>>;
};

type LessonProgressClient = PrismaClient & {
  lessonProgress: LessonProgressModel;
};

export async function upsertLessonProgress(
  prismaClient: PrismaClient,
  input: {
    userId: string;
    lessonId: string;
    completed: boolean;
    attempts: number;
    metadata?: Record<string, unknown>;
  },
): Promise<LessonProgressRecord> {
  const prisma = prismaClient as unknown as LessonProgressClient;
  const completedAt = input.completed ? new Date() : null;

  return prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: input.userId,
        lessonId: input.lessonId,
      },
    },
    update: {
      completed: input.completed,
      completedAt,
      attempts: input.attempts,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
    create: {
      userId: input.userId,
      lessonId: input.lessonId,
      completed: input.completed,
      completedAt,
      attempts: input.attempts,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
  });
}

export async function countCompletedLessons(
  prismaClient: PrismaClient,
  userId: string,
): Promise<number> {
  const prisma = prismaClient as unknown as LessonProgressClient;

  return prisma.lessonProgress.count({
    where: {
      userId,
      completed: true,
    },
  });
}

export async function listRecentLessonProgress(
  prismaClient: PrismaClient,
  userId: string,
  take = 20,
): Promise<LessonProgressRecord[]> {
  const prisma = prismaClient as unknown as LessonProgressClient;

  const rows = await prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take,
  });

  return rows as LessonProgressRecord[];
}

export async function getCompletedLessonIdSet(
  prismaClient: PrismaClient,
  userId: string,
  lessonIds: string[],
): Promise<Set<string>> {
  if (lessonIds.length === 0) {
    return new Set<string>();
  }

  const prisma = prismaClient as unknown as LessonProgressClient;
  const rows = await prisma.lessonProgress.findMany({
    where: {
      userId,
      completed: true,
      lessonId: { in: lessonIds },
    },
    select: { lessonId: true },
  });

  return new Set((rows as Array<{ lessonId: string }>).map((row) => row.lessonId));
}
