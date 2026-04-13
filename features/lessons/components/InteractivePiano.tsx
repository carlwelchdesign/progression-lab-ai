'use client';

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';

// ── Enharmonic normalization ───────────────────────────────────────────────────

const ENHARMONIC: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
};

/** "Bb3" → "A#", "C#4" → "C#", "F5" → "F" */
export function pitchClass(note: string): string {
  const m = /^([A-G][b#]?)(\d*)$/.exec(note.trim());
  if (!m) return note;
  const pitch = m[1];
  return ENHARMONIC[pitch] ?? pitch;
}

function noteOctave(note: string): number {
  const m = /(\d+)$/.exec(note);
  return m ? parseInt(m[1], 10) : 4;
}

// ── Key layout ────────────────────────────────────────────────────────────────

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
type ChromaticNote = (typeof CHROMATIC)[number];

// White keys: semitone indices within an octave
const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B

// Black keys: semitone index + which white key they sit to the right of
const BLACK_KEY_DEFS = [
  { semitone: 1, wOff: 0 }, // C#  (right of C, white idx 0)
  { semitone: 3, wOff: 1 }, // D#  (right of D, white idx 1)
  { semitone: 6, wOff: 3 }, // F#  (right of F, white idx 3)
  { semitone: 8, wOff: 4 }, // G#  (right of G, white idx 4)
  { semitone: 10, wOff: 5 }, // A#  (right of A, white idx 5)
] as const;

// SVG units
const WW = 14; // white key width
const WH = 80; // white key height
const BW = 9; // black key width
const BH = 51; // black key height

type PianoKey = {
  noteName: ChromaticNote;
  octave: number;
  x: number;
  width: number;
  height: number;
  isBlack: boolean;
};

function buildKeys(startOctave: number, endOctave: number): { keys: PianoKey[]; viewW: number } {
  const white: PianoKey[] = [];
  const black: PianoKey[] = [];
  let wIdx = 0; // running white-key counter

  for (let oct = startOctave; oct <= endOctave; oct++) {
    const isLast = oct === endOctave;
    const octWStart = wIdx; // white key index at the start of this octave

    for (const semitone of WHITE_SEMITONES) {
      if (isLast && semitone !== 0) continue; // last "octave" shows only C
      white.push({
        noteName: CHROMATIC[semitone] as ChromaticNote,
        octave: oct,
        x: wIdx * WW,
        width: WW,
        height: WH,
        isBlack: false,
      });
      wIdx++;
    }

    if (!isLast) {
      for (const { semitone, wOff } of BLACK_KEY_DEFS) {
        black.push({
          noteName: CHROMATIC[semitone] as ChromaticNote,
          octave: oct,
          x: (octWStart + wOff) * WW + WW * 0.65,
          width: BW,
          height: BH,
          isBlack: true,
        });
      }
    }
  }

  // White keys rendered first (bottom layer), black keys on top
  return { keys: [...white, ...black], viewW: wIdx * WW };
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  /** All notes the user should press — highlighted in red until played */
  targetNotes: string[];
  /** Notes currently held via MIDI — highlighted in primary or green if correct */
  pressedNotes: Set<string>;
  startOctave?: number;
  endOctave?: number;
};

/**
 * Custom SVG piano keyboard with full colored key fills:
 * - Red   = target key (play this)
 * - Green = target key correctly pressed
 * - Blue  = key pressed but not a target
 * - White/dark = default
 *
 * When startOctave/endOctave are omitted the range is auto-computed
 * from targetNotes ± 1 octave for a focused view.
 */
export default function InteractivePiano({
  targetNotes,
  pressedNotes,
  startOctave: spProp,
  endOctave: epProp,
}: Props) {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  // Auto-compute range from target notes when not explicitly provided
  const { startOctave, endOctave } = useMemo(() => {
    if (spProp !== undefined && epProp !== undefined) {
      return { startOctave: spProp, endOctave: epProp };
    }
    if (targetNotes.length === 0) return { startOctave: 3, endOctave: 5 };
    const octaves = targetNotes.map(noteOctave);
    return {
      startOctave: Math.max(1, Math.min(...octaves) - 1),
      endOctave: Math.min(7, Math.max(...octaves) + 1),
    };
  }, [spProp, epProp, targetNotes]);

  const targetSet = useMemo(() => new Set(targetNotes.map(pitchClass)), [targetNotes]);

  const pressedSet = useMemo(() => new Set([...pressedNotes].map(pitchClass)), [pressedNotes]);

  const { keys, viewW } = useMemo(
    () => buildKeys(startOctave, endOctave),
    [startOctave, endOctave],
  );

  const getColor = (key: PianoKey): string => {
    const pc = key.noteName;
    const t = targetSet.has(pc);
    const p = pressedSet.has(pc);
    if (t && p) return '#4ADE80'; // correct!
    if (t) return '#FF7070'; // play me
    if (p) return primaryColor; // wrong key
    return key.isBlack ? '#1E1818' : '#EDE9E0';
  };

  const getStroke = (key: PianoKey): string => {
    const pc = key.noteName;
    if (targetSet.has(pc) || pressedSet.has(pc)) return 'rgba(0,0,0,0.2)';
    return key.isBlack ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.13)';
  };

  return (
    <svg
      viewBox={`0 0 ${viewW} ${WH}`}
      width="100%"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {keys.map((key) => (
        <rect
          key={`${key.noteName}${key.octave}`}
          x={key.x + (key.isBlack ? 0 : 0.5)}
          y={0.5}
          width={key.width - (key.isBlack ? 0 : 1)}
          height={key.height - 1}
          rx={key.isBlack ? 2 : 3}
          ry={key.isBlack ? 2 : 3}
          fill={getColor(key)}
          stroke={getStroke(key)}
          strokeWidth={0.75}
        />
      ))}
    </svg>
  );
}
