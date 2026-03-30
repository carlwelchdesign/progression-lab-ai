import type { TimeSignature } from '../../music/padPattern';

const DEFAULT_TEMPO_BPM = 100;
const MIN_TEMPO_BPM = 40;
const MAX_TEMPO_BPM = 240;
export const CHORD_BEATS = 2;

export const clampUnitValue = (value: number): number => Math.min(1, Math.max(0, value));

export const normalizeTempoBpm = (tempoBpm?: number): number => {
  if (!Number.isFinite(tempoBpm)) {
    return DEFAULT_TEMPO_BPM;
  }

  return Math.min(
    MAX_TEMPO_BPM,
    Math.max(MIN_TEMPO_BPM, Math.round(tempoBpm ?? DEFAULT_TEMPO_BPM)),
  );
};

export const getBeatDurationSeconds = (tempoBpm: number): number =>
  60 / normalizeTempoBpm(tempoBpm);

export const getChordDurationSeconds = (tempoBpm?: number): number => {
  const normalizedTempo = normalizeTempoBpm(tempoBpm);
  return (60 / normalizedTempo) * CHORD_BEATS;
};

export const normalizeVelocity = (velocity?: number): number | undefined => {
  if (!Number.isFinite(velocity)) {
    return undefined;
  }

  return Math.min(1, Math.max(0.1, (velocity ?? 96) / 127));
};

export const applyGate = (chordDurationSeconds: number, gate: number): number =>
  chordDurationSeconds * (0.1 + gate * 0.85);

export const inferFallbackDrumDurationBeats = (timeSignature: TimeSignature): number => {
  if (timeSignature === '6/8') {
    return 6;
  }
  if (timeSignature === '3/4') {
    return 3;
  }
  return 4;
};
