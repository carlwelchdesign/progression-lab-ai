import * as Tone from 'tone';
import type { AudioEngine } from './audioEngine';
import { loadDrumPattern, normalizeDrumPatternPath } from './engine/DrumPatternRepository';
import { createEffectsChain } from './engine/EffectsChain';
import { createEffectsControl } from './engine/EffectsControl';
import { createAudioEngineRegistry, type AudioEngineScope } from './engine/AudioEngineRegistry';
import { createAudioFacade } from './engine/AudioFacade';
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

const audioFacade = createAudioFacade({
  getAudioEngine: () => audioEngineRegistry.getAudioEngine(),
  setAudioEngine: (engine) => audioEngineRegistry.setAudioEngine(engine),
  resetAudioEngine: () => audioEngineRegistry.resetAudioEngine(),
});

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

// Effects control delegation
export const setReverbWet = audioFacade.setReverbWet;
export const setChorusWet = audioFacade.setChorusWet;
export const setReverbRoomSize = audioFacade.setReverbRoomSize;
export const setReverbEnabled = audioFacade.setReverbEnabled;
export const setChorusEnabled = audioFacade.setChorusEnabled;
export const setChorusFrequency = audioFacade.setChorusFrequency;
export const setChorusDelayTime = audioFacade.setChorusDelayTime;
export const setChorusDepth = audioFacade.setChorusDepth;
export const setFeedbackDelayEnabled = audioFacade.setFeedbackDelayEnabled;
export const setFeedbackDelayWet = audioFacade.setFeedbackDelayWet;
export const setFeedbackDelayTime = audioFacade.setFeedbackDelayTime;
export const setFeedbackDelayFeedback = audioFacade.setFeedbackDelayFeedback;
export const setTremoloEnabled = audioFacade.setTremoloEnabled;
export const setTremoloWet = audioFacade.setTremoloWet;
export const setTremoloFrequency = audioFacade.setTremoloFrequency;
export const setTremoloDepth = audioFacade.setTremoloDepth;
export const setVibratoEnabled = audioFacade.setVibratoEnabled;
export const setVibratoWet = audioFacade.setVibratoWet;
export const setVibratoFrequency = audioFacade.setVibratoFrequency;
export const setVibratoDepth = audioFacade.setVibratoDepth;
export const setPhaserEnabled = audioFacade.setPhaserEnabled;
export const setPhaserWet = audioFacade.setPhaserWet;
export const setPhaserFrequency = audioFacade.setPhaserFrequency;
export const setPhaserOctaves = audioFacade.setPhaserOctaves;
export const setPhaserQ = audioFacade.setPhaserQ;

// Lifecycle delegation
export const startAudio = audioFacade.startAudio;
export const stopAllAudio = audioFacade.stopAllAudio;
export const isAudioInitialized = (): boolean => Tone.context.state === 'running';

// Playback delegation
export const playMetronomeClick = audioFacade.playMetronomeClick;
export const playMetronomePulse = audioFacade.playMetronomePulse;
export const playChordVoicing = audioFacade.playChordVoicing;
export const playProgression = audioFacade.playProgression;
export const playChordPattern = audioFacade.playChordPattern;

export const getAudioClockSeconds = (): number => Tone.now();
