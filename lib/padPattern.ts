/**
 * Rhythmic trigger pattern applied when a pad is pressed.
 * 'single' preserves the existing one-shot behaviour.
 */
export type PadPattern =
  | 'single'
  | 'quarter-pulse'
  | 'eighth-pulse'
  | 'offbeat-stab'
  | 'syncopated-stab';

/**
 * Musical time signature used for bar-length calculations and metronome.
 */
export type TimeSignature = '4/4' | '3/4' | '6/8';

/**
 * A single rhythmic event inside a bar.
 * offsetBeats is measured in quarter-note beats from the bar start.
 */
export type PatternBeat = {
  offsetBeats: number;
  /** 0–1 multiplier applied to the pad velocity for this hit. */
  velocityScale: number;
};

/**
 * Returns the beat layout for a given pattern and time signature.
 */
export const getPadPatternBeats = (
  pattern: PadPattern,
  timeSignature: TimeSignature,
): PatternBeat[] => {
  if (pattern === 'single') {
    return [{ offsetBeats: 0, velocityScale: 1 }];
  }

  switch (timeSignature) {
    case '4/4': {
      switch (pattern) {
        case 'quarter-pulse':
          return [0, 1, 2, 3].map((b) => ({ offsetBeats: b, velocityScale: 1 }));
        case 'eighth-pulse':
          return [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => ({
            offsetBeats: b,
            velocityScale: b % 1 === 0 ? 1 : 0.72,
          }));
        case 'offbeat-stab':
          return [1, 3].map((b) => ({ offsetBeats: b, velocityScale: 1 }));
        case 'syncopated-stab':
          return [0, 1.5, 2, 3.5].map((b) => ({
            offsetBeats: b,
            velocityScale: b % 1 === 0 ? 1 : 0.82,
          }));
        default:
          return [{ offsetBeats: 0, velocityScale: 1 }];
      }
    }
    case '3/4': {
      switch (pattern) {
        case 'quarter-pulse':
          return [0, 1, 2].map((b) => ({ offsetBeats: b, velocityScale: 1 }));
        case 'eighth-pulse':
          return [0, 0.5, 1, 1.5, 2, 2.5].map((b) => ({
            offsetBeats: b,
            velocityScale: b % 1 === 0 ? 1 : 0.72,
          }));
        case 'offbeat-stab':
          return [1, 2].map((b) => ({ offsetBeats: b, velocityScale: 1 }));
        case 'syncopated-stab':
          return [0, 1.5, 2].map((b) => ({
            offsetBeats: b,
            velocityScale: b % 1 === 0 ? 1 : 0.82,
          }));
        default:
          return [{ offsetBeats: 0, velocityScale: 1 }];
      }
    }
    case '6/8': {
      // 6 eighth-note subdivisions; quarter-note beat = 0.5 of an eighth-note "slot"
      // Strong pulses every 3 eighth notes → offsetBeats 0 and 1.5
      switch (pattern) {
        case 'quarter-pulse':
          return [0, 1.5].map((b) => ({ offsetBeats: b, velocityScale: 1 }));
        case 'eighth-pulse':
          return [0, 0.5, 1, 1.5, 2, 2.5].map((b) => ({
            offsetBeats: b,
            velocityScale: b === 0 || b === 1.5 ? 1 : 0.72,
          }));
        case 'offbeat-stab':
          return [0.5, 1, 2, 2.5].map((b) => ({ offsetBeats: b, velocityScale: 0.9 }));
        case 'syncopated-stab':
          return [0, 1, 1.5, 2.5].map((b) => ({
            offsetBeats: b,
            velocityScale: b === 0 || b === 1.5 ? 1 : 0.82,
          }));
        default:
          return [{ offsetBeats: 0, velocityScale: 1 }];
      }
    }
    default:
      return [{ offsetBeats: 0, velocityScale: 1 }];
  }
};

/** Quarter-note beats per bar for each time signature. */
export const TIME_SIGNATURE_BEATS_PER_BAR: Record<TimeSignature, number> = {
  '4/4': 4,
  '3/4': 3,
  '6/8': 3,
};

/** Numerator value passed to Tone.Transport.timeSignature. */
export const TIME_SIGNATURE_NUMERATOR: Record<TimeSignature, number> = {
  '4/4': 4,
  '3/4': 3,
  '6/8': 6,
};

export const PAD_PATTERN_LABELS: Record<PadPattern, string> = {
  single: 'Single',
  'quarter-pulse': '1/4 Pulse',
  'eighth-pulse': '1/8 Pulse',
  'offbeat-stab': 'Offbeat',
  'syncopated-stab': 'Syncopated',
};

export const TIME_SIGNATURE_LABELS: Record<TimeSignature, string> = {
  '4/4': '4/4',
  '3/4': '3/4',
  '6/8': '6/8',
};
