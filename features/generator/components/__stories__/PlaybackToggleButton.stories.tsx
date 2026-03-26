import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import PlaybackToggleButton from '../PlaybackToggleButton';

const meta: Meta<typeof PlaybackToggleButton> = {
  title: 'Generator/PlaybackToggleButton',
  component: PlaybackToggleButton,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
  argTypes: {
    isPlaying: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    playTitle: { control: 'text' },
    stopTitle: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof PlaybackToggleButton>;

export const IconOnly: Story = {
  args: { isPlaying: false },
};

export const IconOnlyPlaying: Story = {
  args: { isPlaying: true },
};

export const WithLabel: Story = {
  args: {
    isPlaying: false,
    label: 'Play',
    playTitle: 'Play progression',
    stopTitle: 'Stop playback',
  },
};

export const WithLabelPlaying: Story = {
  args: {
    isPlaying: true,
    label: 'Stop',
    playTitle: 'Play progression',
    stopTitle: 'Stop playback',
  },
};

export const Disabled: Story = {
  args: {
    isPlaying: false,
    disabled: true,
    label: 'Play',
  },
};
