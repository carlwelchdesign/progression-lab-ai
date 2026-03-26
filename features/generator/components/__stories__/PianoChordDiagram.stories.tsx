import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import PianoChordDiagram from '../PianoChordDiagram';

const meta: Meta<typeof PianoChordDiagram> = {
  title: 'Generator/PianoChordDiagram',
  component: PianoChordDiagram,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Interactive piano keyboard rendered via `piano-chart`. Left-hand notes are shown together with right-hand notes, all highlighted in the primary theme color.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PianoChordDiagram>;

export const CMajor7: Story = {
  name: 'Cmaj7',
  args: {
    leftHand: ['C3', 'G3'],
    rightHand: ['E4', 'G4', 'B4', 'C5'],
  },
};

export const Am7: Story = {
  name: 'Am7',
  args: {
    leftHand: ['A2', 'E3'],
    rightHand: ['C4', 'E4', 'G4', 'A4'],
  },
};

export const Dm7: Story = {
  name: 'Dm7',
  args: {
    leftHand: ['D3', 'A3'],
    rightHand: ['F4', 'A4', 'C5'],
  },
};

export const G7: Story = {
  name: 'G7',
  args: {
    leftHand: ['G2', 'D3'],
    rightHand: ['F4', 'G4', 'B4', 'D5'],
  },
};
