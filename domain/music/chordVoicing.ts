import type { PianoVoicing } from '../../lib/types';
import { NOTE_NAME_TO_SEMITONE, SHARP_NOTE_NAMES } from './musicNoteConstants';

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
  return SHARP_NOTE_NAMES[((semitone % 12) + 12) % 12];
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
  const rootSemitone = NOTE_NAME_TO_SEMITONE[root];

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
