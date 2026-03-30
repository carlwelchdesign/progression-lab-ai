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
  getBeatDurationSeconds,
  getChordDurationSeconds,
  inferFallbackDrumDurationBeats,
  normalizeTempoBpm,
} from './engine/AudioMath';
import { createAudioEngineRegistry, type AudioEngineScope } from './engine/AudioEngineRegistry';
import { triggerChordByStyle } from './engine/ChordTrigger';
import { loadDrumPattern, normalizeDrumPatternPath } from './engine/DrumPatternRepository';
import { createEffectsChain } from './engine/EffectsChain';
import { createMetronomeSynthBank } from './engine/MetronomeSynthBank';
import { applyInversionLock, shiftNotesByOctaves } from './engine/NoteTransforms';
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

const MAX_HUMANIZE_TIMING_S = 0.05;
const MAX_HUMANIZE_VELOCITY = 12;

export const createToneAudioEngine = (): AudioEngine => {
  let scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[] = [];
  let activePart: Tone.Part | null = null;
  let metronomeLoop: Tone.Loop | null = null;
  let metronomeClickBeat = 0;
  let activeMetronomePulseTimeouts: ReturnType<typeof setTimeout>[] = [];
  const metronomeSynthBank = createMetronomeSynthBank();
  const effectsChain = createEffectsChain();
  const samplerBank = createSamplerBank({
    connectSamplerToCurrentOutput: effectsChain.connectSamplerToCurrentOutput,
    ensureReverbReady: effectsChain.ensureReverbReady,
  });

  const {
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
  } = effectsChain;

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
