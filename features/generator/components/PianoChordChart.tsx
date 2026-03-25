'use client';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useRef } from 'react';
import { Instrument } from 'piano-chart';

type PianoChordChartProps = {
  notes: string[];
  highlightedNotes?: string[];
  rootNote?: string;
  startOctave?: number;
  endOctave?: number;
};

export default function PianoChordChart({
  notes,
  highlightedNotes = [],
  rootNote,
  startOctave = 3,
  endOctave = 5,
}: PianoChordChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const piano = new Instrument(containerRef.current, {
      startOctave,
      endOctave,
      showNoteNames: 'onpress',
      highlightedNotes,
      keyPressStyle: 'vivid',
      vividKeyPressColor: theme.palette.primary.main,
    });

    piano.create();

    notes.forEach((note) => {
      piano.keyDown(note);
    });

    return () => {
      piano.destroy();
    };
  }, [notes, highlightedNotes, rootNote, startOctave, endOctave, theme.palette.primary.main]);

  return <Box ref={containerRef} />;
}
