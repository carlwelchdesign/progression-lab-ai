'use client';

import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import { Instrument } from 'piano-chart';

type Props = {
  leftHand: string[];
  rightHand: string[];
};

export default function PianoChordDiagram({ leftHand, rightHand }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = '';

    const piano = new Instrument(ref.current, {
      startOctave: 2,
      endOctave: 6,
      showNoteNames: 'always',
      keyPressStyle: 'vivid',
      vividKeyPressColor: '#2563eb',
    });

    piano.create();

    [...leftHand, ...rightHand].forEach((note) => {
      piano.keyDown(note);
    });

    return () => {
      piano.destroy();
    };
  }, [leftHand, rightHand]);

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
