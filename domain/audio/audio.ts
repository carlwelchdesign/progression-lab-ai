import * as Tone from 'tone';
import type { AudioEffectsState, AudioEngine } from './audioEngine';
import { loadDrumPattern, normalizeDrumPatternPath } from './engine/DrumPatternRepository';
import { createEffectsChain } from './engine/EffectsChain';
import { createAudioEngineRegistry, type AudioEngineScope } from './engine/AudioEngineRegistry';
import { createAudioTimelineState } from './engine/AudioTimelineState';
import { createMetronomePlayback } from './engine/MetronomePlayback';
import { createMetronomeSynthBank } from './engine/MetronomeSynthBank';
import { createProgressionPlayback } from './engine/ProgressionPlayback';
import { createSamplerBank } from './engine/SamplerBank';
import { applyTransportTiming } from './engine/TransportTimingPolicy';
import { ensureAudioStarted, stopAllAudioPlayback } from './engine/TransportLifecycle';

export type {
  AudioEngine,
  AudioEffectsState,
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
  const timelineState = createAudioTimelineState();
  const metronomeSynthBank = createMetronomeSynthBank();
  const effectsChain = createEffectsChain();
  const samplerBank = createSamplerBank({
    connectSamplerToCurrentOutput: effectsChain.connectSamplerToCurrentOutput,
    ensureReverbReady: effectsChain.ensureReverbReady,
  });

  const { ensurePianoSamplerLoaded, ensureRhodesSamplerLoaded } = samplerBank;

  const startAudio = async (): Promise<void> => {
    await ensureAudioStarted({
      isContextRunning: () => Tone.context.state === 'running',
      startContext: () => Tone.start(),
    });
  };

  const stopAllAudio = (): void => {
    stopAllAudioPlayback({
      scheduledPlaybackTimeouts: timelineState.getScheduledPlaybackTimeouts(),
      setScheduledPlaybackTimeouts: timelineState.setScheduledPlaybackTimeouts,
      activeMetronomePulseTimeouts: timelineState.getActiveMetronomePulseTimeouts(),
      setActiveMetronomePulseTimeouts: timelineState.setActiveMetronomePulseTimeouts,
      activePart: timelineState.getActivePart(),
      setActivePart: timelineState.setActivePart,
      metronomeLoop: timelineState.getMetronomeLoop(),
      setMetronomeLoop: timelineState.setMetronomeLoop,
      setMetronomeClickBeat: timelineState.setMetronomeClickBeat,
      releaseInstrumentSamplers: samplerBank.releaseAllSamplers,
      releaseMetronomeSynths: metronomeSynthBank.releaseAll,
      stopTransport: () => Tone.Transport.stop(),
      cancelTransport: () => Tone.Transport.cancel(),
    });
  };

  const metronomePlayback = createMetronomePlayback({
    startAudio,
    synthBank: metronomeSynthBank,
    normalizeDrumPatternPath,
    loadPattern: loadDrumPattern,
    loopState: {
      getMetronomeLoop: timelineState.getMetronomeLoop,
      setMetronomeLoop: timelineState.setMetronomeLoop,
      getMetronomeClickBeat: timelineState.getMetronomeClickBeat,
      setMetronomeClickBeat: timelineState.setMetronomeClickBeat,
      getActiveMetronomePulseTimeouts: timelineState.getActiveMetronomePulseTimeouts,
      setActiveMetronomePulseTimeouts: timelineState.setActiveMetronomePulseTimeouts,
    },
    createLoop: (cb, interval) => {
      const loop = new Tone.Loop(cb, interval);
      return {
        start: (time) => loop.start(time),
        setInterval: (nextInterval) => {
          loop.interval = nextInterval;
        },
        dispose: () => loop.dispose(),
      };
    },
    getTransportNow: () => Tone.now(),
  });

  const { playMetronomePulse, playMetronomeClick, updateMetronomeTempo, startMetronomeLoop } =
    metronomePlayback;

  const progressionPlayback = createProgressionPlayback({
    startAudio,
    stopAllAudio,
    ensureRhodesSamplerLoaded,
    ensurePianoSamplerLoaded,
    startMetronomeLoop,
    partState: {
      getActivePart: timelineState.getActivePart,
      setActivePart: timelineState.setActivePart,
    },
    timeoutState: {
      getScheduledPlaybackTimeouts: timelineState.getScheduledPlaybackTimeouts,
      setScheduledPlaybackTimeouts: timelineState.setScheduledPlaybackTimeouts,
    },
    transportControl: {
      applyTiming: (timing) => applyTransportTiming(Tone.Transport, timing),
      start: () => Tone.Transport.start(),
    },
    createPart: (cb, evts) => new Tone.Part(cb, evts),
  });

  const { playChordVoicing, playProgression, playChordPattern } = progressionPlayback;

  return {
    ...effectsChain,
    startAudio,
    playMetronomeClick,
    playMetronomePulse,
    updateMetronomeTempo,
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

// Effects control delegation
export const setReverbWet: AudioEngine['setReverbWet'] = (wet) =>
  getAudioEngine().setReverbWet(wet);
export const setChorusWet: AudioEngine['setChorusWet'] = (wet) =>
  getAudioEngine().setChorusWet(wet);
export const setReverbRoomSize: AudioEngine['setReverbRoomSize'] = (roomSize) =>
  getAudioEngine().setReverbRoomSize(roomSize);
export const setReverbEnabled: AudioEngine['setReverbEnabled'] = (enabled) =>
  getAudioEngine().setReverbEnabled(enabled);
export const setChorusEnabled: AudioEngine['setChorusEnabled'] = (enabled) =>
  getAudioEngine().setChorusEnabled(enabled);
export const setChorusFrequency: AudioEngine['setChorusFrequency'] = (value) =>
  getAudioEngine().setChorusFrequency(value);
export const setChorusDelayTime: AudioEngine['setChorusDelayTime'] = (value) =>
  getAudioEngine().setChorusDelayTime(value);
export const setChorusDepth: AudioEngine['setChorusDepth'] = (value) =>
  getAudioEngine().setChorusDepth(value);
export const setFeedbackDelayEnabled: AudioEngine['setFeedbackDelayEnabled'] = (enabled) =>
  getAudioEngine().setFeedbackDelayEnabled(enabled);
export const setFeedbackDelayWet: AudioEngine['setFeedbackDelayWet'] = (wet) =>
  getAudioEngine().setFeedbackDelayWet(wet);
export const setFeedbackDelayTime: AudioEngine['setFeedbackDelayTime'] = (value) =>
  getAudioEngine().setFeedbackDelayTime(value);
export const setFeedbackDelayFeedback: AudioEngine['setFeedbackDelayFeedback'] = (value) =>
  getAudioEngine().setFeedbackDelayFeedback(value);
export const setTremoloEnabled: AudioEngine['setTremoloEnabled'] = (enabled) =>
  getAudioEngine().setTremoloEnabled(enabled);
export const setTremoloWet: AudioEngine['setTremoloWet'] = (wet) =>
  getAudioEngine().setTremoloWet(wet);
export const setTremoloFrequency: AudioEngine['setTremoloFrequency'] = (value) =>
  getAudioEngine().setTremoloFrequency(value);
export const setTremoloDepth: AudioEngine['setTremoloDepth'] = (value) =>
  getAudioEngine().setTremoloDepth(value);
export const setVibratoEnabled: AudioEngine['setVibratoEnabled'] = (enabled) =>
  getAudioEngine().setVibratoEnabled(enabled);
export const setVibratoWet: AudioEngine['setVibratoWet'] = (wet) =>
  getAudioEngine().setVibratoWet(wet);
export const setVibratoFrequency: AudioEngine['setVibratoFrequency'] = (value) =>
  getAudioEngine().setVibratoFrequency(value);
export const setVibratoDepth: AudioEngine['setVibratoDepth'] = (value) =>
  getAudioEngine().setVibratoDepth(value);
export const setPhaserEnabled: AudioEngine['setPhaserEnabled'] = (enabled) =>
  getAudioEngine().setPhaserEnabled(enabled);
export const setPhaserWet: AudioEngine['setPhaserWet'] = (wet) =>
  getAudioEngine().setPhaserWet(wet);
export const setPhaserFrequency: AudioEngine['setPhaserFrequency'] = (value) =>
  getAudioEngine().setPhaserFrequency(value);
export const setPhaserOctaves: AudioEngine['setPhaserOctaves'] = (value) =>
  getAudioEngine().setPhaserOctaves(value);
export const setPhaserQ: AudioEngine['setPhaserQ'] = (value) => getAudioEngine().setPhaserQ(value);
export const updateMetronomeTempo: AudioEngine['updateMetronomeTempo'] = (tempoBpm) =>
  getAudioEngine().updateMetronomeTempo(tempoBpm);

type EffectPatchApplier = {
  key: keyof AudioEffectsState;
  apply: (engine: AudioEngine, value: AudioEffectsState[keyof AudioEffectsState]) => void;
};

const EFFECT_PATCH_APPLIERS: EffectPatchApplier[] = [
  { key: 'reverbEnabled', apply: (engine, value) => engine.setReverbEnabled(value as boolean) },
  { key: 'reverbWet', apply: (engine, value) => engine.setReverbWet(value as number) },
  { key: 'reverbRoomSize', apply: (engine, value) => engine.setReverbRoomSize(value as number) },
  { key: 'chorusEnabled', apply: (engine, value) => engine.setChorusEnabled(value as boolean) },
  { key: 'chorusWet', apply: (engine, value) => engine.setChorusWet(value as number) },
  { key: 'chorusFrequency', apply: (engine, value) => engine.setChorusFrequency(value as number) },
  { key: 'chorusDepth', apply: (engine, value) => engine.setChorusDepth(value as number) },
  { key: 'chorusDelayTime', apply: (engine, value) => engine.setChorusDelayTime(value as number) },
  {
    key: 'feedbackDelayEnabled',
    apply: (engine, value) => engine.setFeedbackDelayEnabled(value as boolean),
  },
  {
    key: 'feedbackDelayWet',
    apply: (engine, value) => engine.setFeedbackDelayWet(value as number),
  },
  {
    key: 'feedbackDelayTime',
    apply: (engine, value) => engine.setFeedbackDelayTime(value as number),
  },
  {
    key: 'feedbackDelayFeedback',
    apply: (engine, value) => engine.setFeedbackDelayFeedback(value as number),
  },
  { key: 'tremoloEnabled', apply: (engine, value) => engine.setTremoloEnabled(value as boolean) },
  { key: 'tremoloWet', apply: (engine, value) => engine.setTremoloWet(value as number) },
  {
    key: 'tremoloFrequency',
    apply: (engine, value) => engine.setTremoloFrequency(value as number),
  },
  { key: 'tremoloDepth', apply: (engine, value) => engine.setTremoloDepth(value as number) },
  { key: 'vibratoEnabled', apply: (engine, value) => engine.setVibratoEnabled(value as boolean) },
  { key: 'vibratoWet', apply: (engine, value) => engine.setVibratoWet(value as number) },
  {
    key: 'vibratoFrequency',
    apply: (engine, value) => engine.setVibratoFrequency(value as number),
  },
  { key: 'vibratoDepth', apply: (engine, value) => engine.setVibratoDepth(value as number) },
  { key: 'phaserEnabled', apply: (engine, value) => engine.setPhaserEnabled(value as boolean) },
  { key: 'phaserWet', apply: (engine, value) => engine.setPhaserWet(value as number) },
  { key: 'phaserFrequency', apply: (engine, value) => engine.setPhaserFrequency(value as number) },
  { key: 'phaserOctaves', apply: (engine, value) => engine.setPhaserOctaves(value as number) },
  { key: 'phaserQ', apply: (engine, value) => engine.setPhaserQ(value as number) },
];

export const applyAudioEffectsState = (effects: Partial<AudioEffectsState>): void => {
  const engine = getAudioEngine();

  EFFECT_PATCH_APPLIERS.forEach(({ key, apply }) => {
    const value = effects[key];
    if (value !== undefined) {
      apply(engine, value);
    }
  });
};

// Lifecycle delegation
export const startAudio: AudioEngine['startAudio'] = () => getAudioEngine().startAudio();
export const stopAllAudio: AudioEngine['stopAllAudio'] = () => getAudioEngine().stopAllAudio();
export const isAudioInitialized = (): boolean => Tone.context.state === 'running';

// Playback delegation
export const playMetronomeClick: AudioEngine['playMetronomeClick'] = (volume, isDownbeat) =>
  getAudioEngine().playMetronomeClick(volume, isDownbeat);
export const playMetronomePulse: AudioEngine['playMetronomePulse'] = (volume, isDownbeat, opts) =>
  getAudioEngine().playMetronomePulse(volume, isDownbeat, opts);
export const playChordVoicing: AudioEngine['playChordVoicing'] = (params) =>
  getAudioEngine().playChordVoicing(params);
export const playProgression: AudioEngine['playProgression'] = (
  voicings,
  tempoBpm,
  playbackStyle,
  attack,
  decay,
  opts,
) => getAudioEngine().playProgression(voicings, tempoBpm, playbackStyle, attack, decay, opts);
export const playChordPattern: AudioEngine['playChordPattern'] = (params) =>
  getAudioEngine().playChordPattern(params);

export const getAudioClockSeconds = (): number => Tone.now();
