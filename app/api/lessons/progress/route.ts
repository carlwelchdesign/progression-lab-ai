import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { checkCsrfToken } from '../../../../lib/csrf';
import { prisma } from '../../../../lib/prisma';

type UpsertProgressRequest = {
  lessonId: string;
  completed?: boolean;
  metadata?: Record<string, unknown>;
};

/**
 * GET /api/lessons/progress
 * Returns all LessonProgress rows for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const rows = await prisma.lessonProgress.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(rows);
}

/**
 * POST /api/lessons/progress
 * Upserts a LessonProgress row for (userId, lessonId).
 * Increments attempts on every call.
 * Sets completedAt when completed transitions to true for the first time.
 */
export async function POST(request: NextRequest) {
  const csrfError = checkCsrfToken(request);
  if (csrfError) return csrfError;

  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as UpsertProgressRequest;
  const { lessonId, completed, metadata } = body;

  if (!lessonId || typeof lessonId !== 'string') {
    return NextResponse.json({ message: 'lessonId is required' }, { status: 400 });
  }

  // Check if there's an existing row so we can preserve completedAt
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
  });

  const nowCompleted = completed === true;
  const wasAlreadyCompleted = existing?.completed ?? false;
  const completedAt =
    nowCompleted && !wasAlreadyCompleted ? new Date() : (existing?.completedAt ?? null);

  const row = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
    update: {
      completed: nowCompleted || wasAlreadyCompleted,
      completedAt,
      attempts: { increment: 1 },
      ...(metadata ? { metadata: metadata as object } : {}),
    },
    create: {
      userId: session.userId,
      lessonId,
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date() : null,
      attempts: 1,
      ...(metadata ? { metadata: metadata as object } : {}),
    },
  });

  return NextResponse.json(row, { status: existing ? 200 : 201 });
}
