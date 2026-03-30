import * as Tone from 'tone';
import type {
  AudioEngine,
  MetronomeSource,
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
import type { TimeSignature } from '../music/padPattern';
import {
  CHORD_BEATS,
  applyGate,
  clampUnitValue,
  getBeatDurationSeconds,
  getChordDurationSeconds,
  inferFallbackDrumDurationBeats,
  normalizeTempoBpm,
} from './engine/AudioMath';
import { triggerChordByStyle } from './engine/ChordTrigger';
import { loadDrumPattern, normalizeDrumPatternPath } from './engine/DrumPatternRepository';
import { createMetronomeSynthBank } from './engine/MetronomeSynthBank';
import { applyInversionLock, shiftNotesByOctaves } from './engine/NoteTransforms';

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

const REVERB_MIN_DECAY_SECONDS = 0.8;
const REVERB_MAX_DECAY_SECONDS = 10;
const MAX_HUMANIZE_TIMING_S = 0.05;
const MAX_HUMANIZE_VELOCITY = 12;

export const createToneAudioEngine = (): AudioEngine => {
  let pianoSampler: Tone.Sampler | null = null;
  let pianoSamplerLoaded: Promise<void> | null = null;
  let rhodesSampler: Tone.Sampler | null = null;
  let rhodesSamplerLoaded: Promise<void> | null = null;
  let chorusNode: Tone.Chorus | null = null;
  let feedbackDelayNode: Tone.FeedbackDelay | null = null;
  let tremoloNode: Tone.Tremolo | null = null;
  let vibratoNode: Tone.Vibrato | null = null;
  let phaserNode: Tone.Phaser | null = null;
  let reverbNode: Tone.Reverb | null = null;
  let reverbNodeReady: Promise<void> | null = null;
  let scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[] = [];
  let activePart: Tone.Part | null = null;
  let metronomeLoop: Tone.Loop | null = null;
  let metronomeClickBeat = 0;
  let activeMetronomePulseTimeouts: ReturnType<typeof setTimeout>[] = [];
  const metronomeSynthBank = createMetronomeSynthBank();

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
    if (pianoSampler) {
      pianoSampler.disconnect();
    }

    if (rhodesSampler) {
      rhodesSampler.disconnect();
    }
  };

  const connectSamplers = (target: Tone.ToneAudioNode | Tone.BaseContext['destination']): void => {
    if (pianoSampler) {
      pianoSampler.connect(target);
    }

    if (rhodesSampler) {
      rhodesSampler.connect(target);
    }
  };

  const getEnabledEffectsInOrder = (): Tone.ToneAudioNode[] => {
    const effects: Tone.ToneAudioNode[] = [];

    if (vibratoEnabled) {
      effects.push(getVibratoNode());
    }

    if (chorusEnabled) {
      effects.push(getChorusNode());
    }

    if (phaserEnabled) {
      effects.push(getPhaserNode());
    }

    if (feedbackDelayEnabled) {
      effects.push(getFeedbackDelayNode());
    }

    if (tremoloEnabled) {
      effects.push(getTremoloNode());
    }

    if (reverbEnabled) {
      effects.push(getReverbNode());
    }

    return effects;
  };

  const connectSamplerToCurrentOutput = (sampler: Tone.Sampler): Tone.Sampler => {
    sampler.disconnect();

    const enabledEffects = getEnabledEffectsInOrder();
    const target = enabledEffects[0] ?? Tone.getDestination();
    sampler.connect(target);

    return sampler;
  };

  const refreshEffectRouting = (): void => {
    [vibratoNode, chorusNode, phaserNode, feedbackDelayNode, tremoloNode, reverbNode].forEach(
      (node) => {
        node?.disconnect();
      },
    );

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

  const disposeEffectNode = (
    effect: 'reverb' | 'chorus' | 'feedback-delay' | 'tremolo' | 'vibrato' | 'phaser',
  ): void => {
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
    reverbWet = clampUnitValue(wet);
    if (reverbNode) {
      reverbNode.set({ wet: reverbWet });
    }
  };

  const setChorusWet = (wet: number): void => {
    chorusWet = clampUnitValue(wet);
    if (chorusNode) {
      chorusNode.set({ wet: chorusWet });
    }
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

    if (enabled) {
      const node = getReverbNode();
      node.set({ wet: reverbWet });
      const decayRange = REVERB_MAX_DECAY_SECONDS - REVERB_MIN_DECAY_SECONDS;
      node.decay = REVERB_MIN_DECAY_SECONDS + reverbRoomSize * decayRange;
    } else {
      disposeEffectNode('reverb');
    }

    refreshEffectRouting();
  };

  const setChorusEnabled = (enabled: boolean): void => {
    chorusEnabled = enabled;

    if (enabled) {
      getChorusNode().set({
        wet: chorusWet,
        frequency: chorusFrequency,
        delayTime: chorusDelayTime,
        depth: chorusDepth,
      });
    } else {
      disposeEffectNode('chorus');
    }

    refreshEffectRouting();
  };

  const setChorusFrequency = (value: number): void => {
    chorusFrequency = Math.max(0.1, value);
    if (chorusNode) {
      chorusNode.set({ frequency: chorusFrequency });
    }
  };

  const setChorusDelayTime = (value: number): void => {
    chorusDelayTime = Math.max(0.1, value);
    if (chorusNode) {
      chorusNode.set({ delayTime: chorusDelayTime });
    }
  };

  const setChorusDepth = (value: number): void => {
    chorusDepth = clampUnitValue(value);
    if (chorusNode) {
      chorusNode.set({ depth: chorusDepth });
    }
  };

  const setFeedbackDelayEnabled = (enabled: boolean): void => {
    feedbackDelayEnabled = enabled;

    if (enabled) {
      getFeedbackDelayNode().set({
        wet: feedbackDelayWet,
        delayTime: feedbackDelayTime,
        feedback: feedbackDelayFeedback,
      });
    } else {
      disposeEffectNode('feedback-delay');
    }

    refreshEffectRouting();
  };

  const setFeedbackDelayWet = (wet: number): void => {
    feedbackDelayWet = clampUnitValue(wet);
    if (feedbackDelayNode) {
      feedbackDelayNode.set({ wet: feedbackDelayWet });
    }
  };

  const setFeedbackDelayTime = (value: number): void => {
    feedbackDelayTime = Math.max(0.01, value);
    if (feedbackDelayNode) {
      feedbackDelayNode.set({ delayTime: feedbackDelayTime });
    }
  };

  const setFeedbackDelayFeedback = (value: number): void => {
    feedbackDelayFeedback = Math.min(0.95, Math.max(0, value));
    if (feedbackDelayNode) {
      feedbackDelayNode.set({ feedback: feedbackDelayFeedback });
    }
  };

  const setTremoloEnabled = (enabled: boolean): void => {
    tremoloEnabled = enabled;

    if (enabled) {
      getTremoloNode().set({
        wet: tremoloWet,
        frequency: tremoloFrequency,
        depth: tremoloDepth,
        spread: 180,
      });
    } else {
      disposeEffectNode('tremolo');
    }

    refreshEffectRouting();
  };

  const setTremoloWet = (wet: number): void => {
    tremoloWet = clampUnitValue(wet);
    if (tremoloNode) {
      tremoloNode.set({ wet: tremoloWet });
    }
  };

  const setTremoloFrequency = (value: number): void => {
    tremoloFrequency = Math.max(0.1, value);
    if (tremoloNode) {
      tremoloNode.set({ frequency: tremoloFrequency });
    }
  };

  const setTremoloDepth = (value: number): void => {
    tremoloDepth = clampUnitValue(value);
    if (tremoloNode) {
      tremoloNode.set({ depth: tremoloDepth });
    }
  };

  const setVibratoEnabled = (enabled: boolean): void => {
    vibratoEnabled = enabled;

    if (enabled) {
      getVibratoNode().set({
        wet: vibratoWet,
        frequency: vibratoFrequency,
        depth: vibratoDepth,
      });
    } else {
      disposeEffectNode('vibrato');
    }

    refreshEffectRouting();
  };

  const setVibratoWet = (wet: number): void => {
    vibratoWet = clampUnitValue(wet);
    if (vibratoNode) {
      vibratoNode.set({ wet: vibratoWet });
    }
  };

  const setVibratoFrequency = (value: number): void => {
    vibratoFrequency = Math.max(0.1, value);
    if (vibratoNode) {
      vibratoNode.set({ frequency: vibratoFrequency });
    }
  };

  const setVibratoDepth = (value: number): void => {
    vibratoDepth = clampUnitValue(value);
    if (vibratoNode) {
      vibratoNode.set({ depth: vibratoDepth });
    }
  };

  const setPhaserEnabled = (enabled: boolean): void => {
    phaserEnabled = enabled;

    if (enabled) {
      getPhaserNode().set({
        wet: phaserWet,
        frequency: phaserFrequency,
        octaves: phaserOctaves,
        Q: phaserQ,
      });
    } else {
      disposeEffectNode('phaser');
    }

    refreshEffectRouting();
  };

  const setPhaserWet = (wet: number): void => {
    phaserWet = clampUnitValue(wet);
    if (phaserNode) {
      phaserNode.set({ wet: phaserWet });
    }
  };

  const setPhaserFrequency = (value: number): void => {
    phaserFrequency = Math.max(0.1, value);
    if (phaserNode) {
      phaserNode.set({ frequency: phaserFrequency });
    }
  };

  const setPhaserOctaves = (value: number): void => {
    phaserOctaves = Math.max(0.1, value);
    if (phaserNode) {
      phaserNode.set({ octaves: phaserOctaves });
    }
  };

  const setPhaserQ = (value: number): void => {
    phaserQ = Math.max(0.1, value);
    if (phaserNode) {
      phaserNode.set({ Q: phaserQ });
    }
  };

  const getPianoSampler = (): Tone.Sampler => {
    if (!pianoSampler) {
      pianoSampler = new Tone.Sampler({
        urls: {
          A0: 'A0.mp3',
          C1: 'C1.mp3',
          'D#1': 'Ds1.mp3',
          'F#1': 'Fs1.mp3',
          A1: 'A1.mp3',
          C2: 'C2.mp3',
          'D#2': 'Ds2.mp3',
          'F#2': 'Fs2.mp3',
          A2: 'A2.mp3',
          C3: 'C3.mp3',
          'D#3': 'Ds3.mp3',
          'F#3': 'Fs3.mp3',
          A3: 'A3.mp3',
          C4: 'C4.mp3',
          'D#4': 'Ds4.mp3',
          'F#4': 'Fs4.mp3',
          A4: 'A4.mp3',
          C5: 'C5.mp3',
          'D#5': 'Ds5.mp3',
          'F#5': 'Fs5.mp3',
          A5: 'A5.mp3',
          C6: 'C6.mp3',
          'D#6': 'Ds6.mp3',
          'F#6': 'Fs6.mp3',
          A6: 'A6.mp3',
          C7: 'C7.mp3',
          'D#7': 'Ds7.mp3',
          'F#7': 'Fs7.mp3',
          A7: 'A7.mp3',
          C8: 'C8.mp3',
        },
        release: 1,
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
      });

      connectSamplerToCurrentOutput(pianoSampler);
      pianoSamplerLoaded = Tone.loaded();
    }

    return pianoSampler;
  };

  const ensurePianoSamplerLoaded = async (): Promise<Tone.Sampler> => {
    const sampler = getPianoSampler();

    await ensureReverbReady();

    if (pianoSamplerLoaded) {
      await pianoSamplerLoaded;
    }

    return sampler;
  };

  const getRhodesSampler = (): Tone.Sampler => {
    if (!rhodesSampler) {
      rhodesSampler = new Tone.Sampler({
        urls: {
          'A#1': 'a%231.mp3',
          'A#2': 'a%232.mp3',
          'A#3': 'a%233.mp3',
          'A#4': 'a%234.mp3',
          'A#5': 'a%235.mp3',
          'A#6': 'a%236.mp3',
          'A#7': 'a%237.mp3',
          A1: 'a1.mp3',
          A2: 'a2.mp3',
          A3: 'a3.mp3',
          A4: 'a4.mp3',
          A5: 'a5.mp3',
          A6: 'a6.mp3',
          A7: 'a7.mp3',
          B1: 'b1.mp3',
          B2: 'b2.mp3',
          B3: 'b3.mp3',
          B4: 'b4.mp3',
          B5: 'b5.mp3',
          B6: 'b6.mp3',
          B7: 'b7.mp3',
          'C#1': 'c%231.mp3',
          'C#2': 'c%232.mp3',
          'C#3': 'c%233.mp3',
          'C#4': 'c%234.mp3',
          'C#5': 'c%235.mp3',
          'C#6': 'c%236.mp3',
          'C#7': 'c%237.mp3',
          C1: 'c1.mp3',
          C2: 'c2.mp3',
          C3: 'c3.mp3',
          C4: 'c4.mp3',
          C5: 'c5.mp3',
          C6: 'c6.mp3',
          C7: 'c7.mp3',
          C8: 'c8.mp3',
          'D#1': 'd%231.mp3',
          'D#2': 'd%232.mp3',
          'D#3': 'd%233.mp3',
          'D#4': 'd%234.mp3',
          'D#5': 'd%235.mp3',
          'D#6': 'd%236.mp3',
          'D#7': 'd%237.mp3',
          D1: 'd1.mp3',
          D2: 'd2.mp3',
          D3: 'd3.mp3',
          D4: 'd4.mp3',
          D5: 'd5.mp3',
          D6: 'd6.mp3',
          D7: 'd7.mp3',
          E1: 'e1.mp3',
          E2: 'e2.mp3',
          E3: 'e3.mp3',
          E4: 'e4.mp3',
          E5: 'e5.mp3',
          E6: 'e6.mp3',
          E7: 'e7.mp3',
          'F#1': 'f%231.mp3',
          'F#2': 'f%232.mp3',
          'F#3': 'f%233.mp3',
          'F#4': 'f%234.mp3',
          'F#5': 'f%235.mp3',
          'F#6': 'f%236.mp3',
          'F#7': 'f%237.mp3',
          F1: 'f1.mp3',
          F2: 'f2.mp3',
          F3: 'f3.mp3',
          F4: 'f4.mp3',
          F5: 'f5.mp3',
          F6: 'f6.mp3',
          F7: 'f7.mp3',
          'G#1': 'g%231.mp3',
          'G#2': 'g%232.mp3',
          'G#3': 'g%233.mp3',
          'G#4': 'g%234.mp3',
          'G#5': 'g%235.mp3',
          'G#6': 'g%236.mp3',
          'G#7': 'g%237.mp3',
          G1: 'g1.mp3',
          G2: 'g2.mp3',
          G3: 'g3.mp3',
          G4: 'g4.mp3',
          G5: 'g5.mp3',
          G6: 'g6.mp3',
          G7: 'g7.mp3',
        },
        release: 0.8,
        baseUrl: '/audio/rhodes/',
      });

      connectSamplerToCurrentOutput(rhodesSampler);
      rhodesSamplerLoaded = Tone.loaded();
    }

    return rhodesSampler;
  };

  const ensureRhodesSamplerLoaded = async (): Promise<Tone.Sampler> => {
    const sampler = getRhodesSampler();

    await ensureReverbReady();

    if (rhodesSamplerLoaded) {
      await rhodesSamplerLoaded;
    }

    return sampler;
  };

  const startAudio = async (): Promise<void> => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
  };

  const stopAllAudio = (): void => {
    scheduledPlaybackTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    scheduledPlaybackTimeouts = [];
    activeMetronomePulseTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    activeMetronomePulseTimeouts = [];

    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (activePart) {
      activePart.dispose();
      activePart = null;
    }

    if (metronomeLoop) {
      metronomeLoop.dispose();
      metronomeLoop = null;
      metronomeClickBeat = 0;
    }

    if (pianoSampler) {
      pianoSampler.releaseAll();
    }

    if (rhodesSampler) {
      rhodesSampler.releaseAll();
    }

    metronomeSynthBank.releaseAll();
  };

  const playChordVoicing = async ({
    leftHand,
    rightHand,
    duration,
    tempoBpm,
    playbackStyle = 'strum',
    attack,
    decay,
    velocity,
    humanize = 0,
    gate = 1,
    inversionRegister = 'off',
    instrument = 'piano',
    octaveShift = 0,
  }: PlayChordVoicingParams): Promise<void> => {
    await startAudio();
    stopAllAudio();

    let audioInstrument: Tone.Sampler;
    if (instrument === 'rhodes') {
      audioInstrument = await ensureRhodesSamplerLoaded();
    } else {
      audioInstrument = await ensurePianoSamplerLoaded();
    }

    const chordDurSeconds = getChordDurationSeconds(tempoBpm);
    const noteDuration =
      gate !== 1 ? applyGate(chordDurSeconds, gate) : (duration ?? chordDurSeconds);

    const shiftedLeftHand = shiftNotesByOctaves(leftHand, octaveShift);
    const shiftedRightHand = shiftNotesByOctaves(rightHand, octaveShift);
    const lockedNotes = applyInversionLock(
      [...shiftedLeftHand, ...shiftedRightHand],
      inversionRegister,
    );

    if (lockedNotes.length > 0) {
      const timingDelay = humanize > 0 ? Math.random() * humanize * MAX_HUMANIZE_TIMING_S : 0;
      const velJitter =
        humanize > 0 ? (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_VELOCITY : 0;
      const effectiveVelocity =
        velocity !== undefined
          ? Math.round(Math.max(20, Math.min(127, velocity + velJitter)))
          : undefined;

      triggerChordByStyle({
        style: playbackStyle,
        instrument: audioInstrument,
        notes: lockedNotes,
        duration: noteDuration,
        startTime: timingDelay > 0 ? `+${timingDelay}` : undefined,
        attack,
        decay,
        velocity: effectiveVelocity,
      });
    }
  };

  const playMetronomePulse = async (
    volume: number,
    isDownbeat: boolean,
    opts?: PlayMetronomePulseOptions,
  ): Promise<void> => {
    await startAudio();

    const source: MetronomeSource = opts?.source ?? 'click';
    const normalizedVolume = clampUnitValue(volume);
    if (normalizedVolume <= 0) {
      return;
    }

    if (source === 'click') {
      const synth = metronomeSynthBank.getClickSynth();
      synth.volume.value = Tone.gainToDb(normalizedVolume * 0.45);
      synth.triggerAttackRelease(isDownbeat ? 'C6' : 'A5', '32n', Tone.now());
      return;
    }

    const drumPath = normalizeDrumPatternPath(opts?.drumPath);
    if (!drumPath) {
      const synth = metronomeSynthBank.getClickSynth();
      synth.volume.value = Tone.gainToDb(normalizedVolume * 0.45);
      synth.triggerAttackRelease(isDownbeat ? 'C6' : 'A5', '32n', Tone.now());
      return;
    }

    const pattern = await loadDrumPattern(drumPath);
    if (!pattern) {
      const synth = metronomeSynthBank.getClickSynth();
      synth.volume.value = Tone.gainToDb(normalizedVolume * 0.45);
      synth.triggerAttackRelease(isDownbeat ? 'C6' : 'A5', '32n', Tone.now());
      return;
    }

    const tempo = normalizeTempoBpm(opts?.tempoBpm);
    const beatDurationSeconds = getBeatDurationSeconds(tempo);
    const beatIndex = Math.max(0, opts?.beatIndex ?? 0);
    const patternDuration = Math.max(
      pattern.durationBeats,
      inferFallbackDrumDurationBeats(opts?.timeSignature ?? '4/4'),
    );
    const beatStartInPattern = beatIndex % patternDuration;
    const now = Tone.now();

    pattern.events.forEach((event) => {
      const eventBeatInPattern =
        ((event.beat % patternDuration) + patternDuration) % patternDuration;
      if (eventBeatInPattern < beatStartInPattern || eventBeatInPattern >= beatStartInPattern + 1) {
        return;
      }

      const offsetBeats = eventBeatInPattern - beatStartInPattern;
      const eventTime = now + offsetBeats * beatDurationSeconds;
      const eventDurationSeconds = Math.max(0.02, event.durationBeats * beatDurationSeconds);
      metronomeSynthBank.triggerDrumHit(
        event.midi,
        eventTime,
        eventDurationSeconds,
        event.velocity * normalizedVolume,
      );
    });
  };

  const playMetronomeClick = async (volume: number, isDownbeat: boolean): Promise<void> => {
    await playMetronomePulse(volume, isDownbeat, { source: 'click' });
  };

  const startMetronomeLoop = (
    tempoBpm: number,
    timeSignature: TimeSignature,
    volume: number,
    totalDurationSeconds: number,
    source: MetronomeSource,
    drumPath: string | null,
  ): void => {
    const singleBeatSeconds = getBeatDurationSeconds(tempoBpm);
    const beatsPerBar = TIME_SIGNATURE_BEATS_PER_BAR[timeSignature];
    const totalBeats = Math.ceil(totalDurationSeconds / singleBeatSeconds);
    metronomeClickBeat = 0;

    if (source === 'drum' && drumPath) {
      void loadDrumPattern(drumPath);
    }

    metronomeLoop = new Tone.Loop((time) => {
      if (metronomeClickBeat >= totalBeats) {
        return;
      }
      const isDownbeat = metronomeClickBeat % beatsPerBar === 0;
      if (source === 'click') {
        const synth = metronomeSynthBank.getClickSynth();
        synth.volume.value = volume > 0 ? Tone.gainToDb(volume * 0.45) : -Infinity;
        synth.triggerAttackRelease(isDownbeat ? 'C6' : 'A5', '32n', time);
      } else {
        const beatIndex = metronomeClickBeat;
        const delayMs = Math.max(0, (time - Tone.now()) * 1000);
        const timeoutId = setTimeout(() => {
          activeMetronomePulseTimeouts = activeMetronomePulseTimeouts.filter(
            (id) => id !== timeoutId,
          );
          void playMetronomePulse(volume, isDownbeat, {
            source,
            drumPath,
            timeSignature,
            tempoBpm,
            beatIndex,
          });
        }, delayMs);
        activeMetronomePulseTimeouts.push(timeoutId);
      }
      metronomeClickBeat += 1;
    }, singleBeatSeconds);

    metronomeLoop.start(0);
  };

  const playProgression = async (
    voicings: ProgressionVoicing[],
    tempoBpm?: number,
    playbackStyle: PlaybackStyle = 'strum',
    attack?: number,
    decay?: number,
    opts?: PlayProgressionOptions,
  ): Promise<void> => {
    await startAudio();
    stopAllAudio();

    const {
      velocity,
      humanize = 0,
      gate = 1,
      inversionRegister = 'off',
      instrument = 'piano',
      octaveShift = 0,
      padPattern = 'single',
      timeSignature = '4/4',
      metronomeEnabled = false,
      metronomeVolume = 0.7,
      metronomeSource = 'click',
      metronomeDrumPath = null,
    } = opts ?? {};

    let audioInstrument: Tone.Sampler;
    if (instrument === 'rhodes') {
      audioInstrument = await ensureRhodesSamplerLoaded();
    } else {
      audioInstrument = await ensurePianoSamplerLoaded();
    }

    const normalizedTempo = normalizeTempoBpm(tempoBpm);
    Tone.Transport.bpm.value = normalizedTempo;
    Tone.Transport.timeSignature = TIME_SIGNATURE_NUMERATOR[timeSignature];

    const singleBeatSeconds = 60 / normalizedTempo;
    const chordDurationSeconds = getChordDurationSeconds(normalizedTempo);
    const noteDuration = applyGate(chordDurationSeconds, gate);
    const totalDurationSeconds = voicings.length * chordDurationSeconds;

    // Only use pattern beats that fall within each chord's time slot (CHORD_BEATS wide)
    const patternBeats = getPadPatternBeats(padPattern, timeSignature).filter(
      (beat) => beat.offsetBeats < CHORD_BEATS,
    );

    const events = voicings.flatMap((voicing, index) =>
      patternBeats.map((beat) => ({
        time: index * chordDurationSeconds + beat.offsetBeats * singleBeatSeconds,
        voicing,
        velocityScale: beat.velocityScale,
      })),
    );

    const part = new Tone.Part<{
      time: number;
      voicing: ProgressionVoicing;
      velocityScale: number;
    }>((time, event) => {
      const { voicing, velocityScale } = event;
      const shiftedLeftHand = shiftNotesByOctaves(voicing.leftHand, octaveShift);
      const shiftedRightHand = shiftNotesByOctaves(voicing.rightHand, octaveShift);
      const lockedNotes = applyInversionLock(
        [...shiftedLeftHand, ...shiftedRightHand],
        inversionRegister,
      );

      if (lockedNotes.length > 0) {
        const timingJitter =
          humanize > 0 ? (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_TIMING_S : 0;
        const velJitter =
          humanize > 0 ? (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_VELOCITY : 0;
        const effectiveVelocity =
          velocity !== undefined
            ? Math.round(Math.max(20, Math.min(127, velocity * velocityScale + velJitter)))
            : undefined;

        triggerChordByStyle({
          style: playbackStyle,
          instrument: audioInstrument,
          notes: lockedNotes,
          duration: noteDuration,
          startTime: timingJitter !== 0 ? time + timingJitter : time,
          attack,
          decay,
          velocity: effectiveVelocity,
        });
      }
    }, events);

    activePart = part;
    part.start(0);

    if (metronomeEnabled) {
      startMetronomeLoop(
        normalizedTempo,
        timeSignature,
        metronomeVolume,
        totalDurationSeconds,
        metronomeSource,
        metronomeDrumPath,
      );
    }

    Tone.Transport.start();
  };

  const playChordPattern = async ({
    leftHand,
    rightHand,
    padPattern = 'single',
    timeSignature = '4/4',
    loop = false,
    tempoBpm,
    playbackStyle = 'strum',
    attack,
    decay,
    velocity,
    humanize = 0,
    gate = 1,
    inversionRegister = 'off',
    instrument = 'piano',
    octaveShift = 0,
  }: PlayChordPatternParams): Promise<void> => {
    if (padPattern === 'single') {
      return playChordVoicing({
        leftHand,
        rightHand,
        tempoBpm,
        playbackStyle,
        attack,
        decay,
        velocity,
        humanize,
        gate,
        inversionRegister,
        instrument,
        octaveShift,
      });
    }

    await startAudio();
    stopAllAudio();

    let audioInstrument: Tone.Sampler;
    if (instrument === 'rhodes') {
      audioInstrument = await ensureRhodesSamplerLoaded();
    } else {
      audioInstrument = await ensurePianoSamplerLoaded();
    }

    const normalizedTempo = normalizeTempoBpm(tempoBpm);
    Tone.Transport.bpm.value = normalizedTempo;
    Tone.Transport.timeSignature = TIME_SIGNATURE_NUMERATOR[timeSignature];

    const singleBeatSeconds = 60 / normalizedTempo;
    const chordDurSeconds = getChordDurationSeconds(normalizedTempo);
    const noteDuration = gate !== 1 ? applyGate(chordDurSeconds, gate) : chordDurSeconds;
    const beatsPerBar = TIME_SIGNATURE_BEATS_PER_BAR[timeSignature];
    const barDurationSeconds = beatsPerBar * singleBeatSeconds;

    const shiftedLeftHand = shiftNotesByOctaves(leftHand, octaveShift);
    const shiftedRightHand = shiftNotesByOctaves(rightHand, octaveShift);
    const lockedNotes = applyInversionLock(
      [...shiftedLeftHand, ...shiftedRightHand],
      inversionRegister,
    );

    if (lockedNotes.length === 0) {
      return;
    }

    const patternBeats = getPadPatternBeats(padPattern, timeSignature);
    const events = patternBeats.map((beat) => ({
      time: beat.offsetBeats * singleBeatSeconds,
      velocityScale: beat.velocityScale,
    }));

    const part = new Tone.Part<{ time: number; velocityScale: number }>((time, event) => {
      const timingDelay = humanize > 0 ? Math.random() * humanize * MAX_HUMANIZE_TIMING_S : 0;
      const velJitter =
        humanize > 0 ? (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_VELOCITY : 0;
      const scaledVelocity =
        velocity !== undefined
          ? Math.round(Math.max(20, Math.min(127, velocity * event.velocityScale + velJitter)))
          : undefined;

      triggerChordByStyle({
        style: playbackStyle,
        instrument: audioInstrument,
        notes: lockedNotes,
        duration: noteDuration,
        startTime: timingDelay > 0 ? time + timingDelay : time,
        attack,
        decay,
        velocity: scaledVelocity,
      });
    }, events);

    if (loop) {
      part.loop = true;
      part.loopStart = 0;
      part.loopEnd = barDurationSeconds;
    } else {
      // Stop Transport after one bar completes
      const cleanupTimeout = setTimeout(
        () => {
          stopAllAudio();
        },
        (barDurationSeconds + 0.15) * 1000,
      );
      scheduledPlaybackTimeouts.push(cleanupTimeout);
    }

    activePart = part;
    part.start(0);
    Tone.Transport.start();
  };

  return {
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
    startAudio,
    playMetronomeClick,
    playMetronomePulse,
    stopAllAudio,
    playChordVoicing,
    playProgression,
    playChordPattern,
  };
};

let activeAudioEngine: AudioEngine | null = null;

export type AudioEngineScope = {
  engine: AudioEngine;
  attach: () => void;
  detach: () => void;
  run: <T>(work: () => T) => T;
  runAsync: <T>(work: () => Promise<T>) => Promise<T>;
};

export const getAudioEngine = (): AudioEngine => {
  if (!activeAudioEngine) {
    activeAudioEngine = createToneAudioEngine();
  }

  return activeAudioEngine;
};

export const setAudioEngine = (engine: AudioEngine): void => {
  activeAudioEngine = engine;
};

export const resetAudioEngine = (): void => {
  activeAudioEngine = null;
};

export const createAudioEngineScope = (
  engine: AudioEngine = createToneAudioEngine(),
): AudioEngineScope => {
  let previousAttachedEngine: AudioEngine | null = null;
  let isAttached = false;

  const attach = (): void => {
    previousAttachedEngine = activeAudioEngine;
    isAttached = true;
    setAudioEngine(engine);
  };

  const detach = (): void => {
    if (!isAttached) {
      return;
    }

    if (activeAudioEngine === engine) {
      activeAudioEngine = previousAttachedEngine;
    }

    previousAttachedEngine = null;
    isAttached = false;
  };

  const run = <T>(work: () => T): T => {
    const previousEngine = activeAudioEngine;
    activeAudioEngine = engine;

    try {
      return work();
    } finally {
      activeAudioEngine = previousEngine;
    }
  };

  const runAsync = async <T>(work: () => Promise<T>): Promise<T> => {
    const previousEngine = activeAudioEngine;
    activeAudioEngine = engine;

    try {
      return await work();
    } finally {
      activeAudioEngine = previousEngine;
    }
  };

  return {
    engine,
    attach,
    detach,
    run,
    runAsync,
  };
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
