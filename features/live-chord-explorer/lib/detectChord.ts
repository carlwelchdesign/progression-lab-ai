import { SHARP_NOTE_NAMES } from '../../../domain/music/musicNoteConstants';
import { CHORD_TEMPLATES } from './chordTemplates';
import type { DetectedChord } from '../types';

type MatchScore = {
  root: number;
  suffix: string;
  quality: string;
  score: number;
};

function scorePitchClasses(pitchClasses: Set<number>, root: number, intervals: number[]): number {
  const templatePCs = new Set(intervals.map((i) => (root + i) % 12));
  let matched = 0;
  let unmatched = 0;

  for (const pc of templatePCs) {
    if (pitchClasses.has(pc)) {
      matched++;
    } else {
      unmatched++;
    }
  }

  // Penalize extra notes not in the template
  let extra = 0;
  for (const pc of pitchClasses) {
    if (!templatePCs.has(pc)) {
      extra++;
    }
  }

  // Perfect match: all template notes present, no extras
  if (matched === templatePCs.size && extra === 0) return 1000 + matched;

  // Partial credit: prefer more matched notes, fewer missing/extra
  return matched * 10 - unmatched * 5 - extra * 3;
}

/**
 * Detects the best chord name from a set of active pitch classes.
 * Returns null when fewer than 2 notes are active.
 */
export function detectChord(pitchClasses: number[], lowestMidiNote?: number): DetectedChord {
  if (pitchClasses.length < 2) return null;

  const pcSet = new Set(pitchClasses.map((pc) => ((pc % 12) + 12) % 12));
  const candidates: MatchScore[] = [];

  for (let root = 0; root < 12; root++) {
    for (const template of CHORD_TEMPLATES) {
      const score = scorePitchClasses(pcSet, root, template.intervals);
      if (score > 0) {
        candidates.push({ root, suffix: template.suffix, quality: template.quality, score });
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const rootName = SHARP_NOTE_NAMES[best.root];
  const chordName = `${rootName}${best.suffix}`;

  // Build alternates: next 3 unique chord names with high-enough scores
  const threshold = best.score * 0.6;
  const seen = new Set([chordName]);
  const alternates: string[] = [];
  for (let i = 1; i < candidates.length && alternates.length < 3; i++) {
    const c = candidates[i];
    if (c.score < threshold) break;
    const name = `${SHARP_NOTE_NAMES[c.root]}${c.suffix}`;
    if (!seen.has(name)) {
      seen.add(name);
      alternates.push(name);
    }
  }

  // Slash chord: if lowest note's pitch class differs from detected root, append bass
  let bassNote: string | undefined;
  if (lowestMidiNote !== undefined) {
    const bassPc = ((lowestMidiNote % 12) + 12) % 12;
    if (bassPc !== best.root) {
      bassNote = SHARP_NOTE_NAMES[bassPc];
    }
  }

  return {
    name: bassNote ? `${chordName}/${bassNote}` : chordName,
    root: rootName,
    quality: best.quality,
    pitchClasses: [...pcSet],
    alternateInterpretations: alternates,
    bassNote,
  };
}
