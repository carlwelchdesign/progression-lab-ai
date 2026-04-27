export type ChordTemplate = {
  suffix: string;
  intervals: number[];
  quality: string;
};

// More specific templates must come before simpler ones — detection tries them in order.
export const CHORD_TEMPLATES: ChordTemplate[] = [
  // 9ths
  { suffix: 'm9', intervals: [0, 3, 7, 10, 14], quality: 'm9' },
  { suffix: '9', intervals: [0, 4, 7, 10, 14], quality: '9' },
  { suffix: 'maj9', intervals: [0, 4, 7, 11, 14], quality: 'maj9' },

  // 7ths
  { suffix: 'maj7', intervals: [0, 4, 7, 11], quality: 'maj7' },
  { suffix: 'm7', intervals: [0, 3, 7, 10], quality: 'm7' },
  { suffix: '7', intervals: [0, 4, 7, 10], quality: '7' },
  { suffix: 'm7b5', intervals: [0, 3, 6, 10], quality: 'm7b5' },
  { suffix: 'dim7', intervals: [0, 3, 6, 9], quality: 'dim7' },

  // 6ths
  { suffix: 'm6', intervals: [0, 3, 7, 9], quality: 'm6' },
  { suffix: '6', intervals: [0, 4, 7, 9], quality: '6' },

  // Add/sus
  { suffix: 'add9', intervals: [0, 4, 7, 14], quality: 'add9' },
  { suffix: 'sus4', intervals: [0, 5, 7], quality: 'sus4' },
  { suffix: 'sus2', intervals: [0, 2, 7], quality: 'sus2' },

  // Triads
  { suffix: 'aug', intervals: [0, 4, 8], quality: 'aug' },
  { suffix: 'dim', intervals: [0, 3, 6], quality: 'dim' },
  { suffix: 'm', intervals: [0, 3, 7], quality: 'm' },
  { suffix: '', intervals: [0, 4, 7], quality: 'maj' },
];

// The 7 diatonic intervals (in semitones) for a major scale
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

// Diatonic chord qualities for each scale degree (I ii iii IV V vi vii°)
export const DIATONIC_CHORD_QUALITIES: ChordTemplate[] = [
  { suffix: 'maj7', intervals: [0, 4, 7, 11], quality: 'maj7' }, // I
  { suffix: 'm7', intervals: [0, 3, 7, 10], quality: 'm7' }, // ii
  { suffix: 'm7', intervals: [0, 3, 7, 10], quality: 'm7' }, // iii
  { suffix: 'maj7', intervals: [0, 4, 7, 11], quality: 'maj7' }, // IV
  { suffix: '7', intervals: [0, 4, 7, 10], quality: '7' }, // V
  { suffix: 'm7', intervals: [0, 3, 7, 10], quality: 'm7' }, // vi
  { suffix: 'm7b5', intervals: [0, 3, 6, 10], quality: 'm7b5' }, // vii°
];

export const ROMAN_NUMERALS_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
export const ROMAN_NUMERALS_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
