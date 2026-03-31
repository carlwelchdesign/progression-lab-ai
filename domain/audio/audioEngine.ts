import type * as Tone from 'tone';
import type { PadPattern, TimeSignature } from '../music/padPattern';

export type PlaybackStyle = 'strum' | 'block';
export type PlaybackRegister = 'off' | 'low' | 'mid' | 'high';
export type AudioInstrument = 'piano' | 'rhodes';
export type MetronomeSource = 'click' | 'drum';

export type ProgressionVoicing = {
  leftHand: string[];
  rightHand: string[];
};

export type PlayChordVoicingParams = {
  leftHand: string[];
  rightHand: string[];
  duration?: Tone.Unit.Time;
  tempoBpm?: number;
  playbackStyle?: PlaybackStyle;
  attack?: number;
  decay?: number;
  velocity?: number;
  humanize?: number;
  gate?: number;
  inversionRegister?: PlaybackRegister;
  instrument?: AudioInstrument;
  octaveShift?: number;
};

export type PlayProgressionOptions = {
  velocity?: number;
  humanize?: number;
  gate?: number;
  inversionRegister?: PlaybackRegister;
  instrument?: AudioInstrument;
  octaveShift?: number;
  padPattern?: PadPattern;
  timeSignature?: TimeSignature;
  metronomeEnabled?: boolean;
  metronomeVolume?: number;
  metronomeSource?: MetronomeSource;
  metronomeDrumPath?: string | null;
};

export type PlayMetronomePulseOptions = {
  source?: MetronomeSource;
  drumPath?: string | null;
  timeSignature?: TimeSignature;
  tempoBpm?: number;
  beatIndex?: number;
};

export type PlayChordPatternParams = {
  leftHand: string[];
  rightHand: string[];
  padPattern?: PadPattern;
  timeSignature?: TimeSignature;
  /** When true the pattern loops indefinitely; when false it plays one bar. */
  loop?: boolean;
  tempoBpm?: number;
  playbackStyle?: PlaybackStyle;
  attack?: number;
  decay?: number;
  velocity?: number;
  humanize?: number;
  gate?: number;
  inversionRegister?: PlaybackRegister;
  instrument?: AudioInstrument;
  octaveShift?: number;
};

export type AudioEffectsState = {
  reverbWet: number;
  reverbRoomSize: number;
  reverbEnabled: boolean;
  chorusWet: number;
  chorusEnabled: boolean;
  chorusFrequency: number;
  chorusDelayTime: number;
  chorusDepth: number;
  feedbackDelayEnabled: boolean;
  feedbackDelayWet: number;
  feedbackDelayTime: number;
  feedbackDelayFeedback: number;
  tremoloEnabled: boolean;
  tremoloWet: number;
  tremoloFrequency: number;
  tremoloDepth: number;
  vibratoEnabled: boolean;
  vibratoWet: number;
  vibratoFrequency: number;
  vibratoDepth: number;
  phaserEnabled: boolean;
  phaserWet: number;
  phaserFrequency: number;
  phaserOctaves: number;
  phaserQ: number;
};

export interface AudioEffectsEngine {
  setReverbWet: (wet: number) => void;
  setChorusWet: (wet: number) => void;
  setReverbRoomSize: (roomSize: number) => void;
  setReverbEnabled: (enabled: boolean) => void;
  setChorusEnabled: (enabled: boolean) => void;
  setChorusFrequency: (value: number) => void;
  setChorusDelayTime: (value: number) => void;
  setChorusDepth: (value: number) => void;
  setFeedbackDelayEnabled: (enabled: boolean) => void;
  setFeedbackDelayWet: (wet: number) => void;
  setFeedbackDelayTime: (value: number) => void;
  setFeedbackDelayFeedback: (value: number) => void;
  setTremoloEnabled: (enabled: boolean) => void;
  setTremoloWet: (wet: number) => void;
  setTremoloFrequency: (value: number) => void;
  setTremoloDepth: (value: number) => void;
  setVibratoEnabled: (enabled: boolean) => void;
  setVibratoWet: (wet: number) => void;
  setVibratoFrequency: (value: number) => void;
  setVibratoDepth: (value: number) => void;
  setPhaserEnabled: (enabled: boolean) => void;
  setPhaserWet: (wet: number) => void;
  setPhaserFrequency: (value: number) => void;
  setPhaserOctaves: (value: number) => void;
  setPhaserQ: (value: number) => void;
}

export interface AudioLifecycleEngine {
  startAudio: () => Promise<void>;
  stopAllAudio: () => void;
}

export interface AudioPlaybackEngine {
  playMetronomeClick: (volume: number, isDownbeat: boolean) => Promise<void>;
  playMetronomePulse: (
    volume: number,
    isDownbeat: boolean,
    opts?: PlayMetronomePulseOptions,
  ) => Promise<void>;
  updatePlaybackTempo: (tempoBpm: number) => void;
  updateMetronomeTempo: (tempoBpm: number) => void;
  playChordVoicing: (params: PlayChordVoicingParams) => Promise<void>;
  playProgression: (
    voicings: ProgressionVoicing[],
    tempoBpm?: number,
    playbackStyle?: PlaybackStyle,
    attack?: number,
    decay?: number,
    opts?: PlayProgressionOptions,
  ) => Promise<void>;
  playChordPattern: (params: PlayChordPatternParams) => Promise<void>;
}

export interface AudioEngine
  extends AudioEffectsEngine, AudioLifecycleEngine, AudioPlaybackEngine {}
