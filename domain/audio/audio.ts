import * as Tone from 'tone';
import type {
  AudioEngine,
  PlayChordVoicingParams,
  PlayChordPatternParams,
  PlayMetronomePulseOptions,
  PlaybackRegister,
  PlaybackStyle,
  PlayProgressionOptions,
  ProgressionVoicing,
} from './audioEngine';
import {
  getPadPatternBeats,
  TIME_SIGNATURE_BEATS_PER_BAR,
  TIME_SIGNATURE_NUMERATOR,
} from '../music/padPattern';
import {
  CHORD_BEATS,
  applyGate,
  getChordDurationSeconds,
  normalizeTempoBpm,
} from './engine/AudioMath';
import { loadDrumPattern, normalizeDrumPatternPath } from './engine/DrumPatternRepository';
import { createEffectsChain } from './engine/EffectsChain';
import { createEffectsControl } from './engine/EffectsControl';
import { createAudioEngineRegistry, type AudioEngineScope } from './engine/AudioEngineRegistry';
import { createMetronomePlayback } from './engine/MetronomePlayback';
import { createMetronomeSynthBank } from './engine/MetronomeSynthBank';
import { createProgressionPlayback } from './engine/ProgressionPlayback';
import { createSamplerBank } from './engine/SamplerBank';
import { ensureAudioStarted, stopAllAudioPlayback } from './engine/TransportLifecycle';

export type {
  AudioEngine,
  AudioInstrument,
  MetronomeSource,
  PlayChordVoicingParams,
  PlayChordPatternParams,
  PlayMetronomePulseOptions,
  PlaybackRegister,
  PlaybackStyle,
  PlayProgressionOptions,
  ProgressionVoicing,
} from './audioEngine';
export type { PadPattern, TimeSignature } from '../music/padPattern';
export { PAD_PATTERN_LABELS, TIME_SIGNATURE_LABELS } from '../music/padPattern';

export const createToneAudioEngine = (): AudioEngine => {
  let scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[] = [];
  let activePart: Tone.Part | null = null;
  let metronomeLoop: Tone.Loop | null = null;
  let metronomeClickBeat = 0;
  let activeMetronomePulseTimeouts: ReturnType<typeof setTimeout>[] = [];
  const metronomeSynthBank = createMetronomeSynthBank();
  const effectsChain = createEffectsChain();
  const effectsControl = createEffectsControl(effectsChain);
  const samplerBank = createSamplerBank({
    connectSamplerToCurrentOutput: effectsChain.connectSamplerToCurrentOutput,
    ensureReverbReady: effectsChain.ensureReverbReady,
  });

  const { ensurePianoSamplerLoaded, ensureRhodesSamplerLoaded } = samplerBank;

  const startAudio = async (): Promise<void> => {
    await ensureAudioStarted();
  };

  const stopAllAudio = (): void => {
    const { pianoSampler, rhodesSampler } = samplerBank.getSamplerRefs();

    stopAllAudioPlayback({
      scheduledPlaybackTimeouts,
      setScheduledPlaybackTimeouts: (timeouts) => {
        scheduledPlaybackTimeouts = timeouts;
      },
      activeMetronomePulseTimeouts,
      setActiveMetronomePulseTimeouts: (timeouts) => {
        activeMetronomePulseTimeouts = timeouts;
      },
      activePart,
      setActivePart: (part) => {
        activePart = part;
      },
      metronomeLoop,
      setMetronomeLoop: (loop) => {
        metronomeLoop = loop;
      },
      setMetronomeClickBeat: (beat) => {
        metronomeClickBeat = beat;
      },
      pianoSampler,
      rhodesSampler,
      releaseMetronomeSynths: metronomeSynthBank.releaseAll,
    });
  };

  const metronomePlayback = createMetronomePlayback({
    startAudio,
    synthBank: metronomeSynthBank,
    normalizeDrumPatternPath,
    loadPattern: loadDrumPattern,
    loopState: {
      getMetronomeLoop: () => metronomeLoop,
      setMetronomeLoop: (loop) => {
        metronomeLoop = loop;
      },
      getMetronomeClickBeat: () => metronomeClickBeat,
      setMetronomeClickBeat: (beat) => {
        metronomeClickBeat = beat;
      },
      getActiveMetronomePulseTimeouts: () => activeMetronomePulseTimeouts,
      setActiveMetronomePulseTimeouts: (timeouts) => {
        activeMetronomePulseTimeouts = timeouts;
      },
    },
  });

  const { playMetronomePulse, playMetronomeClick, startMetronomeLoop } = metronomePlayback;

  const progressionPlayback = createProgressionPlayback({
    startAudio,
    stopAllAudio,
    ensureRhodesSamplerLoaded,
    ensurePianoSamplerLoaded,
    startMetronomeLoop,
    partState: {
      getActivePart: () => activePart,
      setActivePart: (part) => {
        activePart = part;
      },
    },
    timeoutState: {
      getScheduledPlaybackTimeouts: () => scheduledPlaybackTimeouts,
      setScheduledPlaybackTimeouts: (timeouts) => {
        scheduledPlaybackTimeouts = timeouts;
      },
    },
  });

  const { playChordVoicing, playProgression, playChordPattern } = progressionPlayback;

  return {
    ...effectsControl,
    startAudio,
    playMetronomeClick,
    playMetronomePulse,
    stopAllAudio,
    playChordVoicing,
    playProgression,
    playChordPattern,
  };
};

