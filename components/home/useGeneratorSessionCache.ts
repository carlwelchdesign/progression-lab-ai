import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { UseFormReset } from 'react-hook-form';

import { GENRE_OPTIONS } from '../../lib/formOptions';
import type { Adventurousness, ChordSuggestionResponse } from '../../lib/types';
import type { GeneratorFormData } from './types';
import {
  applyPlaybackSettings,
  type PlaybackSettings,
  type PlaybackSettingsSetters,
  sanitizePlaybackSettings,
} from './playbackSettingsModel';

const GENERATOR_CACHE_KEY = 'generatorCache';

const LOADED_PROGRESSION_KEY = 'loadedProgression';

/**
 * Session payload persisted after generating results.
 */
type GeneratorCache = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  styleReference?: string;
  adventurousness: Adventurousness;
  tempoBpm?: number;
  playbackSettings?: Partial<PlaybackSettings>;
  // Backward compatibility for the prior cache format.
  roomSize?: number;
  data: ChordSuggestionResponse;
};

type LoadedProgressionPayload = {
  title?: string;
  chords?: Array<{ name?: string } | string>;
  pianoVoicings?: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
  feel?: string;
  scale?: string;
  genre?: string;
};

type LoadedProgressionRestorePayload = {
  resetPayload: GeneratorFormData;
  dataUpdater: (prev: ChordSuggestionResponse | null) => ChordSuggestionResponse;
};

/**
 * Inputs required to restore and persist home page session state.
 */
type UseGeneratorSessionCacheParams = {
  reset: UseFormReset<GeneratorFormData>;
  setData: Dispatch<SetStateAction<ChordSuggestionResponse | null>>;
  setIsLoadedFromSavedProgression: Dispatch<SetStateAction<boolean>>;
  playbackSettings: PlaybackSettings;
  playbackSettingsSetters: PlaybackSettingsSetters;
};

/**
 * API returned by the generator session cache hook.
 */
type UseGeneratorSessionCacheResult = {
  isRestoringState: boolean;
  hasRestoredSessionData: boolean;
  cacheGeneratorResult: (formData: GeneratorFormData, data: ChordSuggestionResponse) => void;
};

const readSessionStorage = (key: string): string | null => sessionStorage.getItem(key);

const writeSessionStorage = (key: string, value: string): void => {
  sessionStorage.setItem(key, value);
};

const removeSessionStorage = (key: string): void => {
  sessionStorage.removeItem(key);
};

