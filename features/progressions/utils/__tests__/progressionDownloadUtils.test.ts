import { progressionToPdfOptions, getProgressionFileName } from '../progressionDownloadUtils';
import type { Progression, PianoVoicing } from '../../../../lib/types';

describe('progressionDownloadUtils', () => {
  describe('getProgressionFileName', () => {
    it('should sanitize file names correctly', () => {
      expect(getProgressionFileName('My Progression')).toBe('my-progression');
      expect(getProgressionFileName('Jazz Blues in F')).toBe('jazz-blues-in-f');
      expect(getProgressionFileName('Chord!!!Progression###')).toBe('chord-progression');
      expect(getProgressionFileName('  Spaces  ')).toBe('spaces');
    });

    it('should return default name for empty string', () => {
      expect(getProgressionFileName('')).toBe('progression');
    });
  });

  describe('progressionToPdfOptions', () => {
    const mockVoicing: PianoVoicing = {
      leftHand: ['C2', 'E2', 'G2'],
      rightHand: ['C4', 'E4', 'G4'],
    };

    const mockProgression: Progression = {
      id: 'test-id',
      shareId: 'share-id',
      userId: 'user-id',
      title: 'Test Progression',
      chords: [
        { name: 'Cmaj7', beats: 4 },
        { name: 'G7', beats: 4 },
        { name: 'Am7', beats: 4 },
      ],
      pianoVoicings: [mockVoicing, mockVoicing, mockVoicing],
      scale: 'C Major',
      genre: 'Jazz',
      feel: 'Smooth',
      notes: 'Test notes',
      tags: ['jazz', 'test'],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should convert progression to PDF options correctly', () => {
      const options = progressionToPdfOptions(mockProgression);

      expect(options.title).toBe('Test Progression');
      expect(options.scale).toBe('C Major');
      expect(options.genre).toBe('Jazz');
      expect(options.feel).toBe('Smooth');
      expect(options.extraNotes).toBe('Test notes');
      expect(options.chords).toHaveLength(3);
      expect(options.tempoBpm).toBe(100);
    });

    it('should map chords with voicings correctly', () => {
      const options = progressionToPdfOptions(mockProgression);

      expect(options.chords[0]).toEqual({
        chord: 'Cmaj7',
        beats: 4,
        pianoVoicing: {
          leftHand: ['C2', 'E2', 'G2'],
          rightHand: ['C4', 'E4', 'G4'],
        },
      });
    });

    it('should handle progression without voicings', () => {
      const progressionNoVoicings: Progression = {
        ...mockProgression,
        pianoVoicings: undefined,
      };

      const options = progressionToPdfOptions(progressionNoVoicings);

      expect(options.chords[0]).toEqual({
        chord: 'Cmaj7',
        beats: 4,
        pianoVoicing: undefined,
      });
    });

    it('should handle progression without chords', () => {
      const progressionNoChords: Progression = {
        ...mockProgression,
        chords: [],
      };

      const options = progressionToPdfOptions(progressionNoChords);

      expect(options.chords).toHaveLength(0);
    });

    it('should use default title for untitled progression', () => {
      const progressionUntitled: Progression = {
        ...mockProgression,
        title: '',
      };

      const options = progressionToPdfOptions(progressionUntitled);

      expect(options.title).toBe('Untitled Progression');
    });

    it('should handle string chords format', () => {
      const progressionStringChords: Progression = {
        ...mockProgression,
        chords: ['Cmaj7', 'G7', 'Am7'] as string[],
      };

      const options = progressionToPdfOptions(progressionStringChords);

      expect(options.chords[0]).toEqual({
        chord: 'Cmaj7',
        beats: undefined,
        pianoVoicing: mockVoicing,
      });
    });
  });
});
