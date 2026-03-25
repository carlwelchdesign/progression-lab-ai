import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import GroupedAutocompleteField from './GroupedAutocompleteField';

const CHORD_OPTIONS = [
  'Cmaj7',
  'Dm7',
  'Em7',
  'Fmaj7',
  'G7',
  'Am7',
  'Bm7b5',
  'Amaj7',
  'Bm7',
  'C#m7',
  'Dmaj7',
  'E7',
  'F#m7',
  'G#m7b5',
];

const GROUP_BY_KEY: Record<string, string> = {
  Cmaj7: 'C major',
  Dm7: 'C major',
  Em7: 'C major',
  Fmaj7: 'C major',
  G7: 'C major',
  Am7: 'C major',
  Bm7b5: 'C major',
  Amaj7: 'A major',
  Bm7: 'A major',
  'C#m7': 'A major',
  Dmaj7: 'A major',
  E7: 'A major',
  'F#m7': 'A major',
  'G#m7b5': 'A major',
};

const meta: Meta<typeof GroupedAutocompleteField> = {
  title: 'UI/GroupedAutocompleteField',
  component: GroupedAutocompleteField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    freeSolo: { control: 'boolean' },
  },
  args: {
    onChange: fn(),
    options: CHORD_OPTIONS,
  },
};

export default meta;
type Story = StoryObj<typeof GroupedAutocompleteField>;

export const Default: Story = {
  args: {
    label: 'Chord',
    value: '',
    placeholder: 'Search chords…',
  },
};

export const WithGrouping: Story = {
  args: {
    label: 'Chord',
    value: '',
    placeholder: 'Search chords…',
    groupByName: GROUP_BY_KEY,
    helperText: 'Options are grouped by key.',
  },
};

export const FreeSolo: Story = {
  args: {
    label: 'Custom chord',
    value: '',
    placeholder: 'Type any chord…',
    freeSolo: true,
    helperText: 'Type or select a chord name.',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Chord',
    value: 'Dm7',
  },
};

export const Error: Story = {
  args: {
    label: 'Chord',
    value: '',
    error: true,
    helperText: 'Please select a chord.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Chord',
    value: 'Cmaj7',
    disabled: true,
  },
};
