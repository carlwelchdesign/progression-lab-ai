/**
 * Static guitar shape metadata used as first-choice diagram presets.
 */
export type GuitarShape = {
  chord: string;
  frets: Array<number | 'x'>;
  baseFret?: number;
};

/**
 * Static piano pitch-class spellings for common chords.
 */
export type PianoShape = {
  chord: string;
  notes: string[];
};

/**
 * Preferred built-in guitar shapes keyed by chord symbol.
 */
export const GUITAR_SHAPES: Record<string, GuitarShape> = {
  Fmaj7: { chord: 'Fmaj7', frets: [1, 3, 3, 2, 1, 0], baseFret: 1 },
  'F#m7': { chord: 'F#m7', frets: [2, 4, 2, 2, 2, 2], baseFret: 1 },
  Gmaj7: { chord: 'Gmaj7', frets: [3, 2, 0, 0, 0, 2], baseFret: 1 },
  Em7: { chord: 'Em7', frets: [0, 2, 2, 0, 3, 0], baseFret: 1 },
  Am7: { chord: 'Am7', frets: ['x', 0, 2, 0, 1, 0], baseFret: 1 },
  Cmaj7: { chord: 'Cmaj7', frets: ['x', 3, 2, 0, 0, 0], baseFret: 1 },
  Dm7: { chord: 'Dm7', frets: ['x', 'x', 0, 2, 1, 1], baseFret: 1 },
};

/**
 * Preferred built-in piano note spellings keyed by chord symbol.
 */
export const PIANO_SHAPES: Record<string, PianoShape> = {
  Fmaj7: { chord: 'Fmaj7', notes: ['F', 'A', 'C', 'E'] },
  'F#m7': { chord: 'F#m7', notes: ['F#', 'A', 'C#', 'E'] },
  Gmaj7: { chord: 'Gmaj7', notes: ['G', 'B', 'D', 'F#'] },
  Em7: { chord: 'Em7', notes: ['E', 'G', 'B', 'D'] },
  Am7: { chord: 'Am7', notes: ['A', 'C', 'E', 'G'] },
  Cmaj7: { chord: 'Cmaj7', notes: ['C', 'E', 'G', 'B'] },
  Dm7: { chord: 'Dm7', notes: ['D', 'F', 'A', 'C'] },
};
