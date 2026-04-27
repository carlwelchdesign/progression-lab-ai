export type CircleNode = {
  readonly pos: number;
  readonly major: string;
  readonly minor: string;
  readonly pitchClass: number;
  readonly minorPitchClass: number; // (pitchClass + 9) % 12
};

// Clockwise from top: C at 12 o'clock
export const CIRCLE_NODES: readonly CircleNode[] = [
  { pos: 0, major: 'C', minor: 'Am', pitchClass: 0, minorPitchClass: 9 },
  { pos: 1, major: 'G', minor: 'Em', pitchClass: 7, minorPitchClass: 4 },
  { pos: 2, major: 'D', minor: 'Bm', pitchClass: 2, minorPitchClass: 11 },
  { pos: 3, major: 'A', minor: 'F#m', pitchClass: 9, minorPitchClass: 6 },
  { pos: 4, major: 'E', minor: 'C#m', pitchClass: 4, minorPitchClass: 1 },
  { pos: 5, major: 'B', minor: 'G#m', pitchClass: 11, minorPitchClass: 8 },
  { pos: 6, major: 'F#', minor: 'Ebm', pitchClass: 6, minorPitchClass: 3 },
  { pos: 7, major: 'Db', minor: 'Bbm', pitchClass: 1, minorPitchClass: 10 },
  { pos: 8, major: 'Ab', minor: 'Fm', pitchClass: 8, minorPitchClass: 5 },
  { pos: 9, major: 'Eb', minor: 'Cm', pitchClass: 3, minorPitchClass: 0 },
  { pos: 10, major: 'Bb', minor: 'Gm', pitchClass: 10, minorPitchClass: 7 },
  { pos: 11, major: 'F', minor: 'Dm', pitchClass: 5, minorPitchClass: 2 },
];

// Pitch class 0–11 → circle position 0–11
export const PC_TO_POS: readonly number[] = [
  0, // C
  7, // C#/Db
  2, // D
  9, // D#/Eb
  4, // E
  11, // F
  6, // F#/Gb
  1, // G
  8, // G#/Ab
  3, // A
  10, // A#/Bb
  5, // B
];

export const CATEGORY_COLORS: Record<string, string> = {
  diatonic: '#4db8ff',
  tension: '#ff5722',
  resolution: '#4caf50',
  color: '#ba68c8',
  jazzy: '#ffa726',
};

export const PALETTE = {
  bg: '#040912',
  bgInner: '#080f1e',
  ring: 'rgba(35,65,150,0.22)',
  ringSpoke: 'rgba(30,55,120,0.10)',
  nodeBase: '#0c1426',
  nodeBorder: 'rgba(45,80,180,0.28)',
  labelDim: '#253553',
  labelNormal: '#5a78b0',
  labelBright: '#c8ddff',
  anchor: '#ffcc44',
  anchorGlow: 'rgba(255,200,60,0.55)',
  keyCenter: '#00d4ff',
  keyCenterGlow: 'rgba(0,208,255,0.45)',
  liveNote: '#e8f4ff',
  liveNoteGlow: 'rgba(220,240,255,0.55)',
  sectorFill: 'rgba(100,160,255,0.07)',
  particleDefault: '#88aadd',
} as const;
