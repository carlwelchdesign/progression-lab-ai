import { NOTE_NAME_TO_SEMITONE } from './musicNoteConstants';

const CHORD_ROOT_PATTERN = /^([A-G](?:#|b)?)/;

/**
 * Returns the pitch-class semitone (0–11) for the root of a chord symbol,
 * or null if the symbol cannot be parsed.
 */
export function getChordRootSemitone(chordSymbol: string): number | null {
  const match = chordSymbol.trim().match(CHORD_ROOT_PATTERN);
  if (!match) {
    return null;
  }

  const root = match[1];
  const semitone = NOTE_NAME_TO_SEMITONE[root];
  return semitone !== undefined ? semitone : null;
}

/**
 * Returns the set of pitch-class semitones (0–11) that are a perfect fourth
 * (+5 semitones, IV) or perfect fifth (+7 semitones, V) above the given root
 * on the Circle of Fifths.
 */
export function getCircleOfFifthsNeighborSemitones(rootSemitone: number): Set<number> {
  return new Set([(rootSemitone + 5) % 12, (rootSemitone + 7) % 12]);
}
