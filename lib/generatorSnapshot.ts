import type { ChordItem, GeneratorSnapshot } from './types';

/**
 * Returns the first progression idea from the saved generator payload.
 */
export function getPrimaryProgressionFromSnapshot(snapshot: GeneratorSnapshot): {
  label: string;
  chords: ChordItem[];
  feel: string;
  pianoVoicings: GeneratorSnapshot['data']['progressionIdeas'][number]['pianoVoicings'];
} | null {
  const firstIdea = snapshot?.data?.progressionIdeas?.[0];
  if (!firstIdea || !Array.isArray(firstIdea.chords) || firstIdea.chords.length === 0) {
    return null;
  }

  return {
    label: firstIdea.label || 'Saved progression',
    chords: firstIdea.chords.map((chord) => ({ name: chord, beats: 1 })),
    feel: firstIdea.feel || 'Loaded from saved progression',
    pianoVoicings: Array.isArray(firstIdea.pianoVoicings) ? firstIdea.pianoVoicings : [],
  };
}

/**
 * Builds a deterministic default title when the user leaves title blank.
 */
export function buildDefaultProgressionTitle(snapshot: GeneratorSnapshot): string {
  const firstIdea = snapshot?.data?.progressionIdeas?.[0];
  if (firstIdea?.label?.trim()) {
    return firstIdea.label.trim();
  }

  const firstChord = snapshot?.data?.inputSummary?.seedChords?.[0];
  if (firstChord?.trim()) {
    return `${firstChord.trim()} progression`;
  }

  return 'Saved progression';
}
