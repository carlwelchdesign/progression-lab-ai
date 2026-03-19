'use client';

import { Box, useTheme } from '@mui/material';
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

export default function GuitarChordDiagram({ title, fingers, barres = [], position }: Props) {
  const id = useId().replace(/:/g, '');
  const theme = useTheme();

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
          color: theme.palette.text.primary,
          fingerColor: theme.palette.primary.main,
          fingerTextColor: theme.palette.getContrastText(theme.palette.primary.main),
        })
        .chord({
          title,
          fingers,
          barres,
          position: normalizedPosition,
        })
        .draw();
    } catch (error) {
      console.error('svguitar render failed', {
        title,
        position: normalizedPosition,
        fingers,
        barres,
        error,
      });
    }
  }, [id, title, fingers, barres, position, theme]);

  return (
    <Box
      id={`guitar-chart-${id}`}
      sx={{
        minHeight: { xs: 180, sm: 220 },
        minWidth: { xs: 120, sm: 160 },
        width: { xs: 120, sm: 160 },
        mx: 'auto',
        '& svg': {
          width: { xs: 120, sm: 160 },
          height: 'auto',
          display: 'block',
        },
      }}
    />
  );
}
