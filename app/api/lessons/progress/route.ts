import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { checkCsrfToken } from '../../../../lib/csrf';
import { prisma } from '../../../../lib/prisma';
import { saveLessonProgress } from '../../../../features/musician-styles/services/lessonProgressService';

/**
 * POST /api/lessons/progress
 * Scaffold endpoint for lesson progress updates.
 */
export async function POST(_request: NextRequest) {
  const csrfError = checkCsrfToken(_request);
  if (csrfError) {
    return csrfError;
  }

  const session = getSessionFromRequest(_request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = (await _request.json().catch(() => ({}))) as {
    lessonId?: string;
    completed?: boolean;
    stepIndex?: number;
    attempts?: number;
    autoAdvance?: boolean;
    metadata?: Record<string, unknown>;
  };

  if (!body.lessonId) {
    return NextResponse.json({ message: 'lessonId is required' }, { status: 400 });
  }

  const result = await saveLessonProgress(prisma, {
    userId: session.userId,
    lessonId: body.lessonId,
    completed: Boolean(body.completed),
    stepIndex: body.stepIndex ?? 0,
    attempts: body.attempts ?? 1,
    autoAdvance: body.autoAdvance,
    metadata: body.metadata,
  });

  return NextResponse.json(result);
}
