import type * as Tone from 'tone';
import type { PlaybackStyle } from '../audioEngine';
import type { SamplerInstrument } from './SamplerBank';
import { triggerChordByStyle } from './ChordTrigger';
import { computeEffectiveVelocity, computeScheduledStartTime } from './ChordEventComputationPolicy';

type ScheduledChordVelocityParams = {
  velocity?: number;
  velocityScale?: number;
  velocityJitter: number;
};

type TriggerScheduledChordEventParams = {
  style: PlaybackStyle;
  instrument: SamplerInstrument;
  notes: string[];
  duration: Tone.Unit.Time;
  eventTime: number;
  attack?: number;
  decay?: number;
  velocity?: number;
  velocityScale?: number;
  humanize: number;
  symmetricTiming: boolean;
  getTimingOffset: (params: { humanize: number; symmetric: boolean }) => number;
  getVelocityJitter: (humanize: number) => number;
  toEffectiveVelocity: (params: ScheduledChordVelocityParams) => number | undefined;
};

export const triggerScheduledChordEvent = ({
  style,
  instrument,
  notes,
  duration,
  eventTime,
  attack,
  decay,
  velocity,
  velocityScale,
  humanize,
  symmetricTiming,
  getTimingOffset,
  getVelocityJitter,
  toEffectiveVelocity,
}: TriggerScheduledChordEventParams): void => {
  if (notes.length === 0) {
    return;
  }

  const timingOffset = getTimingOffset({ humanize, symmetric: symmetricTiming });
  const effectiveVelocity = computeEffectiveVelocity({
    velocity,
    velocityScale,
    humanize,
    getVelocityJitter,
    toEffectiveVelocity,
  });

  const startTime = computeScheduledStartTime({
    eventTime,
    timingOffset,
    symmetricTiming,
  });

  triggerChordByStyle({
    style,
    instrument,
    notes,
    duration,
    startTime,
    attack,
    decay,
    velocity: effectiveVelocity,
  });
};
