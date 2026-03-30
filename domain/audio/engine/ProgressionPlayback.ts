import * as Tone from 'tone';
import type {
  MetronomeSource,
  PlayChordVoicingParams,
  PlayChordPatternParams,
  PlayProgressionOptions,
  PlaybackStyle,
  ProgressionVoicing,
} from '../audioEngine';
import type { TimeSignature } from '../../music/padPattern';
import { applyGate, getChordDurationSeconds } from './AudioMath';
import { createProgressionPlaybackPolicies } from './ProgressionPlaybackPolicies';
import {
  buildChordPatternScheduledEvents,
  buildProgressionScheduledEvents,
  getBarDurationSeconds,
} from './ProgressionSchedulingPolicy';
import { applyChordPatternLifecyclePolicy } from './ChordPatternLifecyclePolicy';
import { startPartPlayback } from './PartTransportPolicy';
import { buildTransportTiming, type TransportTiming } from './TransportTimingPolicy';
import { beginPlaybackSession } from './PlaybackSessionPolicy';
import { schedulePlaybackCleanupTimeout } from './PlaybackCleanupTimeoutPolicy';
import { triggerScheduledChordEvent } from './ScheduledChordEventPolicy';
import { triggerOneShotChordEvent } from './OneShotChordEventPolicy';

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
  transportControl: {
    applyTiming: (timing: TransportTiming) => void;
    start: () => void;
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
    transportControl,
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
    await beginPlaybackSession({ startAudio, stopAllAudio });

    const audioInstrument = await resolveInstrument(instrument);

    const chordDurSeconds = getChordDurationSeconds(tempoBpm);
    const noteDuration =
      gate !== 1 ? applyGate(chordDurSeconds, gate) : (duration ?? chordDurSeconds);

    const lockedNotes = getLockedNotes({ leftHand, rightHand, octaveShift, inversionRegister });

    triggerOneShotChordEvent({
      style: playbackStyle,
      instrument: audioInstrument,
      notes: lockedNotes,
      duration: noteDuration,
      attack,
      decay,
      velocity,
      humanize,
      getTimingOffset,
      getVelocityJitter,
      toEffectiveVelocity,
    });
  };

  const playProgression = async (
    voicings: ProgressionVoicing[],
    tempoBpm?: number,
    playbackStyle: PlaybackStyle = 'strum',
    attack?: number,
    decay?: number,
    opts?: PlayProgressionOptions,
  ): Promise<void> => {
    await beginPlaybackSession({ startAudio, stopAllAudio });

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

    const { normalizedTempo, transportTimeSignature, singleBeatSeconds } = buildTransportTiming({
      tempoBpm,
      timeSignature,
    });
    transportControl.applyTiming({
      normalizedTempo,
      transportTimeSignature,
      singleBeatSeconds,
    });
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

      triggerScheduledChordEvent({
        style: playbackStyle,
        instrument: audioInstrument,
        notes: lockedNotes,
        duration: noteDuration,
        eventTime: time,
        attack,
        decay,
        velocity,
        velocityScale,
        humanize,
        symmetricTiming: true,
        getTimingOffset,
        getVelocityJitter,
        toEffectiveVelocity,
      });
    }, events);

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

    startPartPlayback({
      part,
      setActivePart: partState.setActivePart,
      startPart: (nextPart) => nextPart.start(0),
      startTransport: transportControl.start,
    });
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

    await beginPlaybackSession({ startAudio, stopAllAudio });

    const audioInstrument = await resolveInstrument(instrument);

    const { normalizedTempo, transportTimeSignature, singleBeatSeconds } = buildTransportTiming({
      tempoBpm,
      timeSignature,
    });
    transportControl.applyTiming({
      normalizedTempo,
      transportTimeSignature,
      singleBeatSeconds,
    });
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
      triggerScheduledChordEvent({
        style: playbackStyle,
        instrument: audioInstrument,
        notes: lockedNotes,
        duration: noteDuration,
        eventTime: time,
        attack,
        decay,
        velocity,
        velocityScale: event.velocityScale,
        humanize,
        symmetricTiming: false,
        getTimingOffset,
        getVelocityJitter,
        toEffectiveVelocity,
      });
    }, events);

    applyChordPatternLifecyclePolicy({
      loop,
      part,
      barDurationSeconds,
      scheduleCleanup: (cleanupDelayMs) => {
        schedulePlaybackCleanupTimeout({
          cleanupDelayMs,
          stopAllAudio,
          getScheduledPlaybackTimeouts: timeoutState.getScheduledPlaybackTimeouts,
          setScheduledPlaybackTimeouts: timeoutState.setScheduledPlaybackTimeouts,
        });
      },
    });

    startPartPlayback({
      part,
      setActivePart: partState.setActivePart,
      startPart: (nextPart) => nextPart.start(0),
      startTransport: transportControl.start,
    });
  };

  return {
    playChordVoicing,
    playProgression,
    playChordPattern,
  };
};
