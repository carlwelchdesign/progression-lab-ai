import type { PlayChordVoicingParams } from '../audioEngine';
import type { SamplerInstrument } from './SamplerBank';
import { applyInversionLock, shiftNotesByOctaves } from './NoteTransforms';

const MAX_HUMANIZE_TIMING_S = 0.05;
const MAX_HUMANIZE_VELOCITY = 12;

type ResolveInstrumentDeps = {
  ensureRhodesSamplerLoaded: () => Promise<SamplerInstrument>;
  ensurePianoSamplerLoaded: () => Promise<SamplerInstrument>;
};

type GetLockedNotesParams = {
  leftHand: string[];
  rightHand: string[];
  octaveShift: number;
  inversionRegister: PlayChordVoicingParams['inversionRegister'];
};

type GetTimingOffsetParams = {
  humanize: number;
  symmetric: boolean;
};

type ToEffectiveVelocityParams = {
  velocity?: number;
  velocityScale?: number;
  velocityJitter: number;
};

export type ProgressionPlaybackPolicies = {
  resolveInstrument: (
    instrument?: PlayChordVoicingParams['instrument'],
  ) => Promise<SamplerInstrument>;
  getLockedNotes: (params: GetLockedNotesParams) => string[];
  getTimingOffset: (params: GetTimingOffsetParams) => number;
  getVelocityJitter: (humanize: number) => number;
  toEffectiveVelocity: (params: ToEffectiveVelocityParams) => number | undefined;
};

export const createProgressionPlaybackPolicies = ({
  ensureRhodesSamplerLoaded,
  ensurePianoSamplerLoaded,
}: ResolveInstrumentDeps): ProgressionPlaybackPolicies => {
  const resolveInstrument = async (
    instrument: PlayChordVoicingParams['instrument'] = 'piano',
  ): Promise<SamplerInstrument> => {
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
  }: GetLockedNotesParams): string[] => {
    const shiftedLeftHand = shiftNotesByOctaves(leftHand, octaveShift);
    const shiftedRightHand = shiftNotesByOctaves(rightHand, octaveShift);

    return applyInversionLock([...shiftedLeftHand, ...shiftedRightHand], inversionRegister ?? 'off');
  };

  const getTimingOffset = ({ humanize, symmetric }: GetTimingOffsetParams): number => {
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
  }: ToEffectiveVelocityParams): number | undefined => {
    if (velocity === undefined) {
      return undefined;
    }

    return Math.round(Math.max(20, Math.min(127, velocity * velocityScale + velocityJitter)));
  };

  return {
    resolveInstrument,
    getLockedNotes,
    getTimingOffset,
    getVelocityJitter,
    toEffectiveVelocity,
  };
};
