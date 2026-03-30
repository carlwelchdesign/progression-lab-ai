import {
  arrangementToPdfOptions,
  getArrangementFileName,
  getArrangementMidiEvents,
  buildArrangementMidiBytes,
} from '../arrangementDownloadUtils';
import type { Arrangement } from '../../../../lib/types';

describe('arrangementDownloadUtils', () => {
  describe('getArrangementFileName', () => {
    it('should sanitize file names correctly', () => {
      expect(getArrangementFileName('My Arrangement')).toBe('my-arrangement');
      expect(getArrangementFileName('Pad Groove Draft')).toBe('pad-groove-draft');
      expect(getArrangementFileName('Loop!!!Example###')).toBe('loop-example');
      expect(getArrangementFileName('  Spaces  ')).toBe('spaces');
    });

    it('should return default name for empty string', () => {
      expect(getArrangementFileName('')).toBe('arrangement');
    });
  });

  describe('arrangementToPdfOptions', () => {
    const mockArrangement: Arrangement = {
      id: 'test-id',
      shareId: 'share-id',
      userId: 'user-id',
      title: 'Test Arrangement',
      timeline: {
        stepsPerBar: 12,
        loopLengthBars: 2,
        totalSteps: 24,
        events: [
          {
            padKey: 'pad-1',
            chord: 'Cmaj7',
            source: 'test',
            leftHand: ['C2', 'E2', 'G2'],
            rightHand: ['C4', 'E4', 'G4'],
            stepIndex: 0,
          },
          {
            padKey: 'pad-2',
            chord: 'G7',
            source: 'test',
            leftHand: ['G2', 'B2', 'D3'],
            rightHand: ['G4', 'B4', 'D5'],
            stepIndex: 12,
          },
        ],
      },
      playbackSnapshot: {
        tempoBpm: 120,
        timeSignature: '4/4',
        padPattern: 'single',
        playbackStyle: 'block',
        instrument: 'piano',
        octaveShift: 0,
        attack: 5,
        decay: 100,
        padVelocity: 84,
        humanize: 0,
        gate: 95,
        inversionRegister: 'off',
      },
      notes: 'Test notes',
      tags: ['groove', 'test'],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should convert arrangement to PDF options correctly', () => {
      const options = arrangementToPdfOptions(mockArrangement);

      expect(options.title).toBe('Test Arrangement');
      expect(options.tempoBpm).toBe(120);
      expect(options.chords).toHaveLength(2);
      expect(options.extraNotes).toContain('Test notes');
      expect(options.extraNotes).toContain('Time Signature: 4/4');
      expect(options.extraNotes).toContain('Loop: 2 bars');
      expect(options.extraNotes).toContain('Total Events: 2');
    });

    it('should extract chords from arrangement events', () => {
      const options = arrangementToPdfOptions(mockArrangement);

      const chordNames = options.chords.map((c) => c.chord);
      expect(chordNames).toContain('Cmaj7');
      expect(chordNames).toContain('G7');
    });

    it('should handle arrangement without notes', () => {
      const arrangeNoNotes: Arrangement = {
        ...mockArrangement,
        notes: undefined,
      };

      const options = arrangementToPdfOptions(arrangeNoNotes);

      expect(options.extraNotes).toContain('Time Signature: 4/4');
      expect(options.extraNotes).not.toContain('Test notes');
    });

    it('should use default title for untitled arrangement', () => {
      const arrangeUntitled: Arrangement = {
        ...mockArrangement,
        title: '',
      };

      const options = arrangementToPdfOptions(arrangeUntitled);

      expect(options.title).toBe('Untitled Arrangement');
    });
  });

  describe('getArrangementMidiEvents', () => {
    const mockArrangement: Arrangement = {
      id: 'test-id',
      shareId: 'share-id',
      userId: 'user-id',
      title: 'Test Arrangement',
      timeline: {
        stepsPerBar: 12,
        loopLengthBars: 2,
        totalSteps: 24,
        events: [
          {
            padKey: 'pad-1',
            chord: 'Cmaj7',
            source: 'test',
            leftHand: ['C2', 'E2', 'G2'],
            rightHand: ['C4', 'E4', 'G4'],
            stepIndex: 0,
          },
          {
            padKey: 'pad-2',
            chord: 'G7',
            source: 'test',
            leftHand: ['G2', 'B2', 'D3'],
            rightHand: ['G4', 'B4', 'D5'],
            stepIndex: 12,
          },
        ],
      },
      playbackSnapshot: {
        tempoBpm: 120,
        timeSignature: '4/4',
        padPattern: 'single',
        playbackStyle: 'block',
        instrument: 'piano',
        octaveShift: 0,
        attack: 5,
        decay: 100,
        padVelocity: 84,
        humanize: 0,
        gate: 95,
        inversionRegister: 'off',
      },
      notes: undefined,
      tags: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate MIDI events from arrangement', () => {
      const midiEvents = getArrangementMidiEvents(mockArrangement);

      expect(midiEvents.length).toBeGreaterThan(0);
      expect(midiEvents[0]).toHaveProperty('midi');
      expect(midiEvents[0]).toHaveProperty('startTick');
      expect(midiEvents[0]).toHaveProperty('durationTicks');
    });

    it('should have MIDI numbers in valid range', () => {
      const midiEvents = getArrangementMidiEvents(mockArrangement);

      midiEvents.forEach((event) => {
        event.midi.forEach((note) => {
          expect(note).toBeGreaterThanOrEqual(0);
          expect(note).toBeLessThanOrEqual(127);
        });
      });
    });

    it('should handle empty arrangement timeline', () => {
      const emptyArrange: Arrangement = {
        ...mockArrangement,
        timeline: {
          stepsPerBar: 12,
          loopLengthBars: 1,
          totalSteps: 12,
          events: [],
        },
      };

      const midiEvents = getArrangementMidiEvents(emptyArrange);

      expect(midiEvents).toHaveLength(0);
    });

    it('uses explicit durationSteps when present', () => {
      const durationArrangement: Arrangement = {
        ...mockArrangement,
        timeline: {
          ...mockArrangement.timeline,
          events: [
            {
              ...mockArrangement.timeline.events[0],
              stepIndex: 0,
              durationSteps: 1,
            },
            {
              ...mockArrangement.timeline.events[1],
              stepIndex: 8,
              durationSteps: 6,
            },
          ],
        },
      };

      const midiEvents = getArrangementMidiEvents(durationArrangement);
      expect(midiEvents).toHaveLength(2);
      expect(midiEvents[0]?.durationTicks).toBe(480);
      expect(midiEvents[1]?.durationTicks).toBe(720);
    });
  });

  describe('buildArrangementMidiBytes', () => {
    const mockArrangement: Arrangement = {
      id: 'test-id',
      shareId: 'share-id',
      userId: 'user-id',
      title: 'Test Arrangement',
      timeline: {
        stepsPerBar: 12,
        loopLengthBars: 1,
        totalSteps: 12,
        events: [
          {
            padKey: 'pad-1',
            chord: 'Cmaj7',
            source: 'test',
            leftHand: ['C2'],
            rightHand: ['C4'],
            stepIndex: 0,
          },
        ],
      },
      playbackSnapshot: {
        tempoBpm: 120,
        timeSignature: '4/4',
        padPattern: 'single',
        playbackStyle: 'block',
        instrument: 'piano',
        octaveShift: 0,
        attack: 5,
        decay: 100,
        padVelocity: 84,
        humanize: 0,
        gate: 95,
        inversionRegister: 'off',
      },
      notes: undefined,
      tags: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate valid MIDI bytes', () => {
      const bytes = buildArrangementMidiBytes(mockArrangement);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    it('should start with MIDI header identifier', () => {
      const bytes = buildArrangementMidiBytes(mockArrangement);

      // MIDI file starts with "MThd"
      expect(bytes[0]).toBe(0x4d); // M
      expect(bytes[1]).toBe(0x54); // T
      expect(bytes[2]).toBe(0x68); // h
      expect(bytes[3]).toBe(0x64); // d
    });

    it('should handle arrangements without events', () => {
      const emptyArrange: Arrangement = {
        ...mockArrangement,
        timeline: {
          stepsPerBar: 12,
          loopLengthBars: 1,
          totalSteps: 12,
          events: [],
        },
      };

      const bytes = buildArrangementMidiBytes(emptyArrange);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });
  });
});
