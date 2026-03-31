import * as Tone from 'tone';
import { clampUnitValue } from './AudioMath';

const REVERB_MIN_DECAY_SECONDS = 0.8;
const REVERB_MAX_DECAY_SECONDS = 10;

type EffectKey = 'reverb' | 'chorus' | 'feedback-delay' | 'tremolo' | 'vibrato' | 'phaser';
type EffectNode = Tone.ToneAudioNode & {
  set: (values: Record<string, unknown>) => unknown;
  dispose: () => void;
};

export type EffectsChain = {
  connectSamplerToCurrentOutput: (sampler: Tone.Sampler) => Tone.Sampler;
  ensureReverbReady: () => Promise<void>;
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
};

export const createEffectsChain = (): EffectsChain => {
  let chorusNode: Tone.Chorus | null = null;
  let feedbackDelayNode: Tone.FeedbackDelay | null = null;
  let tremoloNode: Tone.Tremolo | null = null;
  let vibratoNode: Tone.Vibrato | null = null;
  let phaserNode: Tone.Phaser | null = null;
  let reverbNode: Tone.Reverb | null = null;
  let reverbNodeReady: Promise<void> | null = null;

  const registeredSamplers = new Set<Tone.Sampler>();

  let reverbEnabled = false;
  let reverbWet = 0;
  let reverbRoomSize = 0.25;

  let chorusEnabled = false;
  let chorusWet = 0;
  let chorusFrequency = 1.5;
  let chorusDelayTime = 3.5;
  let chorusDepth = 0.7;

  let feedbackDelayEnabled = false;
  let feedbackDelayWet = 0;
  let feedbackDelayTime = 0.25;
  let feedbackDelayFeedback = 0.35;

  let tremoloEnabled = false;
  let tremoloWet = 0;
  let tremoloFrequency = 9;
  let tremoloDepth = 0.5;

  let vibratoEnabled = false;
  let vibratoWet = 0;
  let vibratoFrequency = 5;
  let vibratoDepth = 0.1;

  let phaserEnabled = false;
  let phaserWet = 0;
  let phaserFrequency = 0.5;
  let phaserOctaves = 3;
  let phaserQ = 10;

  const getEffectNodes = (): Array<EffectNode | null> => [
    vibratoNode,
    chorusNode,
    phaserNode,
    feedbackDelayNode,
    tremoloNode,
    reverbNode,
  ];

  const updateNodeSettings = (node: EffectNode | null, values: Record<string, unknown>): void => {
    if (node) {
      node.set(values);
    }
  };

  const updateEffectParam = ({
    value,
    normalize,
    assign,
    node,
    nodeKey,
  }: {
    value: number;
    normalize: (nextValue: number) => number;
    assign: (nextValue: number) => void;
    node: EffectNode | null;
    nodeKey: string;
  }): void => {
    const normalizedValue = normalize(value);
    assign(normalizedValue);
    updateNodeSettings(node, { [nodeKey]: normalizedValue });
  };

  const getReverbNode = (): Tone.Reverb => {
    if (!reverbNode) {
      reverbNode = new Tone.Reverb({ decay: 2.5, wet: 0 }).toDestination();
      reverbNodeReady = reverbNode.ready;
    }
    return reverbNode;
  };

  const getChorusNode = (): Tone.Chorus => {
    if (!chorusNode) {
      chorusNode = new Tone.Chorus({
        frequency: chorusFrequency,
        delayTime: chorusDelayTime,
        depth: chorusDepth,
        wet: chorusWet,
      }).start();
    }

    return chorusNode;
  };

  const getTremoloNode = (): Tone.Tremolo => {
    if (!tremoloNode) {
      tremoloNode = new Tone.Tremolo({
        frequency: tremoloFrequency,
        depth: tremoloDepth,
        wet: tremoloWet,
        spread: 180,
      }).start();
    }

    return tremoloNode;
  };

  const getFeedbackDelayNode = (): Tone.FeedbackDelay => {
    if (!feedbackDelayNode) {
      feedbackDelayNode = new Tone.FeedbackDelay({
        delayTime: feedbackDelayTime,
        feedback: feedbackDelayFeedback,
        wet: feedbackDelayWet,
      });
    }

    return feedbackDelayNode;
  };

  const getVibratoNode = (): Tone.Vibrato => {
    if (!vibratoNode) {
      vibratoNode = new Tone.Vibrato({
        frequency: vibratoFrequency,
        depth: vibratoDepth,
        wet: vibratoWet,
      });
    }

    return vibratoNode;
  };

  const getPhaserNode = (): Tone.Phaser => {
    if (!phaserNode) {
      phaserNode = new Tone.Phaser({
        frequency: phaserFrequency,
        octaves: phaserOctaves,
        Q: phaserQ,
        wet: phaserWet,
      });
    }

    return phaserNode;
  };

  const disconnectSamplers = (): void => {
    registeredSamplers.forEach((sampler) => sampler.disconnect());
  };

  const connectSamplers = (target: Tone.ToneAudioNode | Tone.BaseContext['destination']): void => {
    registeredSamplers.forEach((sampler) => sampler.connect(target));
  };

  const getEnabledEffectsInOrder = (): Tone.ToneAudioNode[] => {
    const orderedEffectDescriptors = [
      { enabled: vibratoEnabled, getNode: getVibratoNode },
      { enabled: chorusEnabled, getNode: getChorusNode },
      { enabled: phaserEnabled, getNode: getPhaserNode },
      { enabled: feedbackDelayEnabled, getNode: getFeedbackDelayNode },
      { enabled: tremoloEnabled, getNode: getTremoloNode },
      { enabled: reverbEnabled, getNode: getReverbNode },
    ];

    return orderedEffectDescriptors
      .filter(({ enabled }) => enabled)
      .map(({ getNode }) => getNode());
  };

  const refreshEffectRouting = (): void => {
    getEffectNodes().forEach((node) => {
      node?.disconnect();
    });

    const enabledEffects = getEnabledEffectsInOrder();

    disconnectSamplers();

    if (enabledEffects.length === 0) {
      connectSamplers(Tone.getDestination());
      return;
    }

    for (let i = 0; i < enabledEffects.length - 1; i += 1) {
      enabledEffects[i].connect(enabledEffects[i + 1]);
    }

    enabledEffects[enabledEffects.length - 1].connect(Tone.getDestination());
    connectSamplers(enabledEffects[0]);
  };

  const disposeEffectNode = (effect: EffectKey): void => {
    if (effect === 'reverb' && reverbNode) {
      reverbNode.dispose();
      reverbNode = null;
      reverbNodeReady = null;
      return;
    }

    if (effect === 'chorus' && chorusNode) {
      chorusNode.dispose();
      chorusNode = null;
      return;
    }

    if (effect === 'feedback-delay' && feedbackDelayNode) {
      feedbackDelayNode.dispose();
      feedbackDelayNode = null;
      return;
    }

    if (effect === 'tremolo' && tremoloNode) {
      tremoloNode.dispose();
      tremoloNode = null;
      return;
    }

    if (effect === 'vibrato' && vibratoNode) {
      vibratoNode.dispose();
      vibratoNode = null;
      return;
    }

    if (effect === 'phaser' && phaserNode) {
      phaserNode.dispose();
      phaserNode = null;
    }
  };

  const toggleEffect = ({
    enabled,
    effect,
    applySettings,
  }: {
    enabled: boolean;
    effect: EffectKey;
    applySettings: () => void;
  }): void => {
    if (enabled) {
      applySettings();
    } else {
      disposeEffectNode(effect);
    }

    refreshEffectRouting();
  };

  const connectSamplerToCurrentOutput = (sampler: Tone.Sampler): Tone.Sampler => {
    registeredSamplers.add(sampler);
    sampler.disconnect();

    const enabledEffects = getEnabledEffectsInOrder();
    const target = enabledEffects[0] ?? Tone.getDestination();
    sampler.connect(target);

    return sampler;
  };

  const ensureReverbReady = async (): Promise<void> => {
    if (!reverbEnabled) {
      return;
    }

    getReverbNode();
    if (reverbNodeReady) {
      await reverbNodeReady;
    }
  };

  const setReverbWet = (wet: number): void => {
    updateEffectParam({
      value: wet,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        reverbWet = nextValue;
      },
      node: reverbNode,
      nodeKey: 'wet',
    });
  };

  const setChorusWet = (wet: number): void => {
    updateEffectParam({
      value: wet,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        chorusWet = nextValue;
      },
      node: chorusNode,
      nodeKey: 'wet',
    });
  };

  const setReverbRoomSize = (roomSize: number): void => {
    const normalizedRoomSize = clampUnitValue(roomSize);
    reverbRoomSize = normalizedRoomSize;
    const decayRange = REVERB_MAX_DECAY_SECONDS - REVERB_MIN_DECAY_SECONDS;
    if (reverbNode) {
      reverbNode.decay = REVERB_MIN_DECAY_SECONDS + normalizedRoomSize * decayRange;
    }
  };

  const setReverbEnabled = (enabled: boolean): void => {
    reverbEnabled = enabled;

    toggleEffect({
      enabled,
      effect: 'reverb',
      applySettings: () => {
        const node = getReverbNode();
        node.set({ wet: reverbWet });
        const decayRange = REVERB_MAX_DECAY_SECONDS - REVERB_MIN_DECAY_SECONDS;
        node.decay = REVERB_MIN_DECAY_SECONDS + reverbRoomSize * decayRange;
      },
    });
  };

  const setChorusEnabled = (enabled: boolean): void => {
    chorusEnabled = enabled;

    toggleEffect({
      enabled,
      effect: 'chorus',
      applySettings: () => {
        getChorusNode().set({
          wet: chorusWet,
          frequency: chorusFrequency,
          delayTime: chorusDelayTime,
          depth: chorusDepth,
        });
      },
    });
  };

  const setChorusFrequency = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.1, nextValue),
      assign: (nextValue) => {
        chorusFrequency = nextValue;
      },
      node: chorusNode,
      nodeKey: 'frequency',
    });
  };

  const setChorusDelayTime = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.1, nextValue),
      assign: (nextValue) => {
        chorusDelayTime = nextValue;
      },
      node: chorusNode,
      nodeKey: 'delayTime',
    });
  };

  const setChorusDepth = (value: number): void => {
    updateEffectParam({
      value,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        chorusDepth = nextValue;
      },
      node: chorusNode,
      nodeKey: 'depth',
    });
  };

  const setFeedbackDelayEnabled = (enabled: boolean): void => {
    feedbackDelayEnabled = enabled;

    toggleEffect({
      enabled,
      effect: 'feedback-delay',
      applySettings: () => {
        getFeedbackDelayNode().set({
          wet: feedbackDelayWet,
          delayTime: feedbackDelayTime,
          feedback: feedbackDelayFeedback,
        });
      },
    });
  };

  const setFeedbackDelayWet = (wet: number): void => {
    updateEffectParam({
      value: wet,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        feedbackDelayWet = nextValue;
      },
      node: feedbackDelayNode,
      nodeKey: 'wet',
    });
  };

  const setFeedbackDelayTime = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.01, nextValue),
      assign: (nextValue) => {
        feedbackDelayTime = nextValue;
      },
      node: feedbackDelayNode,
      nodeKey: 'delayTime',
    });
  };

  const setFeedbackDelayFeedback = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.min(0.95, Math.max(0, nextValue)),
      assign: (nextValue) => {
        feedbackDelayFeedback = nextValue;
      },
      node: feedbackDelayNode,
      nodeKey: 'feedback',
    });
  };

  const setTremoloEnabled = (enabled: boolean): void => {
    tremoloEnabled = enabled;

    toggleEffect({
      enabled,
      effect: 'tremolo',
      applySettings: () => {
        getTremoloNode().set({
          wet: tremoloWet,
          frequency: tremoloFrequency,
          depth: tremoloDepth,
          spread: 180,
        });
      },
    });
  };

  const setTremoloWet = (wet: number): void => {
    updateEffectParam({
      value: wet,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        tremoloWet = nextValue;
      },
      node: tremoloNode,
      nodeKey: 'wet',
    });
  };

  const setTremoloFrequency = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.1, nextValue),
      assign: (nextValue) => {
        tremoloFrequency = nextValue;
      },
      node: tremoloNode,
      nodeKey: 'frequency',
    });
  };

  const setTremoloDepth = (value: number): void => {
    updateEffectParam({
      value,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        tremoloDepth = nextValue;
      },
      node: tremoloNode,
      nodeKey: 'depth',
    });
  };

  const setVibratoEnabled = (enabled: boolean): void => {
    vibratoEnabled = enabled;

    toggleEffect({
      enabled,
      effect: 'vibrato',
      applySettings: () => {
        getVibratoNode().set({
          wet: vibratoWet,
          frequency: vibratoFrequency,
          depth: vibratoDepth,
        });
      },
    });
  };

  const setVibratoWet = (wet: number): void => {
    updateEffectParam({
      value: wet,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        vibratoWet = nextValue;
      },
      node: vibratoNode,
      nodeKey: 'wet',
    });
  };

  const setVibratoFrequency = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.1, nextValue),
      assign: (nextValue) => {
        vibratoFrequency = nextValue;
      },
      node: vibratoNode,
      nodeKey: 'frequency',
    });
  };

  const setVibratoDepth = (value: number): void => {
    updateEffectParam({
      value,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        vibratoDepth = nextValue;
      },
      node: vibratoNode,
      nodeKey: 'depth',
    });
  };

  const setPhaserEnabled = (enabled: boolean): void => {
    phaserEnabled = enabled;

    toggleEffect({
      enabled,
      effect: 'phaser',
      applySettings: () => {
        getPhaserNode().set({
          wet: phaserWet,
          frequency: phaserFrequency,
          octaves: phaserOctaves,
          Q: phaserQ,
        });
      },
    });
  };

  const setPhaserWet = (wet: number): void => {
    updateEffectParam({
      value: wet,
      normalize: clampUnitValue,
      assign: (nextValue) => {
        phaserWet = nextValue;
      },
      node: phaserNode,
      nodeKey: 'wet',
    });
  };

  const setPhaserFrequency = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.1, nextValue),
      assign: (nextValue) => {
        phaserFrequency = nextValue;
      },
      node: phaserNode,
      nodeKey: 'frequency',
    });
  };

  const setPhaserOctaves = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.1, nextValue),
      assign: (nextValue) => {
        phaserOctaves = nextValue;
      },
      node: phaserNode,
      nodeKey: 'octaves',
    });
  };

  const setPhaserQ = (value: number): void => {
    updateEffectParam({
      value,
      normalize: (nextValue) => Math.max(0.1, nextValue),
      assign: (nextValue) => {
        phaserQ = nextValue;
      },
      node: phaserNode,
      nodeKey: 'Q',
    });
  };

  return {
    connectSamplerToCurrentOutput,
    ensureReverbReady,
    setReverbWet,
    setChorusWet,
    setReverbRoomSize,
    setReverbEnabled,
    setChorusEnabled,
    setChorusFrequency,
    setChorusDelayTime,
    setChorusDepth,
    setFeedbackDelayEnabled,
    setFeedbackDelayWet,
    setFeedbackDelayTime,
    setFeedbackDelayFeedback,
    setTremoloEnabled,
    setTremoloWet,
    setTremoloFrequency,
    setTremoloDepth,
    setVibratoEnabled,
    setVibratoWet,
    setVibratoFrequency,
    setVibratoDepth,
    setPhaserEnabled,
    setPhaserWet,
    setPhaserFrequency,
    setPhaserOctaves,
    setPhaserQ,
  };
};
