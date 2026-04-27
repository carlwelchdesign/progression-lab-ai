import { detectChord } from '../detectChord';

describe('detectChord', () => {
  describe('triads', () => {
    it('detects C major from [0,4,7]', () => {
      const result = detectChord([0, 4, 7]);
      expect(result?.name).toBe('C');
      expect(result?.root).toBe('C');
      expect(result?.quality).toBe('maj');
    });

    it('detects C minor from [0,3,7]', () => {
      const result = detectChord([0, 3, 7]);
      expect(result?.name).toBe('Cm');
      expect(result?.quality).toBe('m');
    });

    it('detects C diminished from [0,3,6]', () => {
      const result = detectChord([0, 3, 6]);
      expect(result?.name).toBe('Cdim');
      expect(result?.quality).toBe('dim');
    });

    it('detects C augmented from [0,4,8]', () => {
      const result = detectChord([0, 4, 8]);
      expect(result?.name).toBe('Caug');
      expect(result?.quality).toBe('aug');
    });

    it('detects Csus2 from [0,2,7]', () => {
      const result = detectChord([0, 2, 7]);
      expect(result?.name).toBe('Csus2');
    });

    it('detects Csus4 from [0,5,7]', () => {
      const result = detectChord([0, 5, 7]);
      expect(result?.name).toBe('Csus4');
    });
  });

  describe('seventh chords', () => {
    it('detects Cmaj7 from [0,4,7,11]', () => {
      const result = detectChord([0, 4, 7, 11]);
      expect(result?.name).toBe('Cmaj7');
    });

    it('detects Cm7 from [0,3,7,10]', () => {
      const result = detectChord([0, 3, 7, 10]);
      expect(result?.name).toBe('Cm7');
    });

    it('detects C7 (dominant) from [0,4,7,10]', () => {
      const result = detectChord([0, 4, 7, 10]);
      expect(result?.name).toBe('C7');
    });

    it('detects Cm7b5 (half-diminished) from [0,3,6,10]', () => {
      const result = detectChord([0, 3, 6, 10]);
      expect(result?.name).toBe('Cm7b5');
    });

    it('detects Cdim7 from [0,3,6,9]', () => {
      const result = detectChord([0, 3, 6, 9]);
      expect(result?.name).toBe('Cdim7');
    });
  });

  describe('extended chords', () => {
    it('detects C6 from [0,4,7,9]', () => {
      const result = detectChord([0, 4, 7, 9]);
      expect(result?.name).toBe('C6');
    });

    it('detects Cm6 from [0,3,7,9]', () => {
      const result = detectChord([0, 3, 7, 9]);
      expect(result?.name).toBe('Cm6');
    });
  });

  describe('inversions and ordering', () => {
    it('detects C major from first inversion [4,7,0]', () => {
      const result = detectChord([4, 7, 0]);
      expect(result?.root).toBe('C');
      expect(result?.quality).toBe('maj');
    });

    it('detects C major from second inversion [7,0,4]', () => {
      const result = detectChord([7, 0, 4]);
      expect(result?.root).toBe('C');
    });
  });

  describe('slash chords', () => {
    it('detects C/E when bass MIDI note is E (pitch class 4)', () => {
      // C major pitch classes, bass is E4 (MIDI 64, pitch class 4)
      const result = detectChord([0, 4, 7], 64);
      expect(result?.name).toBe('C/E');
      expect(result?.bassNote).toBe('E');
    });

    it('omits slash when bass matches root', () => {
      // C major, bass is C3 (MIDI 48, pitch class 0)
      const result = detectChord([0, 4, 7], 48);
      expect(result?.name).toBe('C');
      expect(result?.bassNote).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns null for single note', () => {
      expect(detectChord([0])).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(detectChord([])).toBeNull();
    });

    it('detects G major from [7,11,2]', () => {
      const result = detectChord([7, 11, 2]);
      expect(result?.root).toBe('G');
      expect(result?.quality).toBe('maj');
    });

    it('detects Am from [9,0,4]', () => {
      const result = detectChord([9, 0, 4]);
      expect(result?.root).toBe('A');
      expect(result?.quality).toBe('m');
    });
  });
});
