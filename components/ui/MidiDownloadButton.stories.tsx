import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import MidiDownloadButton from './MidiDownloadButton';

const meta: Meta<typeof MidiDownloadButton> = {
  title: 'UI/MidiDownloadButton',
  component: MidiDownloadButton,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof MidiDownloadButton>;

export const Default: Story = {
  args: {
    label: 'MIDI',
    variant: 'outlined',
  },
};

export const WithVoicings: Story = {
  name: 'Auto-mode (with voicings)',
  args: {
    progressionName: 'My Progression',
    voicings: [
      { leftHand: ['C2', 'G2'], rightHand: ['E4', 'G4', 'C5'] },
      { leftHand: ['G2', 'D3'], rightHand: ['B4', 'D5', 'G5'] },
    ],
    tempoBpm: 120,
    label: 'MIDI',
    variant: 'outlined',
  },
};

export const EmptyVoicings: Story = {
  name: 'Disabled (no voicings)',
  args: {
    progressionName: 'Empty',
    voicings: [],
    label: 'MIDI',
    variant: 'outlined',
  },
};

export const Disabled: Story = {
  args: {
    label: 'MIDI',
    disabled: true,
    variant: 'outlined',
  },
};

export const Contained: Story = {
  args: {
    label: 'Download MIDI',
    variant: 'contained',
    size: 'large',
  },
};
