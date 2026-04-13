'use client';

import { useCallback, useEffect, useState } from 'react';
import { createCsrfHeaders, ensureCsrfCookie } from '../../../lib/csrfClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LessonProgressRow = {
  id: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  attempts: number;
  metadata: Record<string, unknown> | null;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLessonProgress() {
  const [progressMap, setProgressMap] = useState<Map<string, LessonProgressRow>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/lessons/progress', { credentials: 'include' });
        if (res.ok) {
          const rows = (await res.json()) as LessonProgressRow[];
          setProgressMap(new Map(rows.map((r) => [r.lessonId, r])));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const postProgress = useCallback(
    async (lessonId: string, completed: boolean, metadata?: Record<string, unknown>) => {
      // Optimistic update so the UI reflects completion immediately
      setProgressMap((prev) => {
        const existing = prev.get(lessonId);
        const optimistic: LessonProgressRow = {
          id: existing?.id ?? '',
          lessonId,
          completed: completed || (existing?.completed ?? false),
          completedAt: completed
            ? (existing?.completedAt ?? new Date().toISOString())
            : (existing?.completedAt ?? null),
          attempts: (existing?.attempts ?? 0) + 1,
          metadata: metadata ?? existing?.metadata ?? null,
        };
        return new Map(prev).set(lessonId, optimistic);
      });

      try {
        await ensureCsrfCookie();
        const res = await fetch('/api/lessons/progress', {
          method: 'POST',
          credentials: 'include',
          headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ lessonId, completed, metadata }),
        });
        if (res.ok) {
          const row = (await res.json()) as LessonProgressRow;
          setProgressMap((prev) => new Map(prev).set(lessonId, row));
        }
      } catch {
        // non-fatal — progress saving is best-effort
      }
    },
    [],
  );

  const markComplete = useCallback(
    (lessonId: string, metadata?: Record<string, unknown>) =>
      postProgress(lessonId, true, metadata),
    [postProgress],
  );

  const recordAttempt = useCallback(
    (lessonId: string, metadata?: Record<string, unknown>) =>
      postProgress(lessonId, false, metadata),
    [postProgress],
  );

  return {
    progressMap,
    loading,
    isCompleted: (lessonId: string) => progressMap.get(lessonId)?.completed ?? false,
    markComplete,
    recordAttempt,
  };
}
