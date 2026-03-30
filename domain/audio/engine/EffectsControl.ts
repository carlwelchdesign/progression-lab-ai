import type { EffectsChain } from './EffectsChain';

interface EffectsControl {
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

export const createEffectsControl = (effectsChain: EffectsChain): EffectsControl => {
  return {
    setReverbWet: (wet: number) => effectsChain.setReverbWet(wet),
    setChorusWet: (wet: number) => effectsChain.setChorusWet(wet),
    setReverbRoomSize: (roomSize: number) => effectsChain.setReverbRoomSize(roomSize),
    setReverbEnabled: (enabled: boolean) => effectsChain.setReverbEnabled(enabled),
    setChorusEnabled: (enabled: boolean) => effectsChain.setChorusEnabled(enabled),
    setChorusFrequency: (value: number) => effectsChain.setChorusFrequency(value),
    setChorusDelayTime: (value: number) => effectsChain.setChorusDelayTime(value),
    setChorusDepth: (value: number) => effectsChain.setChorusDepth(value),
    setFeedbackDelayEnabled: (enabled: boolean) => effectsChain.setFeedbackDelayEnabled(enabled),
    setFeedbackDelayWet: (wet: number) => effectsChain.setFeedbackDelayWet(wet),
    setFeedbackDelayTime: (value: number) => effectsChain.setFeedbackDelayTime(value),
    setFeedbackDelayFeedback: (value: number) => effectsChain.setFeedbackDelayFeedback(value),
    setTremoloEnabled: (enabled: boolean) => effectsChain.setTremoloEnabled(enabled),
    setTremoloWet: (wet: number) => effectsChain.setTremoloWet(wet),
    setTremoloFrequency: (value: number) => effectsChain.setTremoloFrequency(value),
    setTremoloDepth: (value: number) => effectsChain.setTremoloDepth(value),
    setVibratoEnabled: (enabled: boolean) => effectsChain.setVibratoEnabled(enabled),
    setVibratoWet: (wet: number) => effectsChain.setVibratoWet(wet),
    setVibratoFrequency: (value: number) => effectsChain.setVibratoFrequency(value),
    setVibratoDepth: (value: number) => effectsChain.setVibratoDepth(value),
    setPhaserEnabled: (enabled: boolean) => effectsChain.setPhaserEnabled(enabled),
    setPhaserWet: (wet: number) => effectsChain.setPhaserWet(wet),
    setPhaserFrequency: (value: number) => effectsChain.setPhaserFrequency(value),
    setPhaserOctaves: (value: number) => effectsChain.setPhaserOctaves(value),
    setPhaserQ: (value: number) => effectsChain.setPhaserQ(value),
  };
};

export type { EffectsControl };
