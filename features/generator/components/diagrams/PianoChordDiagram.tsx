'use client';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Instrument } from 'piano-chart';

type PianoChordDiagramProps = {
  leftHand: string[];
  rightHand: string[];
};

function PianoChordDiagram({ leftHand, rightHand }: PianoChordDiagramProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const notes = useMemo(() => [...leftHand, ...rightHand], [leftHand, rightHand]);
  const notesSignature = useMemo(() => notes.join('|'), [notes]);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = '';

    const piano = new Instrument(ref.current, {
      startOctave: 2,
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
        '& > *': {
          marginLeft: 'auto',
          marginRight: 'auto',
        },
      }}
    />
  );
}

function arePropsEqual(previous: PianoChordDiagramProps, next: PianoChordDiagramProps): boolean {
  if (previous.leftHand.length !== next.leftHand.length) {
    return false;
  }

  if (previous.rightHand.length !== next.rightHand.length) {
    return false;
  }

  const leftIsEqual = previous.leftHand.every((note, index) => note === next.leftHand[index]);
  if (!leftIsEqual) {
    return false;
  }

  return previous.rightHand.every((note, index) => note === next.rightHand[index]);
}

export default memo(PianoChordDiagram, arePropsEqual);
