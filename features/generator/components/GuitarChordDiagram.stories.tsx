import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import GuitarChordDiagram from './GuitarChordDiagram';

const meta: Meta<typeof GuitarChordDiagram> = {
  title: 'Generator/GuitarChordDiagram',
  component: GuitarChordDiagram,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    position: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof GuitarChordDiagram>;

export const CMajor: Story = {
  args: {
    title: 'C',
    fingers: [
      [2, 1, '1'],
      [4, 2, '2'],
      [5, 3, '3'],
    ],
    barres: [],
    position: 1,
  },
};

export const GMajor: Story = {
  args: {
    title: 'G',
    fingers: [
      [1, 3, '2'],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 2, '1'],
      [6, 3, '3'],
    ],
    barres: [],
    position: 1,
  },
};

export const Barre: Story = {
  name: 'F Major (barre)',
  args: {
    title: 'F',
    fingers: [
      [1, 1],
      [2, 1],
      [3, 2, '2'],
      [4, 3, '4'],
      [5, 3, '3'],
      [6, 1],
    ],
    barres: [{ fromString: 1, toString: 6, fret: 1 }],
    position: 1,
  },
};

export const HighPosition: Story = {
  name: 'A Major (5th position)',
  args: {
    title: 'A',
    fingers: [
      [1, 5, '1'],
      [2, 7, '3'],
      [3, 7, '4'],
      [4, 6, '2'],
      [5, 5, '1'],
    ],
    barres: [{ fromString: 1, toString: 5, fret: 5 }],
    position: 5,
  },
};
