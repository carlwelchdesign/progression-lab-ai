import { generateChordSuggestions } from '../generateChordSuggestions';
import type { DetectedChord } from '../../types';

const cMajorChord: DetectedChord = {
  name: 'C',
  root: 'C',
  quality: 'maj',
  pitchClasses: [0, 4, 7],
  alternateInterpretations: [],
};

const g7Chord: DetectedChord = {
  name: 'G7',
  root: 'G',
  quality: '7',
  pitchClasses: [7, 11, 2, 5],
  alternateInterpretations: [],
};

describe('generateChordSuggestions', () => {
  describe('with known key center', () => {
    it('returns suggestions for C major chord in key of C', () => {
      const suggestions = generateChordSuggestions(cMajorChord, 'C');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('includes diatonic chords in key of C', () => {
      const suggestions = generateChordSuggestions(cMajorChord, 'C');
      const diatonic = suggestions.filter((s) => s.category === 'diatonic');
      const names = diatonic.map((s) => s.name);
      // Am7, Fm7, Gm7 are diatonic in C major
      expect(names.some((n) => n === 'Am7')).toBe(true);
      expect(names.some((n) => n === 'Fmaj7')).toBe(true);
      expect(names.some((n) => n === 'G7')).toBe(true);
    });

    it('includes resolution suggestions for G7 resolving to C', () => {
      const suggestions = generateChordSuggestions(g7Chord, 'C');
      const resolution = suggestions.filter((s) => s.category === 'resolution');
      const names = resolution.map((s) => s.name);
      expect(names.some((n) => n.startsWith('C'))).toBe(true);
    });

    it('excludes the current chord from suggestions', () => {
      const suggestions = generateChordSuggestions(cMajorChord, 'C');
      expect(suggestions.find((s) => s.name === 'C')).toBeUndefined();
    });
  });

  describe('without key center', () => {
    it('still generates suggestions from chord root alone', () => {
      const suggestions = generateChordSuggestions(cMajorChord, null);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('includes color/borrowed chords', () => {
      const suggestions = generateChordSuggestions(cMajorChord, null);
      const color = suggestions.filter((s) => s.category === 'color');
      expect(color.length).toBeGreaterThan(0);
    });

    it('includes jazzy suggestions', () => {
      const suggestions = generateChordSuggestions(cMajorChord, null);
      const jazzy = suggestions.filter((s) => s.category === 'jazzy');
      expect(jazzy.length).toBeGreaterThan(0);
    });
  });

  describe('suggestion shape', () => {
    it('each suggestion has required fields', () => {
      const suggestions = generateChordSuggestions(cMajorChord, 'C');
      for (const s of suggestions) {
        expect(s.name).toBeTruthy();
        expect(s.category).toBeTruthy();
        expect(s.explanation).toBeTruthy();
        expect(s.mood).toBeTruthy();
        expect(typeof s.confidence).toBe('number');
        expect(typeof s.sharedTones).toBe('number');
        expect(Array.isArray(s.scales)).toBe(true);
        expect(s.pianoVoicing).toBeDefined();
      }
    });

    it('all suggestions have pianoVoicing with leftHand and rightHand', () => {
      const suggestions = generateChordSuggestions(cMajorChord, 'C');
      for (const s of suggestions) {
        expect(Array.isArray(s.pianoVoicing.leftHand)).toBe(true);
        expect(Array.isArray(s.pianoVoicing.rightHand)).toBe(true);
      }
    });
  });

  describe('null chord', () => {
    it('returns empty array for null chord', () => {
      expect(generateChordSuggestions(null, 'C')).toEqual([]);
      expect(generateChordSuggestions(null, null)).toEqual([]);
    });
  });
});
