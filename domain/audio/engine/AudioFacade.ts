import type {
  AudioEngine,
  PlayChordVoicingParams,
  PlayChordPatternParams,
  PlayMetronomePulseOptions,
  PlaybackStyle,
  PlayProgressionOptions,
  ProgressionVoicing,
} from '../audioEngine';

interface AudioFacade {
  // Effects control
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
  // Lifecycle
  startAudio: () => Promise<void>;
  stopAllAudio: () => void;
  isAudioInitialized: () => boolean;
  // Playback
  playMetronomeClick: (volume: number, isDownbeat: boolean) => Promise<void>;
  playMetronomePulse: (
    volume: number,
    isDownbeat: boolean,
    opts?: PlayMetronomePulseOptions,
  ) => Promise<void>;
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

interface AudioFacadeRegistry {
  getAudioEngine: () => AudioEngine;
  setAudioEngine: (engine: AudioEngine) => void;
  resetAudioEngine: () => void;
}

export const createAudioFacade = (registry: AudioFacadeRegistry): AudioFacade => {
  const getEngine = () => registry.getAudioEngine();

  return {
    // Effects control
    setReverbWet: (wet: number) => getEngine().setReverbWet(wet),
    setChorusWet: (wet: number) => getEngine().setChorusWet(wet),
    setReverbRoomSize: (roomSize: number) => getEngine().setReverbRoomSize(roomSize),
    setReverbEnabled: (enabled: boolean) => getEngine().setReverbEnabled(enabled),
    setChorusEnabled: (enabled: boolean) => getEngine().setChorusEnabled(enabled),
    setChorusFrequency: (value: number) => getEngine().setChorusFrequency(value),
    setChorusDelayTime: (value: number) => getEngine().setChorusDelayTime(value),
    setChorusDepth: (value: number) => getEngine().setChorusDepth(value),
    setFeedbackDelayEnabled: (enabled: boolean) => getEngine().setFeedbackDelayEnabled(enabled),
    setFeedbackDelayWet: (wet: number) => getEngine().setFeedbackDelayWet(wet),
    setFeedbackDelayTime: (value: number) => getEngine().setFeedbackDelayTime(value),
    setFeedbackDelayFeedback: (value: number) => getEngine().setFeedbackDelayFeedback(value),
    setTremoloEnabled: (enabled: boolean) => getEngine().setTremoloEnabled(enabled),
    setTremoloWet: (wet: number) => getEngine().setTremoloWet(wet),
    setTremoloFrequency: (value: number) => getEngine().setTremoloFrequency(value),
    setTremoloDepth: (value: number) => getEngine().setTremoloDepth(value),
    setVibratoEnabled: (enabled: boolean) => getEngine().setVibratoEnabled(enabled),
    setVibratoWet: (wet: number) => getEngine().setVibratoWet(wet),
    setVibratoFrequency: (value: number) => getEngine().setVibratoFrequency(value),
    setVibratoDepth: (value: number) => getEngine().setVibratoDepth(value),
    setPhaserEnabled: (enabled: boolean) => getEngine().setPhaserEnabled(enabled),
    setPhaserWet: (wet: number) => getEngine().setPhaserWet(wet),
    setPhaserFrequency: (value: number) => getEngine().setPhaserFrequency(value),
    setPhaserOctaves: (value: number) => getEngine().setPhaserOctaves(value),
    setPhaserQ: (value: number) => getEngine().setPhaserQ(value),
    // Lifecycle
    startAudio: () => getEngine().startAudio(),
    stopAllAudio: () => getEngine().stopAllAudio(),
    isAudioInitialized: () => {
      // isAudioInitialized implementation moved to audio.ts
      // as it requires direct Tone access
      return false;
    },
    // Playback
    playMetronomeClick: (volume: number, isDownbeat: boolean) =>
      getEngine().playMetronomeClick(volume, isDownbeat),
    playMetronomePulse: (volume: number, isDownbeat: boolean, opts) =>
      getEngine().playMetronomePulse(volume, isDownbeat, opts),
    playChordVoicing: (params) => getEngine().playChordVoicing(params),
    playProgression: (voicings, tempoBpm, playbackStyle, attack, decay, opts) =>
      getEngine().playProgression(voicings, tempoBpm, playbackStyle, attack, decay, opts),
    playChordPattern: (params) => getEngine().playChordPattern(params),
  };
};

export type { AudioFacade };
