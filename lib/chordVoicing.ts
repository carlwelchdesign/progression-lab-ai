import type { PianoVoicing } from './types';

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'E#': 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_PATTERN = /^([A-G](?:#|b)?)(.*)$/;

/**
 * Returns semitone intervals for common chord suffixes.
 */
function getIntervalsFromSuffix(rawSuffix: string): number[] {
  const suffix = rawSuffix.trim();

  if (/^maj9$/i.test(suffix)) return [0, 4, 7, 11, 14];
  if (/^maj7$/i.test(suffix)) return [0, 4, 7, 11];
  if (/^(?:m(?!aj)|min)7$/i.test(suffix)) return [0, 3, 7, 10];
  if (/^7$/i.test(suffix)) return [0, 4, 7, 10];
  if (/^(?:m(?!aj)|min)$/i.test(suffix)) return [0, 3, 7];
  if (/^(?:dim|o|°)$/i.test(suffix)) return [0, 3, 6];
  if (/^(?:aug|\+)$/i.test(suffix)) return [0, 4, 8];
  if (/^sus2$/i.test(suffix)) return [0, 2, 7];
  if (/^sus4$/i.test(suffix)) return [0, 5, 7];
  if (/^add9$/i.test(suffix)) return [0, 4, 7, 14];

  return [0, 4, 7];
}

/**
 * Converts a semitone value to a normalized sharp note name.
 */
function semitoneToNoteName(semitone: number): string {
  return SHARP_NOTES[((semitone % 12) + 12) % 12];
}

function intervalToNote(rootSemitone: number, interval: number, octave: number): string {
  const absolute = rootSemitone + interval;
  const noteName = semitoneToNoteName(absolute);
  const noteOctave = octave + Math.floor(absolute / 12);
  return `${noteName}${noteOctave}`;
}

/**
 * Generates a practical LH/RH piano voicing from a chord symbol.
 */
export function createPianoVoicingFromChordSymbol(chordSymbol: string): PianoVoicing | null {
  const match = chordSymbol.trim().match(CHORD_PATTERN);
  if (!match) {
    return null;
  }

  const root = match[1];
  const suffix = match[2] ?? '';
  const rootSemitone = NOTE_TO_SEMITONE[root];

  if (rootSemitone === undefined) {
    return null;
  }

  const intervals = getIntervalsFromSuffix(suffix);
  const rightHandIntervals = intervals.slice(0, 4);
  const leftHandIntervals = intervals.includes(7) ? [0, 7] : [0, 12];

  return {
    leftHand: leftHandIntervals.map((interval) => intervalToNote(rootSemitone, interval, 2)),
    rightHand: rightHandIntervals.map((interval) => intervalToNote(rootSemitone, interval, 4)),
  };
}
