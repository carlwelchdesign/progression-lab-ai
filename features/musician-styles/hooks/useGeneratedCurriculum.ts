'use client';

import { useCallback, useEffect, useState } from 'react';

import type { GeneratedCurriculumData, MusicianStyleResponse } from '../types';

export function useGeneratedCurriculum(slug: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<GeneratedCurriculumData | null>(null);
  const [curriculumStale, setCurriculumStale] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/musician-styles/${slug}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch curriculum context');
      }

      const data = (await response.json()) as MusicianStyleResponse;
      setCurriculum(data.curriculum);
      setCurriculumStale(data.curriculumStale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const generate = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/musician-styles/${slug}/curriculum`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate curriculum');
        }

        const data = (await response.json()) as GeneratedCurriculumData;
        setCurriculum(data);
        setCurriculumStale(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  const decideStaleCurriculum = useCallback(
    async (action: 'continue' | 'regenerate') => {
      if (action === 'regenerate') {
        await generate(true);
        return;
      }

      setCurriculumStale(false);
    },
    [generate],
  );

  const requestCustomMusician = useCallback(async (name: string, genre?: string) => {
    const response = await fetch('/api/musician-styles/request', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, genre }),
    });

    if (response.status === 409) {
      const data = (await response.json()) as { slug: string };
      return data.slug;
    }

    if (!response.ok) {
      throw new Error('Failed to request custom musician profile');
    }

    const data = (await response.json()) as { slug: string };
    return data.slug;
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    error,
    curriculum,
    curriculumStale,
    load,
    generate,
    decideStaleCurriculum,
    requestCustomMusician,
  };
}
