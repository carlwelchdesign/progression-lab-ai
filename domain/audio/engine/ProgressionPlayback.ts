import * as Tone from 'tone';
import type {
  MetronomeSource,
  PlayChordVoicingParams,
  PlayChordPatternParams,
  PlayProgressionOptions,
  PlaybackStyle,
  ProgressionVoicing,
} from '../audioEngine';
import {
  TIME_SIGNATURE_NUMERATOR,
} from '../../music/padPattern';
import type { TimeSignature } from '../../music/padPattern';
import { applyGate, getChordDurationSeconds, normalizeTempoBpm } from './AudioMath';
import { createProgressionPlaybackPolicies } from './ProgressionPlaybackPolicies';
import {
  buildChordPatternScheduledEvents,
  buildProgressionScheduledEvents,
  getBarDurationSeconds,
} from './ProgressionSchedulingPolicy';
import { applyChordPatternLifecyclePolicy } from './ChordPatternLifecyclePolicy';
import { triggerChordByStyle } from './ChordTrigger';

interface ProgressionPlaybackDeps {
  startAudio: () => Promise<void>;
  stopAllAudio: () => void;
  ensureRhodesSamplerLoaded: () => Promise<Tone.Sampler>;
  ensurePianoSamplerLoaded: () => Promise<Tone.Sampler>;
  startMetronomeLoop: (
    tempoBpm: number,
    timeSignature: TimeSignature,
    volume: number,
    totalDurationSeconds: number,
    source: MetronomeSource,
    drumPath: string | null,
  ) => void;
  partState: {
    getActivePart: () => Tone.Part | null;
    setActivePart: (part: Tone.Part | null) => void;
  };
  timeoutState: {
    getScheduledPlaybackTimeouts: () => ReturnType<typeof setTimeout>[];
    setScheduledPlaybackTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  };
}

interface ProgressionPlayback {
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

export const createProgressionPlayback = (deps: ProgressionPlaybackDeps): ProgressionPlayback => {
  const {
    startAudio,
    stopAllAudio,
    ensureRhodesSamplerLoaded,
    ensurePianoSamplerLoaded,
    startMetronomeLoop,
    partState,
    timeoutState,
  } = deps;

  const {
    resolveInstrument,
    getLockedNotes,
    getTimingOffset,
    getVelocityJitter,
    toEffectiveVelocity,
  } = createProgressionPlaybackPolicies({ ensureRhodesSamplerLoaded, ensurePianoSamplerLoaded });

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

    const audioInstrument = await resolveInstrument(instrument);

    const chordDurSeconds = getChordDurationSeconds(tempoBpm);
    const noteDuration =
      gate !== 1 ? applyGate(chordDurSeconds, gate) : (duration ?? chordDurSeconds);

    const lockedNotes = getLockedNotes({ leftHand, rightHand, octaveShift, inversionRegister });

    if (lockedNotes.length > 0) {
      const timingDelay = getTimingOffset({ humanize, symmetric: false });
      const effectiveVelocity = toEffectiveVelocity({
        velocity,
        velocityJitter: getVelocityJitter(humanize),
      });

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

    const audioInstrument = await resolveInstrument(instrument);

    const normalizedTempo = normalizeTempoBpm(tempoBpm);
    Tone.Transport.bpm.value = normalizedTempo;
    Tone.Transport.timeSignature = TIME_SIGNATURE_NUMERATOR[timeSignature];

    const singleBeatSeconds = 60 / normalizedTempo;
    const chordDurationSeconds = getChordDurationSeconds(normalizedTempo);
    const noteDuration = applyGate(chordDurationSeconds, gate);
    const totalDurationSeconds = voicings.length * chordDurationSeconds;

    const events = buildProgressionScheduledEvents({
      voicings,
      padPattern,
      timeSignature,
      singleBeatSeconds,
      chordDurationSeconds,
    });

    const part = new Tone.Part<{
      time: number;
      voicing: ProgressionVoicing;
      velocityScale: number;
    }>((time, event) => {
      const { voicing, velocityScale } = event;
      const lockedNotes = getLockedNotes({
        leftHand: voicing.leftHand,
        rightHand: voicing.rightHand,
        octaveShift,
        inversionRegister,
      });

      if (lockedNotes.length > 0) {
        const timingJitter = getTimingOffset({ humanize, symmetric: true });
        const effectiveVelocity = toEffectiveVelocity({
          velocity,
          velocityScale,
          velocityJitter: getVelocityJitter(humanize),
        });

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

    partState.setActivePart(part);
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

    const audioInstrument = await resolveInstrument(instrument);

    const normalizedTempo = normalizeTempoBpm(tempoBpm);
    Tone.Transport.bpm.value = normalizedTempo;
    Tone.Transport.timeSignature = TIME_SIGNATURE_NUMERATOR[timeSignature];

    const singleBeatSeconds = 60 / normalizedTempo;
    const chordDurSeconds = getChordDurationSeconds(normalizedTempo);
    const noteDuration = gate !== 1 ? applyGate(chordDurSeconds, gate) : chordDurSeconds;
    const barDurationSeconds = getBarDurationSeconds(timeSignature, singleBeatSeconds);

    const lockedNotes = getLockedNotes({ leftHand, rightHand, octaveShift, inversionRegister });

    if (lockedNotes.length === 0) {
      return;
    }

    const events = buildChordPatternScheduledEvents({
      padPattern,
      timeSignature,
      singleBeatSeconds,
    });

    const part = new Tone.Part<{ time: number; velocityScale: number }>((time, event) => {
      const timingDelay = getTimingOffset({ humanize, symmetric: false });
      const scaledVelocity = toEffectiveVelocity({
        velocity,
        velocityScale: event.velocityScale,
        velocityJitter: getVelocityJitter(humanize),
      });

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

    applyChordPatternLifecyclePolicy({
      loop,
      part,
      barDurationSeconds,
      scheduleCleanup: (cleanupDelayMs) => {
        const cleanupTimeout = setTimeout(() => {
          stopAllAudio();
        }, cleanupDelayMs);

        const currentTimeouts = timeoutState.getScheduledPlaybackTimeouts();
        timeoutState.setScheduledPlaybackTimeouts([...currentTimeouts, cleanupTimeout]);
      },
    });

    partState.setActivePart(part);
    part.start(0);
    Tone.Transport.start();
  };

  return {
    playChordVoicing,
    playProgression,
    playChordPattern,
  };
};
