import { SHARP_NOTE_NAMES, NOTE_NAME_TO_SEMITONE } from '../../../domain/music/musicNoteConstants';
import { MAJOR_SCALE_INTERVALS } from './chordTemplates';

// Natural minor scale intervals
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

// Diatonic pitch class sets for all 12 major and minor keys, computed once
const MAJOR_KEY_PCS: Set<number>[] = SHARP_NOTE_NAMES.map(
  (_, root) => new Set(MAJOR_SCALE_INTERVALS.map((i) => (root + i) % 12)),
);

const MINOR_KEY_PCS: Set<number>[] = SHARP_NOTE_NAMES.map(
  (_, root) => new Set(MINOR_SCALE_INTERVALS.map((i) => (root + i) % 12)),
);

const CHORD_ROOT_PATTERN = /^([A-G](?:#|b)?)/;

function getChordRootPitchClass(chord: string): number | null {
  const match = chord.match(CHORD_ROOT_PATTERN);
  if (!match) return null;
  const semitone = NOTE_NAME_TO_SEMITONE[match[1]];
  return semitone !== undefined ? semitone : null;
}

function isMinorChord(chord: string): boolean {
  return /^[A-G](?:#|b)?m(?!aj)/.test(chord);
}

export type KeyCenterResult = {
  key: string | null;
  mode: 'major' | 'minor' | null;
  confidence: number;
};

/**
 * Infers the most likely key center from a list of recent chord names.
 * Returns null when confidence is below threshold or history is too short.
 * Weights the first chord heavily as a likely tonic and the last chord lightly.
 */
export function inferKeyCenter(chordHistory: string[]): KeyCenterResult {
  if (chordHistory.length === 0) {
    return { key: null, mode: null, confidence: 0 };
  }

  const rootPCs = chordHistory
    .map(getChordRootPitchClass)
    .filter((pc): pc is number => pc !== null);

  if (rootPCs.length === 0) {
    return { key: null, mode: null, confidence: 0 };
  }

  const firstChord = chordHistory[0];
  const firstPC = getChordRootPitchClass(firstChord);
  const firstIsMinor = isMinorChord(firstChord);

  const lastChord = chordHistory[chordHistory.length - 1];
  const lastPC = getChordRootPitchClass(lastChord);
  const lastIsMinor = isMinorChord(lastChord);

  let bestScore = -1;
  let bestRoot = 0;
  let bestMode: 'major' | 'minor' = 'major';

  for (let root = 0; root < 12; root++) {
    const majorPCs = MAJOR_KEY_PCS[root];
    const minorPCs = MINOR_KEY_PCS[root];

    let majorScore = 0;
    let minorScore = 0;

    for (const pc of rootPCs) {
      if (majorPCs.has(pc)) majorScore++;
      if (minorPCs.has(pc)) minorScore++;
    }

    // First chord is a strong tonic signal — weight it +2
    if (firstPC === root) {
      if (!firstIsMinor) majorScore += 2;
      else minorScore += 2;
    }

    // Last chord gives a mild tonic signal — weight it +1
    if (lastPC === root && lastPC !== firstPC) {
      if (!lastIsMinor) majorScore += 1;
      else minorScore += 1;
    }

    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestRoot = root;
      bestMode = 'major';
    }
    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestRoot = root;
      bestMode = 'minor';
    }
  }

  const confidence = bestScore / (rootPCs.length + 2); // normalise including bonuses

  if (confidence < 0.6) {
    return { key: null, mode: null, confidence };
  }

  return { key: SHARP_NOTE_NAMES[bestRoot], mode: bestMode, confidence };
}
