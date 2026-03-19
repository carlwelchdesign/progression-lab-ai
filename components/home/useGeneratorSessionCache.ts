import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { UseFormReset } from 'react-hook-form';

import { GENRE_OPTIONS } from '../../lib/formOptions';
import type { Adventurousness, ChordSuggestionResponse } from '../../lib/types';
import type { GeneratorFormData } from './types';

const GENERATOR_CACHE_KEY = 'generatorCache';

type GeneratorCache = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  adventurousness: Adventurousness;
  tempoBpm?: number;
  data: ChordSuggestionResponse;
};

type UseGeneratorSessionCacheParams = {
  reset: UseFormReset<GeneratorFormData>;
  setData: Dispatch<SetStateAction<ChordSuggestionResponse | null>>;
  setIsLoadedFromSavedProgression: Dispatch<SetStateAction<boolean>>;
};

type UseGeneratorSessionCacheResult = {
  isRestoringState: boolean;
  cacheGeneratorResult: (formData: GeneratorFormData, data: ChordSuggestionResponse) => void;
};

export default function useGeneratorSessionCache({
  reset,
  setData,
  setIsLoadedFromSavedProgression,
}: UseGeneratorSessionCacheParams): UseGeneratorSessionCacheResult {
  const [isRestoringState, setIsRestoringState] = useState(true);

  useEffect(() => {
    try {
      const rawLoadedProgression = sessionStorage.getItem('loadedProgression');

      if (rawLoadedProgression) {
        try {
          const parsed = JSON.parse(rawLoadedProgression) as {
            title?: string;
            chords?: Array<{ name?: string } | string>;
            pianoVoicings?: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
            feel?: string;
            scale?: string;
            genre?: string;
          };

          const normalizedGenre = parsed.genre?.trim() ?? '';
          const hasMatchingGenreOption = GENRE_OPTIONS.some(
            (option) => option.value === normalizedGenre,
          );
          let restoredGenre = '';
          if (normalizedGenre.length > 0) {
            restoredGenre = hasMatchingGenreOption ? normalizedGenre : 'custom';
          }
          const restoredCustomGenre =
            normalizedGenre.length === 0 || hasMatchingGenreOption ? '' : normalizedGenre;

          const chordNames = (parsed.chords ?? [])
            .map((chord) => (typeof chord === 'string' ? chord : (chord.name ?? '').trim()))
            .filter(Boolean);

          if (chordNames.length > 0) {
            reset({
              seedChords: chordNames.join(', '),
              mood: parsed.feel || '',
              mode: parsed.scale || '',
              customMode: '',
              genre: restoredGenre,
              customGenre: restoredCustomGenre,
              adventurousness: 'balanced',
              tempoBpm: 100,
            });
          }

          if (chordNames.length > 0) {
            setIsLoadedFromSavedProgression(true);
            const loadedVoicings = Array.isArray(parsed.pianoVoicings) ? parsed.pianoVoicings : [];

            setData((prev) => ({
              inputSummary: {
                seedChords: chordNames,
                mood: parsed.feel ?? prev?.inputSummary.mood ?? null,
                mode: parsed.scale ?? prev?.inputSummary.mode ?? null,
                genre: parsed.genre ?? prev?.inputSummary.genre ?? null,
                instrument: 'both',
                adventurousness: prev?.inputSummary.adventurousness ?? null,
              },
              nextChordSuggestions: prev?.nextChordSuggestions ?? [],
              progressionIdeas: [
                {
                  label: parsed.title || 'Loaded progression',
                  chords: chordNames,
                  feel: parsed.feel || 'Loaded from saved progression',
                  performanceTip: null,
                  pianoVoicings: loadedVoicings,
                },
              ],
              structureSuggestions: prev?.structureSuggestions ?? [],
            }));
          }
        } catch (err) {
          console.error('Failed to load saved progression from session storage:', err);
        } finally {
          sessionStorage.removeItem('loadedProgression');
          sessionStorage.removeItem(GENERATOR_CACHE_KEY);
        }

        return;
      }

      const rawGeneratorCache = sessionStorage.getItem(GENERATOR_CACHE_KEY);
      if (!rawGeneratorCache) {
        return;
      }

      try {
        const parsedCache = JSON.parse(rawGeneratorCache) as GeneratorCache;

        reset({
          seedChords: parsedCache.seedChords,
          mood: parsedCache.mood,
          mode: parsedCache.mode,
          customMode: parsedCache.customMode,
          genre: parsedCache.genre,
          customGenre: parsedCache.customGenre,
          adventurousness: parsedCache.adventurousness,
          tempoBpm: parsedCache.tempoBpm ?? 100,
        });

        setIsLoadedFromSavedProgression(false);
        setData(parsedCache.data);
      } catch (err) {
        console.error('Failed to restore generator cache from session storage:', err);
        sessionStorage.removeItem(GENERATOR_CACHE_KEY);
      }
    } finally {
      setIsRestoringState(false);
    }
  }, [reset, setData, setIsLoadedFromSavedProgression]);

  const cacheGeneratorResult = (formData: GeneratorFormData, data: ChordSuggestionResponse) => {
    const cachePayload: GeneratorCache = {
      seedChords: formData.seedChords,
      mood: formData.mood,
      mode: formData.mode,
      customMode: formData.customMode,
      genre: formData.genre,
      customGenre: formData.customGenre,
      adventurousness: formData.adventurousness,
      tempoBpm: formData.tempoBpm,
      data,
    };

    sessionStorage.setItem(GENERATOR_CACHE_KEY, JSON.stringify(cachePayload));
  };

  return {
    isRestoringState,
    cacheGeneratorResult,
  };
}
