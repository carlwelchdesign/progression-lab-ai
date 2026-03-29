import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../../../domain/audio/audio';
import type { PadPattern, TimeSignature } from '../../../domain/audio/audio';

export const DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT: Record<AudioInstrument, number> = {
  piano: 0,
  rhodes: -1,
};

/**
 * Canonical playback settings used across home page state, dialogs, and session cache.
 */
export type PlaybackSettings = {
  playbackStyle: PlaybackStyle;
  attack: number;
  decay: number;
  padVelocity: number;
  padSwing: number;
  padLatchMode: boolean;
  padPattern: PadPattern;
  timeSignature: TimeSignature;
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
  metronomeEnabled: boolean;
  metronomeVolume: number;
  metronomeSource: 'click' | 'drum';
  metronomeDrumPath: string | null;
};

type PlaybackSettingsKey = keyof PlaybackSettings & string;
type SettingsValueUpdater<T> = (value: T) => void;
type ChangeHandlerKey<K extends PlaybackSettingsKey> = `on${Capitalize<K>}Change`;
type SetterKey<K extends PlaybackSettingsKey> = `set${Capitalize<K>}`;

/**
 * Callback surface used by settings UI components.
 */
export type PlaybackSettingsChangeHandlers = {
  [K in PlaybackSettingsKey as ChangeHandlerKey<K>]: SettingsValueUpdater<PlaybackSettings[K]>;
};

/**
 * Setter surface used for restoring persisted settings into React state.
 */
export type PlaybackSettingsSetters = {
  [K in PlaybackSettingsKey as SetterKey<K>]: SettingsValueUpdater<PlaybackSettings[K]>;
};

/**
 * Baseline values used for first render and as merge defaults during sanitize.
 */
export const PLAYBACK_SETTINGS_DEFAULTS: PlaybackSettings = {
  playbackStyle: 'strum',
  attack: 0.01,
  decay: 0.5,
  padVelocity: 96,
  padSwing: 0,
  padLatchMode: false,
  padPattern: 'single',
  timeSignature: '4/4',
  humanize: 0,
  gate: 1,
  inversionRegister: 'off',
  instrument: 'rhodes',
  octaveShift: DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT.rhodes,
  reverbEnabled: false,
  reverb: 0,
  chorusEnabled: false,
  chorus: 0,
  chorusRate: 1.5,
  chorusDepth: 0.7,
  chorusDelayTime: 3.5,
  feedbackDelayEnabled: false,
  feedbackDelay: 0,
  feedbackDelayTime: 0.25,
  feedbackDelayFeedback: 0.35,
  tremoloEnabled: false,
  tremolo: 0,
  tremoloFrequency: 9,
  tremoloDepth: 0.5,
  vibratoEnabled: false,
  vibrato: 0,
  vibratoFrequency: 5,
  vibratoDepth: 0.1,
  phaserEnabled: false,
  phaser: 0,
  phaserFrequency: 0.5,
  phaserOctaves: 3,
  phaserQ: 10,
  roomSize: 0.25,
  metronomeEnabled: false,
  metronomeVolume: 0.7,
  metronomeSource: 'click',
  metronomeDrumPath: null,
};

const PLAYBACK_STYLE_OPTIONS: PlaybackStyle[] = ['strum', 'block'];
const INVERSION_REGISTER_OPTIONS: PlaybackRegister[] = ['off', 'low', 'mid', 'high'];
const INSTRUMENT_OPTIONS: AudioInstrument[] = ['piano', 'rhodes'];
const PAD_PATTERN_OPTIONS: PadPattern[] = [
  'single',
  'quarter-pulse',
  'eighth-pulse',
  'offbeat-stab',
  'syncopated-stab',
];
const TIME_SIGNATURE_OPTIONS: TimeSignature[] = ['4/4', '3/4', '6/8'];
const METRONOME_SOURCE_OPTIONS: Array<PlaybackSettings['metronomeSource']> = ['click', 'drum'];

/**
 * Clamps a numeric value to an inclusive [min, max] range.
 */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Normalizes partial settings payloads from cache or external sources.
 *
 * - Merges with defaults to support missing fields.
 * - Enforces enum validity for style/register/instrument values.
 * - Clamps numeric values to safe ranges used by UI and audio engine.
 */
