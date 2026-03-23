import { GUITAR_SHAPES } from './chordShapes';
import type { ChordSuggestionResponse } from './types';

const NOTE_TO_FRET_ON_LOW_E: Record<string, number> = {
  E: 0,
  F: 1,
  'F#': 2,
  Gb: 2,
  G: 3,
  'G#': 4,
  Ab: 4,
  A: 5,
  'A#': 6,
  Bb: 6,
  B: 7,
  C: 8,
  'C#': 9,
  Db: 9,
  D: 10,
  'D#': 11,
  Eb: 11,
};

const NOTE_TO_FRET_ON_A: Record<string, number> = {
  A: 0,
  'A#': 1,
  Bb: 1,
  B: 2,
  C: 3,
  'C#': 4,
  Db: 4,
  D: 5,
  'D#': 6,
  Eb: 6,
  E: 7,
  F: 8,
  'F#': 9,
  Gb: 9,
  G: 10,
  'G#': 11,
  Ab: 11,
};

type GuitarShapeTemplateKey = 'major' | 'minor' | 'dominant7' | 'major7' | 'minor7' | 'sus4';
type RootString = 'lowE' | 'A';

const GUITAR_SHAPE_TEMPLATES: Record<
  RootString,
  Record<GuitarShapeTemplateKey, Array<number | 'x'>>
> = {
  lowE: {
    major: [0, 2, 2, 1, 0, 0],
    minor: [0, 2, 2, 0, 0, 0],
    dominant7: [0, 2, 0, 1, 0, 0],
    major7: [0, 2, 1, 1, 0, 0],
    minor7: [0, 2, 0, 0, 0, 0],
    sus4: [0, 2, 2, 2, 0, 0],
  },
  A: {
    major: ['x', 0, 2, 2, 2, 0],
    minor: ['x', 0, 2, 2, 1, 0],
    dominant7: ['x', 0, 2, 0, 2, 0],
    major7: ['x', 0, 2, 1, 2, 0],
    minor7: ['x', 0, 2, 0, 1, 0],
    sus4: ['x', 0, 2, 2, 3, 0],
  },
};

/**
 * Chooses low-E vs A-string root template based on target fret comfort.
 */
function getBestRootString(lowEFret: number, aFret: number): RootString {
  if (aFret <= 7 && lowEFret > 5) {
    return 'A';
  }

  return 'lowE';
}

/**
 * Maps chord quality text to an available guitar shape template.
 */
function getTemplateFromSuffix(suffix: string): GuitarShapeTemplateKey | null {
  const normalized = suffix.trim().toLowerCase();

  if (normalized.length === 0) {
    return 'major';
  }

  if (normalized.includes('sus4')) {
    return 'sus4';
  }

  if (normalized.includes('maj7')) {
    return 'major7';
  }

  if (normalized.startsWith('m7') || normalized.startsWith('min7')) {
    return 'minor7';
  }

  if (normalized.startsWith('m') || normalized.startsWith('min')) {
    return 'minor';
  }

  if (normalized.includes('7')) {
    return 'dominant7';
  }

  if (normalized.includes('add9') || normalized.includes('sus2')) {
    return 'major';
  }

  return null;
}

/**
 * Builds a generated chord diagram when no explicit preset shape exists.
 */
function getGeneratedGuitarDiagram(chord: string) {
  const parsed = chord.trim().match(/^([A-G](?:#|b)?)(.*)$/);

  if (!parsed) {
    return null;
  }

  const [, root, suffix] = parsed;
  const lowEFret = NOTE_TO_FRET_ON_LOW_E[root];
  const aFret = NOTE_TO_FRET_ON_A[root];
  const templateKey = getTemplateFromSuffix(suffix);

  if (lowEFret === undefined || aFret === undefined || !templateKey) {
    return null;
  }

  const rootString = getBestRootString(lowEFret, aFret);
  const rootFret = rootString === 'A' ? aFret : lowEFret;
  const template = GUITAR_SHAPE_TEMPLATES[rootString][templateKey];

  return {
    title: chord,
    position: rootFret + 1,
    fingers: template.map(
      (offset, index) =>
        [6 - index, offset === 'x' ? 'x' : rootFret + offset] as [number, number | 'x'],
    ),
  };
}

/**
 * Returns a playable guitar diagram for a chord, using preset or generated fallback.
 */
export function getGuitarDiagramFromChord(chord: string) {
  const shape = GUITAR_SHAPES[chord];

  if (!shape) {
    return getGeneratedGuitarDiagram(chord);
  }

  return {
    title: shape.chord,
    fingers: shape.frets.map((fret, index) => [6 - index, fret] as [number, number | 'x']),
    position: shape.baseFret ?? 1,
  };
}

/**
 * Converts API guitar voicing payload to compact six-string text (e.g., x32010).
 */
export function getGuitarShapeTextFromVoicing(
  voicing: ChordSuggestionResponse['nextChordSuggestions'][number]['guitarVoicing'],
): string {
  if (!voicing) {
    return 'xxxxxx';
  }

  const byString = new Map<number, number | 'x'>();

  voicing.fingers.forEach((finger) => {
    byString.set(finger.string, finger.fret);
  });

  return [6, 5, 4, 3, 2, 1]
    .map((stringNumber) => {
      const fret = byString.get(stringNumber);

      if (fret === undefined) {
        return 'x';
      }

      return typeof fret === 'number' ? String(fret) : fret;
    })
    .join('');
}

/**
 * Converts internal diagram format to compact six-string text.
 */
export function getGuitarShapeTextFromDiagram(
  diagram: ReturnType<typeof getGuitarDiagramFromChord>,
): string {
  if (!diagram) {
    return 'xxxxxx';
  }

  const byString = new Map<number, number | 'x'>();

  diagram.fingers.forEach(([stringNumber, fret]) => {
    byString.set(stringNumber, fret);
  });

  return [6, 5, 4, 3, 2, 1]
    .map((stringNumber) => {
      const fret = byString.get(stringNumber);

      if (fret === undefined) {
        return 'x';
      }

      return typeof fret === 'number' ? String(fret) : fret;
    })
    .join('');
}
