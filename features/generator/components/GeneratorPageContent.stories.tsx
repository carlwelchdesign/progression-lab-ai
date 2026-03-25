import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay, http, HttpResponse } from 'msw';

import GeneratorPageContent from './GeneratorPageContent';

const MOCK_SUGGESTIONS_RESPONSE = {
  inputSummary: {
    seedChords: ['Cmaj7', 'Am7'],
    mood: 'dreamy',
    mode: 'ionian',
    genre: 'indie pop',
    styleReference: 'Bill Evans',
    instrument: 'both',
    adventurousness: 'balanced',
  },
  nextChordSuggestions: [
    {
      chord: 'Fmaj7',
      romanNumeral: 'IVmaj7',
      functionExplanation: 'Subdominant color that opens space before dominant motion.',
      tensionLevel: 3,
      confidence: 0.9,
      voicingHint: 'Keep top note common-tone with previous chord.',
      pianoVoicing: {
        leftHand: ['F2', 'C3'],
        rightHand: ['A3', 'C4', 'E4'],
      },
      guitarVoicing: {
        title: 'Fmaj7',
        position: 1,
        fingers: [
          { string: 1, fret: 0, finger: null },
          { string: 2, fret: 1, finger: '1' },
          { string: 3, fret: 2, finger: '2' },
          { string: 4, fret: 3, finger: '4' },
          { string: 5, fret: 3, finger: '3' },
          { string: 6, fret: 1, finger: '1' },
        ],
        barres: [{ fromString: 1, toString: 6, fret: 1, text: null }],
      },
    },
    {
      chord: 'G7',
      romanNumeral: 'V7',
      functionExplanation: 'Dominant pull resolving naturally back to tonic.',
      tensionLevel: 6,
      confidence: 0.86,
      voicingHint: 'Lean into the tritone for stronger cadence.',
      pianoVoicing: {
        leftHand: ['G2', 'D3'],
        rightHand: ['F3', 'B3', 'D4'],
      },
      guitarVoicing: {
        title: 'G7',
        position: 1,
        fingers: [
          { string: 1, fret: 1, finger: '1' },
          { string: 2, fret: 0, finger: null },
          { string: 3, fret: 0, finger: null },
          { string: 4, fret: 0, finger: null },
          { string: 5, fret: 2, finger: '2' },
          { string: 6, fret: 3, finger: '3' },
        ],
        barres: [],
      },
    },
  ],
  progressionIdeas: [
    {
      label: 'Option A',
      chords: ['Cmaj7', 'Am7', 'Fmaj7', 'G7'],
      feel: 'Warm and hopeful',
      performanceTip: 'Use light syncopation in bar 4.',
      pianoVoicings: [
        { leftHand: ['C2', 'G2'], rightHand: ['E3', 'G3', 'B3'] },
        { leftHand: ['A2', 'E3'], rightHand: ['C4', 'E4', 'G4'] },
        { leftHand: ['F2', 'C3'], rightHand: ['A3', 'C4', 'E4'] },
        { leftHand: ['G2', 'D3'], rightHand: ['F3', 'B3', 'D4'] },
      ],
    },
    {
      label: 'Option B',
      chords: ['Cmaj7', 'Em7', 'Fmaj7', 'Gsus4'],
      feel: 'Airy and cinematic',
      performanceTip: 'Let upper voices ring between changes.',
      pianoVoicings: [
        { leftHand: ['C2', 'G2'], rightHand: ['E3', 'B3', 'D4'] },
        { leftHand: ['E2', 'B2'], rightHand: ['G3', 'D4', 'F#4'] },
        { leftHand: ['F2', 'C3'], rightHand: ['A3', 'E4', 'G4'] },
        { leftHand: ['G2', 'D3'], rightHand: ['C4', 'D4', 'G4'] },
      ],
    },
  ],
  structureSuggestions: [
    {
      section: 'verse',
      bars: 8,
      harmonicIdea: 'Keep movement mostly diatonic with one borrowed color chord.',
    },
    {
      section: 'chorus',
      bars: 8,
      harmonicIdea: 'Increase harmonic rhythm to emphasize lift.',
    },
    {
      section: 'bridge',
      bars: 4,
      harmonicIdea: 'Brief modal interchange before returning to tonic.',
    },
  ],
} as const;

const meta: Meta<typeof GeneratorPageContent> = {
  title: 'Generator/GeneratorPageContent',
  component: GeneratorPageContent,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GeneratorPageContent>;

export const Default: Story = {};

export const SubmitSuccess: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('*/api/chord-suggestions', async () => {
          await delay(350);
          return HttpResponse.json(MOCK_SUGGESTIONS_RESPONSE);
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Randomize Inputs' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Generate Ideas' }));

    await waitFor(async () => {
      await expect(canvas.getByText('Next chord suggestions')).resolves.toBeTruthy();
    });
  },
};

export const SubmitLoading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('*/api/chord-suggestions', async () => {
          await delay(2500);
          return HttpResponse.json(MOCK_SUGGESTIONS_RESPONSE);
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Randomize Inputs' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Generate Ideas' }));

    await waitFor(async () => {
      await expect(canvas.getByText('Generating suggestions...')).resolves.toBeTruthy();
    });
  },
};

export const SubmitError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('*/api/chord-suggestions', async () => {
          await delay(250);
          return HttpResponse.json({ message: 'Upstream model timeout' }, { status: 500 });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Randomize Inputs' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Generate Ideas' }));

    await waitFor(async () => {
      await expect(canvas.getByText('Could not generate suggestions.')).resolves.toBeTruthy();
    });
  },
};
