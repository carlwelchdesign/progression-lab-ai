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
  const visibleFrets = 4;
  const fullBarreSpan = 6;

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

    const preferredPosition =
      hasOpenStrings || minFret <= 1
        ? 1
        : typeof position === 'number' && position >= 1
          ? position
          : minFret;

    // Some chord sources provide absolute frets with a position that would push
    // notes outside the rendered window. In that case, anchor to the actual min fret.
    const hasFretsBelowPreferredPosition =
      preferredPosition > 1 && numericFrets.some((fret) => fret < preferredPosition);

    const normalizedPosition = hasFretsBelowPreferredPosition ? minFret : preferredPosition;
    const inputFretsAreRelative =
      normalizedPosition > 1 && numericFrets.some((fret) => fret < normalizedPosition);

    const renderedFingers: Finger[] = fingers.map(([stringNumber, fret, text]) => {
      if (typeof fret !== 'number') {
        return [stringNumber, fret, text];
      }

      if (normalizedPosition <= 1 || inputFretsAreRelative) {
        return [stringNumber, fret, text];
      }

      const relativeFret = fret - normalizedPosition + 1;
      return [stringNumber, relativeFret, text];
    });

    const renderedBarres: Barre[] = barres
      .map((barre) => {
        const start = Math.round(Math.min(barre.fromString, barre.toString));
        const end = Math.round(Math.max(barre.fromString, barre.toString));

        const fromString = Math.max(1, Math.min(6, start));
        const toString = Math.max(1, Math.min(6, end));
        const barreSpan = toString - fromString + 1;

        if (toString <= fromString) {
          return null;
        }

        // Hide mini/partial barres; keep only full barres across all strings.
        if (barreSpan < fullBarreSpan) {
          return null;
        }

        const fret =
          normalizedPosition > 1 && !inputFretsAreRelative
            ? barre.fret - normalizedPosition + 1
            : barre.fret;

        if (!Number.isFinite(fret) || fret < 1 || fret > visibleFrets) {
          return null;
        }

        const matchingFingersInSpan = renderedFingers.filter(([stringNumber, fingerFret]) => {
          return (
            typeof fingerFret === 'number' &&
            fingerFret === fret &&
            stringNumber >= fromString &&
            stringNumber <= toString
          );
        }).length;

        if (matchingFingersInSpan < 2) {
          return null;
        }

        const sanitizedBarre = {
          ...barre,
          fromString,
          toString,
          fret,
        };
        delete sanitizedBarre.text;

        return sanitizedBarre;
      })
      .filter((barre): barre is Barre => barre !== null);

    try {
      new SVGuitarChord(selector)
        .configure({
          strings: 6,
          frets: visibleFrets,
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
          fingers: renderedFingers,
          barres: renderedBarres,
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
