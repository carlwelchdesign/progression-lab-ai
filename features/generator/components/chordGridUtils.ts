import { alpha, type Theme } from '@mui/material/styles';

import { getAudioClockSeconds } from '../../../domain/audio/audio';
import type { TimeSignature } from '../../../domain/audio/audio';

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older mobile browsers (pre-iOS 15.4, older Android WebView)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }

  if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
    return true;
  }

  return target.closest('[role="textbox"]') !== null;
};

export const getSchedulerNowMs = (): number => {
  const audioClockMs = getAudioClockSeconds() * 1000;
  if (Number.isFinite(audioClockMs) && audioClockMs > 0) {
    return audioClockMs;
  }

  return performance.now();
};

export const getBeatsPerBar = (signature: TimeSignature): number => {
  const numerator = Number.parseInt(signature.split('/')[0], 10);
  return Number.isFinite(numerator) && numerator > 0 ? numerator : 4;
};

export const getTransportIconButtonSx =
  (isActive: boolean, tone: 'primary' | 'error' = 'primary') =>
  (theme: Theme) => {
    const palette = tone === 'error' ? theme.palette.error : theme.palette.primary;

    return {
      borderWidth: 1.5,
      borderStyle: 'solid',
      borderRadius: 1,
      color: isActive ? theme.palette.common.white : palette.main,
      borderColor: isActive ? palette.main : alpha(palette.main, 0.9),
      backgroundColor: isActive ? palette.main : 'transparent',
      '&:hover': {
        borderColor: palette.main,
        backgroundColor: isActive ? palette.dark : alpha(palette.main, 0.08),
      },
    };
  };

/**
 * Picks a deterministic border color from chord quality or chord-name hash.
 */
export const getChordBorderColor = (
  chordName: string,
  suggestionBorders: readonly string[],
): string => {
  if (/sus/i.test(chordName)) {
    return suggestionBorders[1] ?? suggestionBorders[0];
  }

  if (/(?:maj9|add9|\b9\b|\b7\b|11|13)/i.test(chordName)) {
    return suggestionBorders[5] ?? suggestionBorders[0];
  }

  if (/(?:^|[^A-Za-z])m(?!aj)|min/i.test(chordName)) {
    return suggestionBorders[2] ?? suggestionBorders[0];
  }

  if (/dim|o/i.test(chordName)) {
    return suggestionBorders[3] ?? suggestionBorders[0];
  }

  if (/aug|\+/i.test(chordName)) {
    return suggestionBorders[4] ?? suggestionBorders[0];
  }

  let hash = 0;
  for (const char of chordName) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  }

  return suggestionBorders[Math.abs(hash) % suggestionBorders.length] ?? suggestionBorders[0];
};
