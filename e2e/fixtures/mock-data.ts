import type { ChordSuggestionResponse, Progression } from '../../lib/types';

export const generatorResponse: ChordSuggestionResponse = {
  inputSummary: {
    seedChords: ['Fmaj7', 'G7'],
    mood: 'dreamy, uplifting',
    mode: 'lydian',
    genre: 'piano house',
    styleReference: null,
    instrument: 'both',
    adventurousness: 'balanced',
    language: 'en',
  },
  nextChordSuggestions: [
    {
      chord: 'Am7',
      romanNumeral: 'iii7',
      functionExplanation: 'Extends the lift before resolving back into the tonic area.',
      tensionLevel: 3,
      confidence: 4,
      voicingHint: 'Keep the upper voices close for a smooth hand shape.',
      pianoVoicing: {
        leftHand: ['A2', 'E3'],
        rightHand: ['G3', 'C4', 'E4'],
      },
      guitarVoicing: {
        title: 'Am7',
        position: 1,
        fingers: [
          { string: 4, fret: 2, finger: '2' },
          { string: 2, fret: 1, finger: '1' },
        ],
        barres: [],
      },
    },
  ],
  progressionIdeas: [
    {
      label: 'Lifted turnaround',
      chords: ['Fmaj7', 'G7', 'Am7', 'Cmaj7'],
      feel: 'Open and buoyant',
      performanceTip: 'Lean into the back half of each bar.',
      pianoVoicings: [
        { leftHand: ['F2', 'C3'], rightHand: ['E3', 'A3', 'C4', 'F4'] },
        { leftHand: ['G2', 'D3'], rightHand: ['F3', 'B3', 'D4'] },
        { leftHand: ['A2', 'E3'], rightHand: ['G3', 'C4', 'E4'] },
        { leftHand: ['C2', 'G2'], rightHand: ['E3', 'B3', 'D4', 'G4'] },
      ],
    },
  ],
  structureSuggestions: [
    {
      section: 'verse',
      bars: 8,
      harmonicIdea: 'Cycle the turnaround twice, then thin out the voicing on the final bar.',
    },
  ],
};

export const publicProgressions: Progression[] = [
  {
    id: 'public-1',
    shareId: 'share-public-1',
    userId: 'user-1',
    title: 'Skyline Drive',
    chords: [
      { name: 'Fmaj7', beats: 1 },
      { name: 'G7', beats: 1 },
      { name: 'Am7', beats: 1 },
      { name: 'Cmaj7', beats: 1 },
    ],
    pianoVoicings: [
      { leftHand: ['F2', 'C3'], rightHand: ['E3', 'A3', 'C4', 'F4'] },
      { leftHand: ['G2', 'D3'], rightHand: ['F3', 'B3', 'D4'] },
      { leftHand: ['A2', 'E3'], rightHand: ['G3', 'C4', 'E4'] },
      { leftHand: ['C2', 'G2'], rightHand: ['E3', 'B3', 'D4', 'G4'] },
    ],
    feel: 'Warm and cinematic',
    scale: 'lydian',
    genre: 'piano house',
    notes: 'Works well with a syncopated top line.',
    tags: ['cinematic', 'uplifting'],
    isPublic: true,
    createdAt: new Date('2026-03-20T00:00:00.000Z'),
    updatedAt: new Date('2026-03-20T00:00:00.000Z'),
  },
];

export const authenticatedUser = {
  user: {
    id: 'user-1',
    email: 'staff@example.com',
    name: 'Staff User',
    createdAt: '2026-03-20T00:00:00.000Z',
  },
};
