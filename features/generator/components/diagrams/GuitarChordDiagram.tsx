'use client';

import { Box, useTheme } from '@mui/material';
import { memo, useEffect, useId, useMemo } from 'react';
import { SVGuitarChord } from 'svguitar';

type Finger = [number, number | 'x', string?];

type Barre = {
  fromString: number;
  toString: number;
  fret: number;
  text?: string;
};

type GuitarChordDiagramProps = {
  title: string;
  fingers: Finger[];
  barres?: Barre[];
  position?: number | null;
};

function GuitarChordDiagram({ title, fingers, barres = [], position }: GuitarChordDiagramProps) {
  const id = useId().replace(/:/g, '');
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const primaryColor = theme.palette.primary.main;
  const contrastColor = theme.palette.getContrastText(primaryColor);
  const visibleFrets = 4;
  const fullBarreSpan = 6;
  const fingersSignature = useMemo(
    () =>
      fingers
        .map(([stringNumber, fret, text]) => `${stringNumber}:${fret}:${text ?? ''}`)
        .join('|'),
    [fingers],
  );
  const barresSignature = useMemo(
    () =>
      barres
        .map(
          ({ fromString, toString, fret, text }) =>
            `${fromString}:${toString}:${fret}:${text ?? ''}`,
        )
        .join('|'),
    [barres],
  );

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
          color: textColor,
          fingerColor: primaryColor,
          fingerTextColor: contrastColor,
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
  }, [
    id,
    title,
    fingers,
    barres,
    position,
    textColor,
    primaryColor,
    contrastColor,
    fingersSignature,
    barresSignature,
  ]);

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

function areFingersEqual(previous: Finger[], next: Finger[]): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((finger, index) => {
    const nextFinger = next[index];
    return (
      finger[0] === nextFinger[0] &&
      finger[1] === nextFinger[1] &&
      (finger[2] ?? '') === (nextFinger[2] ?? '')
    );
  });
}

function areBarresEqual(previous: Barre[] = [], next: Barre[] = []): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((barre, index) => {
    const nextBarre = next[index];
    return (
      barre.fromString === nextBarre.fromString &&
      barre.toString === nextBarre.toString &&
      barre.fret === nextBarre.fret &&
      (barre.text ?? '') === (nextBarre.text ?? '')
    );
  });
}

function arePropsEqual(previous: GuitarChordDiagramProps, next: GuitarChordDiagramProps): boolean {
  return (
    previous.title === next.title &&
    previous.position === next.position &&
    areFingersEqual(previous.fingers, next.fingers) &&
    areBarresEqual(previous.barres, next.barres)
  );
}

export default memo(GuitarChordDiagram, arePropsEqual);
