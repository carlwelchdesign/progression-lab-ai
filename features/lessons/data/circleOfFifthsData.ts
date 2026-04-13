export type CofKeyData = {
  semitone: number;
  majorKey: string;
  minorKey: string;
  sharpsFlats: number; // positive = sharps, negative = flats, 0 = none
  diatonicChords: string[];
  enharmonic?: string;
};

// 12 keys ordered clockwise from C at the top (C=0, +7 semitones each step)
export const COF_KEYS: CofKeyData[] = [
  {
    semitone: 0,
    majorKey: 'C',
    minorKey: 'Am',
    sharpsFlats: 0,
    diatonicChords: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'],
  },
  {
    semitone: 7,
    majorKey: 'G',
    minorKey: 'Em',
    sharpsFlats: 1,
    diatonicChords: ['Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'F#m7b5'],
  },
  {
    semitone: 2,
    majorKey: 'D',
    minorKey: 'Bm',
    sharpsFlats: 2,
    diatonicChords: ['Dmaj7', 'Em7', 'F#m7', 'Gmaj7', 'A7', 'Bm7', 'C#m7b5'],
  },
  {
    semitone: 9,
    majorKey: 'A',
    minorKey: 'F#m',
    sharpsFlats: 3,
    diatonicChords: ['Amaj7', 'Bm7', 'C#m7', 'Dmaj7', 'E7', 'F#m7', 'G#m7b5'],
  },
  {
    semitone: 4,
    majorKey: 'E',
    minorKey: 'C#m',
    sharpsFlats: 4,
    diatonicChords: ['Emaj7', 'F#m7', 'G#m7', 'Amaj7', 'B7', 'C#m7', 'D#m7b5'],
  },
  {
    semitone: 11,
    majorKey: 'B',
    minorKey: 'G#m',
    sharpsFlats: 5,
    enharmonic: 'Cb',
    diatonicChords: ['Bmaj7', 'C#m7', 'D#m7', 'Emaj7', 'F#7', 'G#m7', 'A#m7b5'],
  },
  {
    semitone: 6,
    majorKey: 'F#',
    minorKey: 'D#m',
    sharpsFlats: 6,
    enharmonic: 'Gb',
    diatonicChords: ['F#maj7', 'G#m7', 'A#m7', 'Bmaj7', 'C#7', 'D#m7', 'E#m7b5'],
  },
  {
    semitone: 1,
    majorKey: 'Db',
    minorKey: 'Bbm',
    sharpsFlats: -5,
    enharmonic: 'C#',
    diatonicChords: ['Dbmaj7', 'Ebm7', 'Fm7', 'Gbmaj7', 'Ab7', 'Bbm7', 'Cm7b5'],
  },
  {
    semitone: 8,
    majorKey: 'Ab',
    minorKey: 'Fm',
    sharpsFlats: -4,
    diatonicChords: ['Abmaj7', 'Bbm7', 'Cm7', 'Dbmaj7', 'Eb7', 'Fm7', 'Gm7b5'],
  },
  {
    semitone: 3,
    majorKey: 'Eb',
    minorKey: 'Cm',
    sharpsFlats: -3,
    diatonicChords: ['Ebmaj7', 'Fm7', 'Gm7', 'Abmaj7', 'Bb7', 'Cm7', 'Dm7b5'],
  },
  {
    semitone: 10,
    majorKey: 'Bb',
    minorKey: 'Gm',
    sharpsFlats: -2,
    diatonicChords: ['Bbmaj7', 'Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5'],
  },
  {
    semitone: 5,
    majorKey: 'F',
    minorKey: 'Dm',
    sharpsFlats: -1,
    diatonicChords: ['Fmaj7', 'Gm7', 'Am7', 'Bbmaj7', 'C7', 'Dm7', 'Em7b5'],
  },
];

export const SCALE_DEGREE_LABELS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
