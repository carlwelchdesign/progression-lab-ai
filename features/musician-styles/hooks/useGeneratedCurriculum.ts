'use client';

import { useCallback, useEffect, useState } from 'react';
import { createCsrfHeaders, ensureCsrfCookie } from '../../../lib/csrfClient';
import type { GeneratedCurriculumData, MusicianStyleResponse } from '../types';

type State =
  | { phase: 'loading' }
  | { phase: 'stale'; musician: MusicianStyleResponse['musician']; cached: GeneratedCurriculumData }
  | {
      phase: 'ready';
      musician: MusicianStyleResponse['musician'];
      curriculum: GeneratedCurriculumData;
    }
  | { phase: 'generating'; musician: MusicianStyleResponse['musician'] }
  | { phase: 'error'; message: string };

export function useGeneratedCurriculum(slug: string) {
  const [state, setState] = useState<State>({ phase: 'loading' });

  // Load profile + cached curriculum
  useEffect(() => {
    setState({ phase: 'loading' });
    void (async () => {
      try {
        const res = await fetch(`/api/musician-styles/${slug}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as MusicianStyleResponse;

        if (data.curriculum && !data.curriculumStale) {
          setState({ phase: 'ready', musician: data.musician, curriculum: data.curriculum });
        } else if (data.curriculum && data.curriculumStale) {
          setState({ phase: 'stale', musician: data.musician, cached: data.curriculum });
        } else {
          // No curriculum yet — auto-generate
          setState({ phase: 'generating', musician: data.musician });
          await generate(slug, data.musician, false, setState);
        }
      } catch {
        setState({ phase: 'error', message: 'Failed to load musician profile.' });
      }
    })();
  }, [slug]);

  const regenerate = useCallback(() => {
    if (state.phase !== 'ready' && state.phase !== 'stale') return;
    const musician = state.phase === 'ready' ? state.musician : state.musician;
    setState({ phase: 'generating', musician });
    void generate(slug, musician, true, setState);
  }, [slug, state]);

  const acceptStale = useCallback(() => {
    if (state.phase !== 'stale') return;
    setState({ phase: 'ready', musician: state.musician, curriculum: state.cached });
  }, [state]);

  return { state, regenerate, acceptStale };
}

async function generate(
  slug: string,
  musician: MusicianStyleResponse['musician'],
  force: boolean,
  setState: (s: State) => void,
) {
  try {
    await ensureCsrfCookie();
    const res = await fetch(`/api/musician-styles/${slug}/curriculum`, {
      method: 'POST',
      credentials: 'include',
      headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ force }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const curriculum = (await res.json()) as GeneratedCurriculumData;
    setState({ phase: 'ready', musician, curriculum });
  } catch {
    setState({ phase: 'error', message: 'Failed to generate curriculum. Please try again.' });
  }
}
