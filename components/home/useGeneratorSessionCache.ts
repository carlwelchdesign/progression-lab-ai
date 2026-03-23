import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { UseFormReset } from 'react-hook-form';

import { GENRE_OPTIONS } from '../../lib/formOptions';
import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../../lib/audio';
import type { Adventurousness, ChordSuggestionResponse } from '../../lib/types';
import type { GeneratorFormData } from './types';

const GENERATOR_CACHE_KEY = 'generatorCache';

const PLAYBACK_STYLE_OPTIONS: PlaybackStyle[] = ['strum', 'block'];
const INVERSION_REGISTER_OPTIONS: PlaybackRegister[] = ['off', 'low', 'mid', 'high'];
const INSTRUMENT_OPTIONS: AudioInstrument[] = ['piano', 'rhodes'];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type PlaybackSettingsCache = {
  playbackStyle: PlaybackStyle;
  attack: number;
  decay: number;
  padVelocity: number;
  padSwing: number;
  padLatchMode: boolean;
  humanize: number;
  gate: number;
  inversionRegister: PlaybackRegister;
  instrument: AudioInstrument;
  octaveShift: number;
  reverbEnabled: boolean;
  reverb: number;
  chorusEnabled: boolean;
  chorus: number;
  chorusRate: number;
  chorusDepth: number;
  chorusDelayTime: number;
  feedbackDelayEnabled: boolean;
  feedbackDelay: number;
  feedbackDelayTime: number;
  feedbackDelayFeedback: number;
  tremoloEnabled: boolean;
  tremolo: number;
  tremoloFrequency: number;
  tremoloDepth: number;
  vibratoEnabled: boolean;
  vibrato: number;
  vibratoFrequency: number;
  vibratoDepth: number;
  phaserEnabled: boolean;
  phaser: number;
  phaserFrequency: number;
  phaserOctaves: number;
  phaserQ: number;
  roomSize: number;
};

type GeneratorCache = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  adventurousness: Adventurousness;
  tempoBpm?: number;
  playbackSettings?: PlaybackSettingsCache;
  // Backward compatibility for the prior cache format.
  roomSize?: number;
  data: ChordSuggestionResponse;
};

type UseGeneratorSessionCacheParams = {
  reset: UseFormReset<GeneratorFormData>;
  setData: Dispatch<SetStateAction<ChordSuggestionResponse | null>>;
  setIsLoadedFromSavedProgression: Dispatch<SetStateAction<boolean>>;
  playbackStyle: PlaybackStyle;
  setPlaybackStyle: Dispatch<SetStateAction<PlaybackStyle>>;
  attack: number;
  setAttack: Dispatch<SetStateAction<number>>;
  decay: number;
  setDecay: Dispatch<SetStateAction<number>>;
  padVelocity: number;
  setPadVelocity: Dispatch<SetStateAction<number>>;
  padSwing: number;
  setPadSwing: Dispatch<SetStateAction<number>>;
  padLatchMode: boolean;
  setPadLatchMode: Dispatch<SetStateAction<boolean>>;
  humanize: number;
  setHumanize: Dispatch<SetStateAction<number>>;
  gate: number;
  setGate: Dispatch<SetStateAction<number>>;
  inversionRegister: PlaybackRegister;
  setInversionRegister: Dispatch<SetStateAction<PlaybackRegister>>;
  instrument: AudioInstrument;
  setInstrument: Dispatch<SetStateAction<AudioInstrument>>;
  octaveShift: number;
  setOctaveShift: Dispatch<SetStateAction<number>>;
  reverbEnabled: boolean;
  setReverbEnabled: Dispatch<SetStateAction<boolean>>;
  reverb: number;
  setReverb: Dispatch<SetStateAction<number>>;
  chorusEnabled: boolean;
  setChorusEnabled: Dispatch<SetStateAction<boolean>>;
  chorus: number;
  setChorus: Dispatch<SetStateAction<number>>;
  chorusRate: number;
  setChorusRate: Dispatch<SetStateAction<number>>;
  chorusDepth: number;
  setChorusDepth: Dispatch<SetStateAction<number>>;
  chorusDelayTime: number;
  setChorusDelayTime: Dispatch<SetStateAction<number>>;
  feedbackDelayEnabled: boolean;
  setFeedbackDelayEnabled: Dispatch<SetStateAction<boolean>>;
  feedbackDelay: number;
  setFeedbackDelay: Dispatch<SetStateAction<number>>;
  feedbackDelayTime: number;
  setFeedbackDelayTime: Dispatch<SetStateAction<number>>;
  feedbackDelayFeedback: number;
  setFeedbackDelayFeedback: Dispatch<SetStateAction<number>>;
  tremoloEnabled: boolean;
  setTremoloEnabled: Dispatch<SetStateAction<boolean>>;
  tremolo: number;
  setTremolo: Dispatch<SetStateAction<number>>;
  tremoloFrequency: number;
  setTremoloFrequency: Dispatch<SetStateAction<number>>;
  tremoloDepth: number;
  setTremoloDepth: Dispatch<SetStateAction<number>>;
  vibratoEnabled: boolean;
  setVibratoEnabled: Dispatch<SetStateAction<boolean>>;
  vibrato: number;
  setVibrato: Dispatch<SetStateAction<number>>;
  vibratoFrequency: number;
  setVibratoFrequency: Dispatch<SetStateAction<number>>;
  vibratoDepth: number;
  setVibratoDepth: Dispatch<SetStateAction<number>>;
  phaserEnabled: boolean;
  setPhaserEnabled: Dispatch<SetStateAction<boolean>>;
  phaser: number;
  setPhaser: Dispatch<SetStateAction<number>>;
  phaserFrequency: number;
  setPhaserFrequency: Dispatch<SetStateAction<number>>;
  phaserOctaves: number;
  setPhaserOctaves: Dispatch<SetStateAction<number>>;
  phaserQ: number;
  setPhaserQ: Dispatch<SetStateAction<number>>;
  roomSize: number;
  setRoomSize: Dispatch<SetStateAction<number>>;
};

