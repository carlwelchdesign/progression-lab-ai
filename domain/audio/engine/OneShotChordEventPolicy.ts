import type * as Tone from 'tone';
import type { PlaybackStyle } from '../audioEngine';
import { triggerChordByStyle } from './ChordTrigger';
import { computeEffectiveVelocity, computeOneShotStartTime } from './ChordEventComputationPolicy';

type OneShotChordVelocityParams = {
  velocity?: number;
  velocityJitter: number;
};

type TriggerOneShotChordEventParams = {
  style: PlaybackStyle;
  instrument: Tone.Sampler;
  notes: string[];
  duration: Tone.Unit.Time;
  attack?: number;
  decay?: number;
  velocity?: number;
  humanize: number;
  getTimingOffset: (params: { humanize: number; symmetric: boolean }) => number;
  getVelocityJitter: (humanize: number) => number;
  toEffectiveVelocity: (params: OneShotChordVelocityParams) => number | undefined;
};

export const triggerOneShotChordEvent = ({
  style,
  instrument,
  notes,
  duration,
  attack,
  decay,
  velocity,
  humanize,
  getTimingOffset,
  getVelocityJitter,
  toEffectiveVelocity,
}: TriggerOneShotChordEventParams): void => {
  if (notes.length === 0) {
    return;
  }

  const timingDelay = getTimingOffset({ humanize, symmetric: false });
  const effectiveVelocity = computeEffectiveVelocity({
    velocity,
    humanize,
    getVelocityJitter,
    toEffectiveVelocity,
  });

  triggerChordByStyle({
    style,
    instrument,
    notes,
    duration,
    startTime: computeOneShotStartTime(timingDelay),
    attack,
    decay,
    velocity: effectiveVelocity,
  });
};
