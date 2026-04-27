'use client';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Instrument } from 'piano-chart';

type Props = {
  activeNotes: string[];
  startOctave?: number;
  endOctave?: number;
  height?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
};

function PianoKeyboard({ activeNotes, startOctave = 2, endOctave = 7, height = 148 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const notesSignature = useMemo(() => activeNotes.join('|'), [activeNotes]);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = '';

    const piano = new Instrument(ref.current, {
      startOctave,
      endOctave,
      showNoteNames: 'onpress',
      keyPressStyle: 'vivid',
      vividKeyPressColor: primaryColor,
    });

    piano.create();
    activeNotes.forEach((note) => piano.keyDown(note));

    return () => {
      piano.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesSignature, startOctave, endOctave, primaryColor]);

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        '& > *': {
          minWidth: 0,
          flexShrink: 0,
        },
      }}
    />
  );
}

function arePropsEqual(prev: Props, next: Props): boolean {
  if (prev.startOctave !== next.startOctave || prev.endOctave !== next.endOctave) return false;
  if (JSON.stringify(prev.height) !== JSON.stringify(next.height)) return false;
  if (prev.activeNotes.length !== next.activeNotes.length) return false;
  return prev.activeNotes.every((n, i) => n === next.activeNotes[i]);
}

export default memo(PianoKeyboard, arePropsEqual);
