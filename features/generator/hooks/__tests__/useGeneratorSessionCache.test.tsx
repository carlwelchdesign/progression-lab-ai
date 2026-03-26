import { renderHook, waitFor } from '@testing-library/react';
import type { UseFormReset } from 'react-hook-form';

import type { ChordSuggestionResponse } from '../../../../lib/types';
import type { GeneratorFormData } from '../../types';
import useGeneratorSessionCache from '../useGeneratorSessionCache';
import { applyPlaybackSettings, sanitizePlaybackSettings } from '../../lib/playbackSettingsModel';

jest.mock('../../lib/playbackSettingsModel', () => {
  const actual = jest.requireActual('../../lib/playbackSettingsModel');

  return {
    ...actual,
    applyPlaybackSettings: jest.fn(),
    sanitizePlaybackSettings: jest.fn((input) => input),
  };
});

const mockSuggestionData: ChordSuggestionResponse = {
  inputSummary: {
    seedChords: ['Cmaj7', 'Am7'],
    mood: 'warm',
    mode: 'ionian',
    genre: 'neo soul',
    styleReference: null,
    instrument: 'both',
    adventurousness: 'balanced',
  },
  nextChordSuggestions: [],
  progressionIdeas: [
    {
      label: 'Idea 1',
      chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
      feel: 'Smooth',
      performanceTip: null,
      pianoVoicings: [],
    },
  ],
  structureSuggestions: [],
};

describe('useGeneratorSessionCache', () => {
  const reset = jest.fn() as unknown as UseFormReset<GeneratorFormData>;
  const setData = jest.fn();
  const setIsLoadedFromSavedProgression = jest.fn();

  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  it('restores generator cache and migrates legacy top-level roomSize', async () => {
    sessionStorage.setItem(
      'generatorCache',
      JSON.stringify({
        seedChords: 'Cmaj7, Am7',
        mood: 'warm',
        mode: 'ionian',
        customMode: '',
        genre: 'jazz',
        customGenre: '',
        styleReference: 'Barry Harris',
        adventurousness: 'balanced',
        data: mockSuggestionData,
        playbackSettings: { reverb: 0.45 },
        roomSize: 0.78,
      }),
    );

    const { result } = renderHook(() =>
      useGeneratorSessionCache({
        reset,
        setData,
        setIsLoadedFromSavedProgression,
        playbackSettings: {} as never,
        playbackSettingsSetters: {} as never,
      }),
    );

    await waitFor(() => {
      expect(result.current.isRestoringState).toBe(false);
    });

    expect(reset).toHaveBeenCalledWith({
      seedChords: 'Cmaj7, Am7',
      mood: 'warm',
      mode: 'ionian',
      customMode: '',
      genre: 'jazz',
      customGenre: '',
      styleReference: 'Barry Harris',
      adventurousness: 'balanced',
      tempoBpm: 100,
    });
    expect(setIsLoadedFromSavedProgression).toHaveBeenCalledWith(false);
    expect(setData).toHaveBeenCalledWith(mockSuggestionData);
    expect(sanitizePlaybackSettings).toHaveBeenCalledWith({
      reverb: 0.45,
      roomSize: 0.78,
    });
    expect(applyPlaybackSettings).toHaveBeenCalledTimes(1);
    expect(result.current.hasRestoredSessionData).toBe(true);
  });

  it('restores loaded progression and clears bootstrap/session cache keys', async () => {
    sessionStorage.setItem(
      'loadedProgression',
      JSON.stringify({
        title: 'Saved Progression',
        chords: ['Dm7', { name: 'G7' }, { name: 'Cmaj7' }],
        feel: 'floating',
        scale: 'dorian',
        genre: 'my custom style',
      }),
    );
    sessionStorage.setItem('generatorCache', JSON.stringify({ stale: true }));

    const { result } = renderHook(() =>
      useGeneratorSessionCache({
        reset,
        setData,
        setIsLoadedFromSavedProgression,
        playbackSettings: {} as never,
        playbackSettingsSetters: {} as never,
      }),
    );

    await waitFor(() => {
      expect(result.current.isRestoringState).toBe(false);
    });

    expect(reset).toHaveBeenCalledWith({
      seedChords: 'Dm7, G7, Cmaj7',
      mood: 'floating',
      mode: 'dorian',
      customMode: '',
      genre: 'custom',
      customGenre: 'my custom style',
      styleReference: '',
      adventurousness: 'balanced',
      tempoBpm: 100,
    });
    expect(setIsLoadedFromSavedProgression).toHaveBeenCalledWith(true);
    expect(setData).toHaveBeenCalledWith(expect.any(Function));

    const updateFromBootstrap = setData.mock.calls[0][0] as (
      prev: ChordSuggestionResponse | null,
    ) => ChordSuggestionResponse;
    const updatedData = updateFromBootstrap(mockSuggestionData);

    expect(updatedData.progressionIdeas[0].label).toBe('Saved Progression');
    expect(updatedData.progressionIdeas[0].chords).toEqual(['Dm7', 'G7', 'Cmaj7']);
    expect(sessionStorage.getItem('loadedProgression')).toBeNull();
    expect(sessionStorage.getItem('generatorCache')).toBeNull();
    expect(applyPlaybackSettings).not.toHaveBeenCalled();
    expect(result.current.hasRestoredSessionData).toBe(true);
  });
});
