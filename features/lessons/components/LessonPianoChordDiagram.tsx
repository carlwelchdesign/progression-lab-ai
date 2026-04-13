'use client';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Instrument } from 'piano-chart';

// Compact 2-octave keyboard suited for lesson chord display.
// Shows C3–B5, which covers standard right-hand voicings at octave 4.
// Left hand bass notes are intentionally omitted to keep the diagram focused.

type Props = {
  notes: string[];
};

function LessonPianoChordDiagram({ notes }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const notesSignature = useMemo(() => notes.join('|'), [notes]);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = '';

    const piano = new Instrument(ref.current, {
      startOctave: 3,
      endOctave: 6,
      showNoteNames: 'always',
      keyPressStyle: 'vivid',
      vividKeyPressColor: primaryColor,
    });

    piano.create();

    notes.forEach((note) => {
      piano.keyDown(note);
    });

    return () => {
      piano.destroy();
    };
  }, [notes, notesSignature, primaryColor]);

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        '& > *': { marginLeft: 'auto', marginRight: 'auto' },
      }}
    />
  );
}

function arePropsEqual(prev: Props, next: Props): boolean {
  if (prev.notes.length !== next.notes.length) return false;
  return prev.notes.every((n, i) => n === next.notes[i]);
}

export default memo(LessonPianoChordDiagram, arePropsEqual);
