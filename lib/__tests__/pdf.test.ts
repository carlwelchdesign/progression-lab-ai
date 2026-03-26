import { chordToNashville, romanToNashville } from '../pdf';

describe('romanToNashville', () => {
  it('converts uppercase numerals directly', () => {
    expect(romanToNashville('IVmaj7')).toBe('4maj7');
    expect(romanToNashville('V7')).toBe('57');
  });

  it('keeps accidentals', () => {
    expect(romanToNashville('bVII')).toBe('b7');
    expect(romanToNashville('#ivm7')).toBe('#4m7');
  });

  it('adds minor marker for lowercase roman numerals when needed', () => {
    expect(romanToNashville('ii7')).toBe('2m7');
    expect(romanToNashville('vim')).toBe('6m');
  });

  it('converts diminished symbols cleanly', () => {
    expect(romanToNashville('vii°')).toBe('7°');
    expect(romanToNashville('viio7')).toBe('7°7');
    expect(romanToNashville('viidim7')).toBe('7°7');
  });

  it('converts slash notation to Nashville degrees', () => {
    expect(romanToNashville('I/V')).toBe('1/5');
    expect(romanToNashville('bVII/iv')).toBe('b7/4m');
  });

  it('passes unknown symbols through unchanged', () => {
    expect(romanToNashville('N.C.')).toBe('N.C.');
  });
});

describe('chordToNashville', () => {
  it('maps major-key triads and sevenths from chord symbols', () => {
    expect(chordToNashville('C', 'C')).toBe('1');
    expect(chordToNashville('F', 'C')).toBe('4');
    expect(chordToNashville('G7', 'C')).toBe('57');
  });

  it('maps minor and diminished quality symbols', () => {
    expect(chordToNashville('Am', 'C')).toBe('6m');
    expect(chordToNashville('Dm7', 'C')).toBe('2m7');
    expect(chordToNashville('Bdim7', 'C')).toBe('7°7');
  });

  it('maps slash chords to inversion-style degrees', () => {
    expect(chordToNashville('C/E', 'C')).toBe('1/3');
    expect(chordToNashville('G/B', 'C')).toBe('5/7');
  });

  it('handles accidentals relative to tonic', () => {
    expect(chordToNashville('Bb', 'C')).toBe('b7');
    expect(chordToNashville('F#', 'C')).toBe('#4');
  });
});