export type { AudioEngineScope };

const audioEngineRegistry = createAudioEngineRegistry(createToneAudioEngine);

export const getAudioEngine = (): AudioEngine => audioEngineRegistry.getAudioEngine();

export const setAudioEngine = (engine: AudioEngine): void => {
  audioEngineRegistry.setAudioEngine(engine);
};

export const resetAudioEngine = (): void => {
  audioEngineRegistry.resetAudioEngine();
};

export const createAudioEngineScope = (engine?: AudioEngine): AudioEngineScope => {
  return audioEngineRegistry.createAudioEngineScope(engine);
};

export const setReverbWet = (wet: number): void => {
  getAudioEngine().setReverbWet(wet);
};

export const setChorusWet = (wet: number): void => {
  getAudioEngine().setChorusWet(wet);
};

export const setReverbRoomSize = (roomSize: number): void => {
  getAudioEngine().setReverbRoomSize(roomSize);
};

export const setReverbEnabled = (enabled: boolean): void => {
  getAudioEngine().setReverbEnabled(enabled);
};

export const setChorusEnabled = (enabled: boolean): void => {
  getAudioEngine().setChorusEnabled(enabled);
};

export const setChorusFrequency = (value: number): void => {
  getAudioEngine().setChorusFrequency(value);
};

export const setChorusDelayTime = (value: number): void => {
  getAudioEngine().setChorusDelayTime(value);
};

export const setChorusDepth = (value: number): void => {
  getAudioEngine().setChorusDepth(value);
};

export const setFeedbackDelayEnabled = (enabled: boolean): void => {
  getAudioEngine().setFeedbackDelayEnabled(enabled);
};

export const setFeedbackDelayWet = (wet: number): void => {
  getAudioEngine().setFeedbackDelayWet(wet);
};

export const setFeedbackDelayTime = (value: number): void => {
  getAudioEngine().setFeedbackDelayTime(value);
};

export const setFeedbackDelayFeedback = (value: number): void => {
  getAudioEngine().setFeedbackDelayFeedback(value);
};

export const setTremoloEnabled = (enabled: boolean): void => {
  getAudioEngine().setTremoloEnabled(enabled);
};

export const setTremoloWet = (wet: number): void => {
  getAudioEngine().setTremoloWet(wet);
};

export const setTremoloFrequency = (value: number): void => {
  getAudioEngine().setTremoloFrequency(value);
};

export const setTremoloDepth = (value: number): void => {
  getAudioEngine().setTremoloDepth(value);
};

export const setVibratoEnabled = (enabled: boolean): void => {
  getAudioEngine().setVibratoEnabled(enabled);
};

export const setVibratoWet = (wet: number): void => {
  getAudioEngine().setVibratoWet(wet);
};

export const setVibratoFrequency = (value: number): void => {
  getAudioEngine().setVibratoFrequency(value);
};

export const setVibratoDepth = (value: number): void => {
  getAudioEngine().setVibratoDepth(value);
};

export const getAudioClockSeconds = (): number => Tone.now();

export const setPhaserEnabled = (enabled: boolean): void => {
  getAudioEngine().setPhaserEnabled(enabled);
};

export const setPhaserWet = (wet: number): void => {
  getAudioEngine().setPhaserWet(wet);
};

export const setPhaserFrequency = (value: number): void => {
  getAudioEngine().setPhaserFrequency(value);
};

export const setPhaserOctaves = (value: number): void => {
  getAudioEngine().setPhaserOctaves(value);
};

export const setPhaserQ = (value: number): void => {
  getAudioEngine().setPhaserQ(value);
};

export const startAudio = async (): Promise<void> => {
  await getAudioEngine().startAudio();
};

export const isAudioInitialized = (): boolean => Tone.context.state === 'running';

export const playMetronomeClick = async (volume: number, isDownbeat: boolean): Promise<void> => {
  await getAudioEngine().playMetronomeClick(volume, isDownbeat);
};

export const playMetronomePulse = async (
  volume: number,
  isDownbeat: boolean,
  opts?: PlayMetronomePulseOptions,
): Promise<void> => {
  await getAudioEngine().playMetronomePulse(volume, isDownbeat, opts);
};

export const stopAllAudio = (): void => {
  getAudioEngine().stopAllAudio();
};

export const playChordVoicing = async (params: PlayChordVoicingParams): Promise<void> => {
  await getAudioEngine().playChordVoicing(params);
};

export const playProgression = async (
  voicings: ProgressionVoicing[],
  tempoBpm?: number,
  playbackStyle: PlaybackStyle = 'strum',
  attack?: number,
  decay?: number,
  opts?: PlayProgressionOptions,
): Promise<void> => {
  await getAudioEngine().playProgression(voicings, tempoBpm, playbackStyle, attack, decay, opts);
};

export const playChordPattern = async (params: PlayChordPatternParams): Promise<void> => {
  await getAudioEngine().playChordPattern(params);
};
