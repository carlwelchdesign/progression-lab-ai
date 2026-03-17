'use client';

import { Box } from '@mui/material';
import { useEffect, useId } from 'react';
import { SVGuitarChord } from 'svguitar';

type Finger = [number, number | 'x', string?];

type Barre = {
  fromString: number;
  toString: number;
  fret: number;
  text?: string;
};

type Props = {
  title: string;
  fingers: Finger[];
  barres?: Barre[];
  position?: number | null;
};

export default function GuitarChordDiagram({
  title,
  fingers,
  barres = [],
  position,
}: Props) {
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const selector = `#guitar-chart-${id}`;
    const container = document.querySelector(selector);

    if (!container) {
      return;
    }

    container.innerHTML = '';

    const hasOpenStrings = fingers.some((f) => f[1] === 0);

    const numericFrets = fingers
      .map((f) => (typeof f[1] === 'number' ? f[1] : null))
      .filter((f): f is number => f !== null);

    const minFret = numericFrets.length > 0 ? Math.min(...numericFrets) : 1;

    const normalizedPosition =
      hasOpenStrings || minFret <= 1
        ? 1
        : typeof position === 'number' && position >= 1
          ? position
          : minFret;

    try {
      new SVGuitarChord(selector)
        .configure({
          strings: 6,
          frets: 6,
          position: normalizedPosition,
          tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
          fingerSize: 1,
          backgroundColor: 'transparent',
          color: '#fff',
          fingerColor: '#3b82f6',
          fingerTextColor: '#ffffff',
        })
        .chord({
          title,
          fingers,
          barres,
          position: normalizedPosition,
        })
        .draw();

      console.log('svguitar render ok', {
        title,
        position: normalizedPosition,
        fingers,
        barres,
      });
    } catch (error) {
      console.error('svguitar render failed', {
        title,
        position: normalizedPosition,
        fingers,
        barres,
        error,
      });
    }
  }, [id, title, fingers, barres, position]);

  return <Box id={`guitar-chart-${id}`} sx={{ minHeight: 220, minWidth: 160 }} />;
}