type UseGeneratorSessionCacheResult = {
  isRestoringState: boolean;
  hasRestoredSessionData: boolean;
  cacheGeneratorResult: (formData: GeneratorFormData, data: ChordSuggestionResponse) => void;
};

export default function useGeneratorSessionCache({
  reset,
  setData,
  setIsLoadedFromSavedProgression,
  playbackStyle,
  setPlaybackStyle,
  attack,
  setAttack,
  decay,
  setDecay,
  padVelocity,
  setPadVelocity,
  padSwing,
  setPadSwing,
  padLatchMode,
  setPadLatchMode,
  humanize,
  setHumanize,
  gate,
  setGate,
  inversionRegister,
  setInversionRegister,
  instrument,
  setInstrument,
  octaveShift,
  setOctaveShift,
  reverbEnabled,
  setReverbEnabled,
  reverb,
  setReverb,
  chorusEnabled,
  setChorusEnabled,
  chorus,
  setChorus,
  chorusRate,
  setChorusRate,
  chorusDepth,
  setChorusDepth,
  chorusDelayTime,
  setChorusDelayTime,
  feedbackDelayEnabled,
  setFeedbackDelayEnabled,
  feedbackDelay,
  setFeedbackDelay,
  feedbackDelayTime,
  setFeedbackDelayTime,
  feedbackDelayFeedback,
  setFeedbackDelayFeedback,
  tremoloEnabled,
  setTremoloEnabled,
  tremolo,
  setTremolo,
  tremoloFrequency,
  setTremoloFrequency,
  tremoloDepth,
  setTremoloDepth,
  vibratoEnabled,
  setVibratoEnabled,
  vibrato,
  setVibrato,
  vibratoFrequency,
  setVibratoFrequency,
  vibratoDepth,
  setVibratoDepth,
  phaserEnabled,
  setPhaserEnabled,
  phaser,
  setPhaser,
  phaserFrequency,
  setPhaserFrequency,
  phaserOctaves,
  setPhaserOctaves,
  phaserQ,
  setPhaserQ,
  roomSize,
  setRoomSize,
}: UseGeneratorSessionCacheParams): UseGeneratorSessionCacheResult {
  const [isRestoringState, setIsRestoringState] = useState(true);
  const [hasRestoredSessionData, setHasRestoredSessionData] = useState(false);

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
            setHasRestoredSessionData(true);
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
        setHasRestoredSessionData(true);
        setData(parsedCache.data);

        const restoredSettings = parsedCache.playbackSettings;
        if (restoredSettings) {
          setPlaybackStyle(
            PLAYBACK_STYLE_OPTIONS.includes(restoredSettings.playbackStyle)
              ? restoredSettings.playbackStyle
              : 'strum',
          );
          setAttack(clamp(restoredSettings.attack, 0, 1));
          setDecay(clamp(restoredSettings.decay, 0, 2));
          setPadVelocity(Math.round(clamp(restoredSettings.padVelocity, 20, 127)));
          setPadSwing(Math.round(clamp(restoredSettings.padSwing, 0, 100)));
          setPadLatchMode(Boolean(restoredSettings.padLatchMode));
          setHumanize(clamp(restoredSettings.humanize, 0, 1));
          setGate(clamp(restoredSettings.gate, 0, 1));
          setInversionRegister(
            INVERSION_REGISTER_OPTIONS.includes(restoredSettings.inversionRegister)
              ? restoredSettings.inversionRegister
              : 'off',
          );
          setInstrument(
            INSTRUMENT_OPTIONS.includes(restoredSettings.instrument)
              ? restoredSettings.instrument
              : 'piano',
          );
          setOctaveShift(Math.round(clamp(restoredSettings.octaveShift, -3, 3)));
          setReverbEnabled(Boolean(restoredSettings.reverbEnabled));
          setReverb(clamp(restoredSettings.reverb, 0, 1));
          setChorusEnabled(Boolean(restoredSettings.chorusEnabled));
          setChorus(clamp(restoredSettings.chorus ?? 0, 0, 1));
          setChorusRate(clamp(restoredSettings.chorusRate ?? 1.5, 0.1, 8));
          setChorusDepth(clamp(restoredSettings.chorusDepth ?? 0.7, 0, 1));
          setChorusDelayTime(clamp(restoredSettings.chorusDelayTime ?? 3.5, 0.1, 20));
          setFeedbackDelayEnabled(Boolean(restoredSettings.feedbackDelayEnabled));
          setFeedbackDelay(clamp(restoredSettings.feedbackDelay ?? 0, 0, 1));
          setFeedbackDelayTime(clamp(restoredSettings.feedbackDelayTime ?? 0.25, 0.01, 1.5));
          setFeedbackDelayFeedback(clamp(restoredSettings.feedbackDelayFeedback ?? 0.35, 0, 0.95));
          setTremoloEnabled(Boolean(restoredSettings.tremoloEnabled));
          setTremolo(clamp(restoredSettings.tremolo ?? 0, 0, 1));
          setTremoloFrequency(clamp(restoredSettings.tremoloFrequency ?? 9, 0.1, 20));
          setTremoloDepth(clamp(restoredSettings.tremoloDepth ?? 0.5, 0, 1));
          setVibratoEnabled(Boolean(restoredSettings.vibratoEnabled));
          setVibrato(clamp(restoredSettings.vibrato ?? 0, 0, 1));
          setVibratoFrequency(clamp(restoredSettings.vibratoFrequency ?? 5, 0.1, 12));
          setVibratoDepth(clamp(restoredSettings.vibratoDepth ?? 0.1, 0, 1));
          setPhaserEnabled(Boolean(restoredSettings.phaserEnabled));
          setPhaser(clamp(restoredSettings.phaser ?? 0, 0, 1));
          setPhaserFrequency(clamp(restoredSettings.phaserFrequency ?? 0.5, 0.1, 8));
          setPhaserOctaves(clamp(restoredSettings.phaserOctaves ?? 3, 0.1, 6));
          setPhaserQ(clamp(restoredSettings.phaserQ ?? 10, 0.1, 20));
          setRoomSize(clamp(restoredSettings.roomSize, 0, 1));
        } else {
          setRoomSize(clamp(parsedCache.roomSize ?? 0.25, 0, 1));
        }
      } catch (err) {
        console.error('Failed to restore generator cache from session storage:', err);
        sessionStorage.removeItem(GENERATOR_CACHE_KEY);
      }
    } finally {
      setIsRestoringState(false);
    }
  }, [
    reset,
    setData,
    setIsLoadedFromSavedProgression,
    setPlaybackStyle,
    setAttack,
    setDecay,
    setPadVelocity,
    setPadSwing,
    setPadLatchMode,
    setHumanize,
    setGate,
    setInversionRegister,
    setInstrument,
    setOctaveShift,
    setReverbEnabled,
    setReverb,
    setChorusEnabled,
    setChorus,
    setChorusRate,
    setChorusDepth,
    setChorusDelayTime,
    setFeedbackDelayEnabled,
    setFeedbackDelay,
    setFeedbackDelayTime,
    setFeedbackDelayFeedback,
    setTremoloEnabled,
    setTremolo,
    setTremoloFrequency,
    setTremoloDepth,
    setVibratoEnabled,
    setVibrato,
    setVibratoFrequency,
    setVibratoDepth,
    setPhaserEnabled,
    setPhaser,
    setPhaserFrequency,
    setPhaserOctaves,
    setPhaserQ,
    setRoomSize,
  ]);

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
      playbackSettings: {
        playbackStyle,
        attack,
        decay,
        padVelocity,
        padSwing,
        padLatchMode,
        humanize,
        gate,
        inversionRegister,
        instrument,
        octaveShift,
        reverbEnabled,
        reverb,
        chorusEnabled,
        chorus,
        chorusRate,
        chorusDepth,
        chorusDelayTime,
        feedbackDelayEnabled,
        feedbackDelay,
        feedbackDelayTime,
        feedbackDelayFeedback,
        tremoloEnabled,
        tremolo,
        tremoloFrequency,
        tremoloDepth,
        vibratoEnabled,
        vibrato,
        vibratoFrequency,
        vibratoDepth,
        phaserEnabled,
        phaser,
        phaserFrequency,
        phaserOctaves,
        phaserQ,
        roomSize,
      },
      roomSize,
      data,
    };

    sessionStorage.setItem(GENERATOR_CACHE_KEY, JSON.stringify(cachePayload));
  };

  return {
    isRestoringState,
    hasRestoredSessionData,
    cacheGeneratorResult,
  };
}
