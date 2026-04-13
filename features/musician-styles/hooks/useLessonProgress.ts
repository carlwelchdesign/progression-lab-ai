'use client';

import { useCallback } from 'react';

export function useLessonProgress() {
  const saveStep = useCallback(
    async (payload: {
      lessonId: string;
      completed: boolean;
      stepIndex: number;
      attempts: number;
      autoAdvance?: boolean;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await fetch('/api/lessons/progress', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save lesson progress');
      }

      return response.json() as Promise<{
        id: string;
        lessonId: string;
        completed: boolean;
        completedAt: string | null;
        attempts: number;
        nextStepIndex: number | null;
      }>;
    },
    [],
  );

  return { saveStep };
}
