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
  getPadPatternBeats,
  TIME_SIGNATURE_BEATS_PER_BAR,
  TIME_SIGNATURE_NUMERATOR,
} from '../../music/padPattern';
import type { TimeSignature } from '../../music/padPattern';
import { CHORD_BEATS, applyGate, getChordDurationSeconds, normalizeTempoBpm } from './AudioMath';
import { triggerChordByStyle } from './ChordTrigger';
import { applyInversionLock, shiftNotesByOctaves } from './NoteTransforms';

const MAX_HUMANIZE_TIMING_S = 0.05;
const MAX_HUMANIZE_VELOCITY = 12;

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

  const resolveInstrument = async (
    instrument: PlayChordVoicingParams['instrument'] = 'piano',
  ): Promise<Tone.Sampler> => {
    if (instrument === 'rhodes') {
      return ensureRhodesSamplerLoaded();
    }

    return ensurePianoSamplerLoaded();
  };

  const getLockedNotes = ({
    leftHand,
    rightHand,
    octaveShift,
    inversionRegister,
  }: {
    leftHand: string[];
    rightHand: string[];
    octaveShift: number;
    inversionRegister: PlayChordVoicingParams['inversionRegister'];
  }): string[] => {
    const shiftedLeftHand = shiftNotesByOctaves(leftHand, octaveShift);
    const shiftedRightHand = shiftNotesByOctaves(rightHand, octaveShift);

    return applyInversionLock([...shiftedLeftHand, ...shiftedRightHand], inversionRegister);
  };

  const getTimingOffset = ({
    humanize,
    symmetric,
  }: {
    humanize: number;
    symmetric: boolean;
  }): number => {
    if (humanize <= 0) {
      return 0;
    }

    const amount = humanize * MAX_HUMANIZE_TIMING_S;
    if (!symmetric) {
      return Math.random() * amount;
    }

    return (Math.random() * 2 - 1) * amount;
  };

  const getVelocityJitter = (humanize: number): number => {
    if (humanize <= 0) {
      return 0;
    }

    return (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_VELOCITY;
  };

  const toEffectiveVelocity = ({
    velocity,
    velocityScale = 1,
    velocityJitter,
  }: {
    velocity?: number;
    velocityScale?: number;
    velocityJitter: number;
  }): number | undefined => {
    if (velocity === undefined) {
      return undefined;
    }

    return Math.round(Math.max(20, Math.min(127, velocity * velocityScale + velocityJitter)));
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
    const beatsPerBar = TIME_SIGNATURE_BEATS_PER_BAR[timeSignature];
    const barDurationSeconds = beatsPerBar * singleBeatSeconds;

    const lockedNotes = getLockedNotes({ leftHand, rightHand, octaveShift, inversionRegister });

    if (lockedNotes.length === 0) {
      return;
    }

    const patternBeats = getPadPatternBeats(padPattern, timeSignature);
    const events = patternBeats.map((beat) => ({
      time: beat.offsetBeats * singleBeatSeconds,
      velocityScale: beat.velocityScale,
    }));

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
      const currentTimeouts = timeoutState.getScheduledPlaybackTimeouts();
      timeoutState.setScheduledPlaybackTimeouts([...currentTimeouts, cleanupTimeout]);
    }

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
