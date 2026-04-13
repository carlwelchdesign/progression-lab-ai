'use client';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef } from 'react';
import { Instrument } from 'piano-chart';

// ── Enharmonic normalization ──────────────────────────────────────────────────

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
  const match = /^([A-G][b#]?)(\d+)$/.exec(note);
  if (!match) return note;
  const [, pitch, octave] = match;
  const sharp = ENHARMONIC[pitch] ?? pitch;
  return `${sharp}${octave}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  /** Notes to highlight as "target" — shown in a soft coral red */
  targetNotes: string[];
  /** Live MIDI input notes — shown as active keypresses */
  pressedNotes: Set<string>;
  startOctave?: number;
  endOctave?: number;
};

export default function MidiInteractivePiano({
  targetNotes,
  pressedNotes,
  startOctave = 2,
  endOctave = 6,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  const normalizedTargets = useMemo(() => targetNotes.map(normalizeNote), [targetNotes]);

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
      showNoteNames: 'never',
      keyPressStyle: 'vivid',
      vividKeyPressColor: primaryColor,
      specialHighlightedNotes: normalizedTargets,
      specialHighlightColor: '#FF7575',
    });

    piano.create();

    const svg = ref.current.querySelector('svg');
    if (svg) {
      const w = parseFloat(svg.getAttribute('width') ?? '0');
      const h = parseFloat(svg.getAttribute('height') ?? '0');
      if (w && h) {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('width', '100%');
        svg.removeAttribute('height');
        (svg as SVGElement).style.display = 'block';
      }
    }

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
