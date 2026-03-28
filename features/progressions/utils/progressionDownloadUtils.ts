import type { PdfChartOptions, PdfChordEntry } from '../../../lib/pdf';
import type { Progression } from '../../../lib/types';

/**
 * Converts a Progression to PdfChartOptions for session chart generation.
 */
export function progressionToPdfOptions(progression: Progression): PdfChartOptions {
  const chords: PdfChordEntry[] = (progression.chords ?? []).map((chord, index) => {
    const chordName = typeof chord === 'string' ? chord : (chord?.name ?? '');
    const beats = typeof chord !== 'string' ? chord?.beats : undefined;

    // Find the corresponding voicing if available
    const pianoVoicing =
      Array.isArray(progression.pianoVoicings) && index < progression.pianoVoicings.length
        ? progression.pianoVoicings[index]
        : undefined;

    return {
      chord: chordName,
      beats,
      pianoVoicing: pianoVoicing
        ? {
            leftHand: Array.isArray(pianoVoicing.leftHand) ? pianoVoicing.leftHand : [],
            rightHand: Array.isArray(pianoVoicing.rightHand) ? pianoVoicing.rightHand : [],
          }
        : undefined,
    };
  });

  return {
    title: progression.title || 'Untitled Progression',
    chords,
    scale: progression.scale,
    genre: progression.genre,
    feel: progression.feel,
    tempoBpm: 100, // Default tempo if not specified
    extraNotes: progression.notes,
  };
}

/**
 * Gets the appropriate file name for downloads, sanitized.
 */
export function getProgressionFileName(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'progression'
  );
}
