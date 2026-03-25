import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import ProgressionCard from './ProgressionCard';

const baseProgression = {
  id: '1',
  shareId: 'abc123',
  userId: 'user1',
  title: 'Late Night Jazz',
  chords: [
    { name: 'Cmaj7', beats: 2 },
    { name: 'Am7', beats: 2 },
    { name: 'Dm7', beats: 2 },
    { name: 'G7', beats: 2 },
  ],
  pianoVoicings: [
    { leftHand: ['C3', 'G3'], rightHand: ['E4', 'G4', 'B4', 'C5'] },
    { leftHand: ['A2', 'E3'], rightHand: ['C4', 'E4', 'G4', 'A4'] },
    { leftHand: ['D3', 'A3'], rightHand: ['F4', 'A4', 'C5'] },
    { leftHand: ['G2', 'D3'], rightHand: ['F4', 'G4', 'B4', 'D5'] },
  ],
  feel: 'Moody and introspective',
  scale: 'C Major',
  genre: 'Jazz',
  notes: 'Try a slow ballad feel at around 60 BPM.',
  tags: ['jazz', 'minor', 'late-night'],
  isPublic: true,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

const meta: Meta<typeof ProgressionCard> = {
  title: 'Progressions/ProgressionCard',
  component: ProgressionCard,
  tags: ['autodocs'],
  args: {
    onDelete: fn(),
    onEdit: fn(),
    onOpen: fn(),
    instrument: 'piano',
  },
  argTypes: {
    instrument: { control: 'radio', options: ['piano', 'guitar', 'synth'] },
    canDelete: { control: 'boolean' },
    canEdit: { control: 'boolean' },
    isDeleting: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressionCard>;

export const Default: Story = {
  args: {
    progression: baseProgression,
  },
};

export const NoTags: Story = {
  args: {
    progression: { ...baseProgression, tags: [] },
  },
};

export const ReadOnly: Story = {
  name: 'Read-only (shared view)',
  args: {
    progression: { ...baseProgression, isPublic: true },
    canDelete: false,
    canEdit: false,
  },
};

export const Deleting: Story = {
  name: 'Deleting (loading state)',
  args: {
    progression: baseProgression,
    isDeleting: true,
  },
};

export const Minimal: Story = {
  name: 'Minimal (no optional fields)',
  args: {
    progression: {
      ...baseProgression,
      feel: undefined,
      scale: undefined,
      genre: undefined,
      notes: undefined,
      tags: [],
      pianoVoicings: [],
    },
  },
};