const removeSessionStorageKeys = (keys: string[]): void => {
  keys.forEach(removeSessionStorage);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseJsonObject = (raw: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(raw);
  if (!isObject(parsed)) {
    throw new Error('Expected JSON object payload');
  }

  return parsed;
};

const mapRestoredGenre = (rawGenre: string): { genre: string; customGenre: string } => {
  const normalizedGenre = rawGenre.trim();
  if (normalizedGenre.length === 0) {
    return { genre: '', customGenre: '' };
  }

  const hasMatchingGenreOption = GENRE_OPTIONS.some((option) => option.value === normalizedGenre);
  if (hasMatchingGenreOption) {
    return { genre: normalizedGenre, customGenre: '' };
  }

  return { genre: 'custom', customGenre: normalizedGenre };
};

const extractChordNames = (chords: LoadedProgressionPayload['chords']): string[] =>
  (chords ?? [])
    .map((chord) => (typeof chord === 'string' ? chord : (chord.name ?? '').trim()))
    .filter(Boolean);

const parseLoadedProgressionPayload = (
  rawLoadedProgression: string,
): LoadedProgressionRestorePayload | null => {
  const parsed = parseJsonObject(rawLoadedProgression) as LoadedProgressionPayload;
  const chordNames = extractChordNames(parsed.chords);

  if (chordNames.length === 0) {
    return null;
  }

  const { genre, customGenre } = mapRestoredGenre(parsed.genre ?? '');
  const loadedVoicings = Array.isArray(parsed.pianoVoicings) ? parsed.pianoVoicings : [];

  return {
    resetPayload: {
      seedChords: chordNames.join(', '),
      mood: parsed.feel || '',
      mode: parsed.scale || '',
      customMode: '',
      genre,
      customGenre,
      styleReference: '',
      adventurousness: 'balanced',
      tempoBpm: 100,
    },
    dataUpdater: (prev) => ({
      inputSummary: {
        seedChords: chordNames,
        mood: parsed.feel ?? prev?.inputSummary.mood ?? null,
        mode: parsed.scale ?? prev?.inputSummary.mode ?? null,
        genre: parsed.genre ?? prev?.inputSummary.genre ?? null,
        styleReference: prev?.inputSummary.styleReference ?? null,
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
    }),
  };
};

type ParsedGeneratorCache = {
  formData: GeneratorFormData;
  data: ChordSuggestionResponse;
  playbackSettings: PlaybackSettings;
};

const parseGeneratorCachePayload = (rawGeneratorCache: string): ParsedGeneratorCache => {
  const parsedCache = parseJsonObject(rawGeneratorCache) as GeneratorCache;

  return {
    formData: {
      seedChords: parsedCache.seedChords,
      mood: parsedCache.mood,
      mode: parsedCache.mode,
      customMode: parsedCache.customMode,
      genre: parsedCache.genre,
      customGenre: parsedCache.customGenre,
      styleReference: parsedCache.styleReference ?? '',
      adventurousness: parsedCache.adventurousness,
      tempoBpm: parsedCache.tempoBpm ?? 100,
    },
    data: parsedCache.data,
    playbackSettings: sanitizePlaybackSettings({
      ...parsedCache.playbackSettings,
      roomSize: parsedCache.playbackSettings?.roomSize ?? parsedCache.roomSize,
    }),
  };
};

const buildGeneratorCachePayload = (
  formData: GeneratorFormData,
  data: ChordSuggestionResponse,
  playbackSettings: PlaybackSettings,
): GeneratorCache => ({
  seedChords: formData.seedChords,
  mood: formData.mood,
  mode: formData.mode,
  customMode: formData.customMode,
  genre: formData.genre,
  customGenre: formData.customGenre,
  styleReference: formData.styleReference,
  adventurousness: formData.adventurousness,
  tempoBpm: formData.tempoBpm,
  playbackSettings,
  roomSize: playbackSettings.roomSize,
  data,
});

type RestoreGeneratorCacheParams = {
  rawGeneratorCache: string;
  reset: UseFormReset<GeneratorFormData>;
  setData: Dispatch<SetStateAction<ChordSuggestionResponse | null>>;
  setIsLoadedFromSavedProgression: Dispatch<SetStateAction<boolean>>;
  setHasRestoredSessionData: Dispatch<SetStateAction<boolean>>;
  playbackSettingsSetters: PlaybackSettingsSetters;
};

const restoreFromGeneratorCache = ({
  rawGeneratorCache,
  reset,
  setData,
  setIsLoadedFromSavedProgression,
  setHasRestoredSessionData,
  playbackSettingsSetters,
}: RestoreGeneratorCacheParams): void => {
  const parsedCache = parseGeneratorCachePayload(rawGeneratorCache);

  reset(parsedCache.formData);
  setIsLoadedFromSavedProgression(false);
  setHasRestoredSessionData(true);
  setData(parsedCache.data);
  applyPlaybackSettings(playbackSettingsSetters, parsedCache.playbackSettings);
};

type RestoreLoadedProgressionParams = {
  rawLoadedProgression: string;
  reset: UseFormReset<GeneratorFormData>;
  setData: Dispatch<SetStateAction<ChordSuggestionResponse | null>>;
  setIsLoadedFromSavedProgression: Dispatch<SetStateAction<boolean>>;
  setHasRestoredSessionData: Dispatch<SetStateAction<boolean>>;
};

const restoreFromLoadedProgression = ({
  rawLoadedProgression,
  reset,
  setData,
  setIsLoadedFromSavedProgression,
  setHasRestoredSessionData,
}: RestoreLoadedProgressionParams): void => {
  const parsed = parseLoadedProgressionPayload(rawLoadedProgression);
  if (!parsed) {
    return;
  }

  reset(parsed.resetPayload);
  setHasRestoredSessionData(true);
  setIsLoadedFromSavedProgression(true);
  setData(parsed.dataUpdater);
};

/**
 * Restores generator state from sessionStorage and provides a cache writer.
 *
 * The hook handles both current cache shape and older roomSize-only payloads,
 * and also supports the special saved progression bootstrap flow.
 */
export default function useGeneratorSessionCache({
  reset,
  setData,
  setIsLoadedFromSavedProgression,
  playbackSettings,
  playbackSettingsSetters,
}: UseGeneratorSessionCacheParams): UseGeneratorSessionCacheResult {
  const [isRestoringState, setIsRestoringState] = useState(true);
  const [hasRestoredSessionData, setHasRestoredSessionData] = useState(false);
  const playbackSettingsSettersRef = useRef(playbackSettingsSetters);

  useEffect(() => {
    playbackSettingsSettersRef.current = playbackSettingsSetters;
  }, [playbackSettingsSetters]);

  useEffect(() => {
    try {
      const rawLoadedProgression = readSessionStorage(LOADED_PROGRESSION_KEY);

      if (rawLoadedProgression) {
        try {
          restoreFromLoadedProgression({
            rawLoadedProgression,
            reset,
            setData,
            setIsLoadedFromSavedProgression,
            setHasRestoredSessionData,
          });
        } catch (err) {
          console.error('Failed to load saved progression from session storage:', err);
        } finally {
          removeSessionStorageKeys([LOADED_PROGRESSION_KEY, GENERATOR_CACHE_KEY]);
        }

        return;
      }

      const rawGeneratorCache = readSessionStorage(GENERATOR_CACHE_KEY);
      if (!rawGeneratorCache) {
        return;
      }

      try {
        restoreFromGeneratorCache({
          rawGeneratorCache,
          reset,
          setData,
          setIsLoadedFromSavedProgression,
          setHasRestoredSessionData,
          playbackSettingsSetters: playbackSettingsSettersRef.current,
        });
      } catch (err) {
        console.error('Failed to restore generator cache from session storage:', err);
        removeSessionStorage(GENERATOR_CACHE_KEY);
      }
    } finally {
      setIsRestoringState(false);
    }
  }, [reset, setData, setIsLoadedFromSavedProgression]);

  const cacheGeneratorResult = (formData: GeneratorFormData, data: ChordSuggestionResponse) => {
    const cachePayload = buildGeneratorCachePayload(formData, data, playbackSettings);
    writeSessionStorage(GENERATOR_CACHE_KEY, JSON.stringify(cachePayload));
  };

  return {
    isRestoringState,
    hasRestoredSessionData,
    cacheGeneratorResult,
  };
}
