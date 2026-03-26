import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import EnvelopeControls from '../EnvelopeControls';

const meta: Meta<typeof EnvelopeControls> = {
  title: 'Generator/EnvelopeControls',
  component: EnvelopeControls,
  tags: ['autodocs'],
  args: {
    attack: 0.05,
    decay: 1.0,
    onAttackChange: fn(),
    onDecayChange: fn(),
  },
  argTypes: {
    attack: { control: { type: 'range', min: 0, max: 0.5, step: 0.01 } },
    decay: { control: { type: 'range', min: 0.1, max: 3, step: 0.1 } },
    direction: {
      control: 'radio',
      options: ['row', 'column'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EnvelopeControls>;

export const Row: Story = {
  args: { direction: 'row' },
};

export const Column: Story = {
  args: { direction: 'column' },
};

export const LongDecay: Story = {
  args: { attack: 0.1, decay: 2.5 },
};
