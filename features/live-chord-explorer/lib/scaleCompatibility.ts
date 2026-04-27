const SCALE_MAP: Record<string, string[]> = {
  maj: ['Major', 'Lydian', 'Major Pentatonic'],
  maj7: ['Ionian', 'Lydian'],
  maj9: ['Ionian', 'Lydian'],
  '6': ['Major', 'Lydian', 'Major Pentatonic'],
  add9: ['Major', 'Lydian'],
  m: ['Natural Minor', 'Dorian', 'Phrygian', 'Minor Pentatonic'],
  m7: ['Dorian', 'Aeolian'],
  m9: ['Dorian', 'Aeolian'],
  m6: ['Dorian', 'Melodic Minor'],
  '7': ['Mixolydian', 'Blues', 'Dominant Bebop'],
  '9': ['Mixolydian', 'Lydian Dominant'],
  dim: ['Whole-Half Diminished', 'Half-Whole Diminished'],
  dim7: ['Whole-Half Diminished'],
  m7b5: ['Locrian', 'Half-Whole Diminished'],
  aug: ['Whole Tone', 'Lydian Augmented'],
  sus2: ['Major Pentatonic', 'Major'],
  sus4: ['Mixolydian', 'Major'],
};

/**
 * Returns a list of compatible scale/mode names for a given chord quality string.
 */
export function getCompatibleScales(quality: string): string[] {
  return SCALE_MAP[quality] ?? ['Major', 'Minor Pentatonic'];
}