export const sanitizePlaybackSettings = (input?: Partial<PlaybackSettings>): PlaybackSettings => {
  const raw = { ...PLAYBACK_SETTINGS_DEFAULTS, ...(input ?? {}) };
  const instrument = INSTRUMENT_OPTIONS.includes(raw.instrument) ? raw.instrument : 'rhodes';
  const metronomeSource = METRONOME_SOURCE_OPTIONS.includes(raw.metronomeSource)
    ? raw.metronomeSource
    : 'click';
  const metronomeDrumPath =
    metronomeSource === 'drum' && typeof raw.metronomeDrumPath === 'string'
      ? raw.metronomeDrumPath.trim() || null
      : null;
  const octaveShiftDefault =
    input?.octaveShift === undefined
      ? DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT[instrument]
      : raw.octaveShift;

  return {
    playbackStyle: PLAYBACK_STYLE_OPTIONS.includes(raw.playbackStyle) ? raw.playbackStyle : 'strum',
    attack: clamp(raw.attack, 0, 1),
    decay: clamp(raw.decay, 0, 2),
    padVelocity: Math.round(clamp(raw.padVelocity, 20, 127)),
    padSwing: Math.round(clamp(raw.padSwing, 0, 100)),
    padLatchMode: Boolean(raw.padLatchMode),
    padPattern: PAD_PATTERN_OPTIONS.includes(raw.padPattern) ? raw.padPattern : 'single',
    timeSignature: TIME_SIGNATURE_OPTIONS.includes(raw.timeSignature) ? raw.timeSignature : '4/4',
    humanize: clamp(raw.humanize, 0, 1),
    gate: clamp(raw.gate, 0, 1),
    inversionRegister: INVERSION_REGISTER_OPTIONS.includes(raw.inversionRegister)
      ? raw.inversionRegister
      : 'off',
    instrument,
    octaveShift: Math.round(clamp(octaveShiftDefault, -3, 3)),
    reverbEnabled: Boolean(raw.reverbEnabled),
    reverb: clamp(raw.reverb, 0, 1),
    chorusEnabled: Boolean(raw.chorusEnabled),
    chorus: clamp(raw.chorus, 0, 1),
    chorusRate: clamp(raw.chorusRate, 0.1, 8),
    chorusDepth: clamp(raw.chorusDepth, 0, 1),
    chorusDelayTime: clamp(raw.chorusDelayTime, 0.1, 20),
    feedbackDelayEnabled: Boolean(raw.feedbackDelayEnabled),
    feedbackDelay: clamp(raw.feedbackDelay, 0, 1),
    feedbackDelayTime: clamp(raw.feedbackDelayTime, 0.01, 1.5),
    feedbackDelayFeedback: clamp(raw.feedbackDelayFeedback, 0, 0.95),
    tremoloEnabled: Boolean(raw.tremoloEnabled),
    tremolo: clamp(raw.tremolo, 0, 1),
    tremoloFrequency: clamp(raw.tremoloFrequency, 0.1, 20),
    tremoloDepth: clamp(raw.tremoloDepth, 0, 1),
    vibratoEnabled: Boolean(raw.vibratoEnabled),
    vibrato: clamp(raw.vibrato, 0, 1),
    vibratoFrequency: clamp(raw.vibratoFrequency, 0.1, 12),
    vibratoDepth: clamp(raw.vibratoDepth, 0, 1),
    phaserEnabled: Boolean(raw.phaserEnabled),
    phaser: clamp(raw.phaser, 0, 1),
    phaserFrequency: clamp(raw.phaserFrequency, 0.1, 8),
    phaserOctaves: clamp(raw.phaserOctaves, 0.1, 6),
    phaserQ: clamp(raw.phaserQ, 0.1, 20),
    roomSize: clamp(raw.roomSize, 0, 1),
    metronomeEnabled: Boolean(raw.metronomeEnabled),
    metronomeVolume: clamp(raw.metronomeVolume, 0, 1),
    metronomeSource,
    metronomeDrumPath,
  };
};

/**
 * Applies a full settings object to the provided React state setters.
 */
export const applyPlaybackSettings = (
  setters: PlaybackSettingsSetters,
  settings: PlaybackSettings,
): void => {
  setters.setPlaybackStyle(settings.playbackStyle);
  setters.setAttack(settings.attack);
  setters.setDecay(settings.decay);
  setters.setPadVelocity(settings.padVelocity);
  setters.setPadSwing(settings.padSwing);
  setters.setPadLatchMode(settings.padLatchMode);
  setters.setPadPattern(settings.padPattern);
  setters.setTimeSignature(settings.timeSignature);
  setters.setHumanize(settings.humanize);
  setters.setGate(settings.gate);
  setters.setInversionRegister(settings.inversionRegister);
  setters.setInstrument(settings.instrument);
  setters.setOctaveShift(settings.octaveShift);
  setters.setReverbEnabled(settings.reverbEnabled);
  setters.setReverb(settings.reverb);
  setters.setChorusEnabled(settings.chorusEnabled);
  setters.setChorus(settings.chorus);
  setters.setChorusRate(settings.chorusRate);
  setters.setChorusDepth(settings.chorusDepth);
  setters.setChorusDelayTime(settings.chorusDelayTime);
  setters.setFeedbackDelayEnabled(settings.feedbackDelayEnabled);
  setters.setFeedbackDelay(settings.feedbackDelay);
  setters.setFeedbackDelayTime(settings.feedbackDelayTime);
  setters.setFeedbackDelayFeedback(settings.feedbackDelayFeedback);
  setters.setTremoloEnabled(settings.tremoloEnabled);
  setters.setTremolo(settings.tremolo);
  setters.setTremoloFrequency(settings.tremoloFrequency);
  setters.setTremoloDepth(settings.tremoloDepth);
  setters.setVibratoEnabled(settings.vibratoEnabled);
  setters.setVibrato(settings.vibrato);
  setters.setVibratoFrequency(settings.vibratoFrequency);
  setters.setVibratoDepth(settings.vibratoDepth);
  setters.setPhaserEnabled(settings.phaserEnabled);
  setters.setPhaser(settings.phaser);
  setters.setPhaserFrequency(settings.phaserFrequency);
  setters.setPhaserOctaves(settings.phaserOctaves);
  setters.setPhaserQ(settings.phaserQ);
  setters.setRoomSize(settings.roomSize);
  setters.setMetronomeEnabled(settings.metronomeEnabled);
  setters.setMetronomeVolume(settings.metronomeVolume);
  setters.setMetronomeSource(settings.metronomeSource);
  setters.setMetronomeDrumPath(settings.metronomeDrumPath);
};
