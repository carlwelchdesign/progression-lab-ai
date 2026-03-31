import { TIME_SIGNATURE_NUMERATOR } from '../../music/padPattern';
import type { TimeSignature } from '../../music/padPattern';
import { normalizeTempoBpm } from './AudioMath';

type BuildTransportTimingParams = {
  tempoBpm?: number;
  timeSignature: TimeSignature;
};

export type TransportTiming = {
  normalizedTempo: number;
  transportTimeSignature: number;
  singleBeatSeconds: number;
};

type TransportLike = {
  bpm: {
    value: number;
  };
  timeSignature: number | number[];
};

export const buildTransportTiming = ({
  tempoBpm,
  timeSignature,
}: BuildTransportTimingParams): TransportTiming => {
  const normalizedTempo = normalizeTempoBpm(tempoBpm);
  return {
    normalizedTempo,
    transportTimeSignature: TIME_SIGNATURE_NUMERATOR[timeSignature],
    singleBeatSeconds: 60 / normalizedTempo,
  };
};

export const applyTransportTiming = (
  transport: TransportLike,
  timing: TransportTiming,
): void => {
  transport.bpm.value = timing.normalizedTempo;
  transport.timeSignature = timing.transportTimeSignature;
};
