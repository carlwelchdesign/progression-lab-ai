'use client';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef } from 'react';
import { Instrument } from 'piano-chart';

// ── Enharmonic normalization ──────────────────────────────────────────────────
//
// piano-chart uses sharp notation; chord voicings may return flats.
// Normalize both target and pressed notes before comparing.

const ENHARMONIC: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
};

export function normalizeNote(note: string): string {
  // note is e.g. "Bb3", "C#4", "F5"
  const match = /^([A-G][b#]?)(\d+)$/.exec(note);
  if (!match) return note;
  const [, pitch, octave] = match;
  const sharp = ENHARMONIC[pitch] ?? pitch;
  return `${sharp}${octave}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  /** Notes to highlight as "target" — shown in a muted accent color */
  targetNotes: string[];
  /** Live MIDI input notes — shown as active keypresses */
  pressedNotes: Set<string>;
  startOctave?: number;
  endOctave?: number;
};

export default function MidiInteractivePiano({
  targetNotes,
  pressedNotes,
  startOctave = 3,
  endOctave = 6,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  // Normalize target notes so flat names are matched correctly
  const normalizedTargets = useMemo(() => targetNotes.map(normalizeNote), [targetNotes]);

  // Stable dep string for the Set (Sets don't trigger useEffect by reference)
  const pressedSignature = useMemo(
    () => [...pressedNotes].map(normalizeNote).sort().join('|'),
    [pressedNotes],
  );
  const targetSignature = useMemo(() => normalizedTargets.join('|'), [normalizedTargets]);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = '';

    const piano = new Instrument(ref.current, {
      startOctave,
      endOctave,
      showNoteNames: 'always',
      keyPressStyle: 'vivid',
      vividKeyPressColor: primaryColor,
      // Target notes get a distinct muted highlight so live MIDI input stands out
      specialHighlightedNotes: normalizedTargets,
      specialHighlightColor: '#9c7c38', // amber — visually distinct from primary blue keypress
    });

    piano.create();

    // Scale the SVG to fill the container width while preserving aspect ratio
    const svg = ref.current.querySelector('svg');
    if (svg) {
      const w = svg.getAttribute('width');
      const h = svg.getAttribute('height');
      if (w && h) {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', 'auto');
      }
    }

    // Render live MIDI keypresses on top of target highlights
    pressedSignature.split('|').forEach((note) => {
      if (note) piano.keyDown(note);
    });

    return () => {
      piano.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSignature, pressedSignature, startOctave, endOctave, primaryColor]);

  return <Box ref={ref} sx={{ width: '100%' }} />;
}
