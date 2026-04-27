'use client';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Instrument } from 'piano-chart';
import type { PianoVoicing } from '../types';

type Props = {
  voicing: PianoVoicing;
  specialHighlightedNotes?: string[];
  startOctave?: number;
  endOctave?: number;
  minHeight?: number;
};

const EMPTY_SPECIAL_NOTES: string[] = [];
const NOTES_PER_OCTAVE = 7;

function getWhiteKeyCount(startOctave: number, endOctave: number): number {
  return Math.max(1, (endOctave - startOctave + 1) * NOTES_PER_OCTAVE);
}

export default function MiniChordKeyboard({
  voicing,
  specialHighlightedNotes = EMPTY_SPECIAL_NOTES,
  startOctave = 3,
  endOctave = 5,
  minHeight = 0,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const sharedToneColor = theme.palette.warning.main;
  const whiteKeyCount = getWhiteKeyCount(startOctave, endOctave);

  const notes = useMemo(
    () => [...voicing.leftHand, ...voicing.rightHand],
    [voicing.leftHand, voicing.rightHand],
  );
  const notesSignature = notes.join('|');
  const specialNotesSignature = specialHighlightedNotes.join('|');
  const specialNoteSet = useMemo(
    () => new Set(specialHighlightedNotes),
    // specialHighlightedNotes may be rebuilt by parents; the signature is the stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [specialNotesSignature],
  );

  useEffect(() => {
    if (!ref.current) return;

    let isDisposed = false;
    let frameOne = 0;
    let frameTwo = 0;

    setIsReady(false);
    ref.current.innerHTML = '';

    const piano = new Instrument(ref.current, {
      startOctave,
      endOctave,
      showNoteNames: 'onpress',
      keyPressStyle: 'vivid',
      vividKeyPressColor: primaryColor,
    });

    piano.create();
    notes.filter((note) => !specialNoteSet.has(note)).forEach((note) => piano.keyDown(note));
    piano.applySettings({ vividKeyPressColor: sharedToneColor });
    specialHighlightedNotes.forEach((note) => piano.keyDown(note));

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        if (!isDisposed) setIsReady(true);
      });
    });

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
      piano.destroy();
    };
    // notesSignature drives re-render; primaryColor handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    notesSignature,
    specialNotesSignature,
    primaryColor,
    sharedToneColor,
    startOctave,
    endOctave,
  ]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight,
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 0.5,
          opacity: isReady ? 0 : 1,
          overflow: 'hidden',
          pointerEvents: 'none',
          transition: 'opacity 180ms ease',
          backgroundColor: 'rgba(255,255,255,0.025)',
          backgroundImage: [
            'linear-gradient(90deg, rgba(255,255,255,0.22) 0 1px, transparent 1px)',
            'linear-gradient(180deg, rgba(0,0,0,0.72) 0 55%, transparent 55%)',
            'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04))',
          ].join(', '),
          backgroundSize: `calc(100% / ${whiteKeyCount}) 100%, calc(100% / ${whiteKeyCount}) 62%, 100% 100%`,
          backgroundPosition: `0 0, calc(100% / ${whiteKeyCount * 2}) 0, 0 0`,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            transform: 'translateX(-100%)',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            animation: 'lceKeybedSweep 900ms ease-in-out infinite',
          },
          '@keyframes lceKeybedSweep': {
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      />
      <Box
        ref={ref}
        sx={{
          width: '100%',
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 180ms ease',
          '& > *': { width: '100% !important' },
        }}
      />
    </Box>
  );
}
