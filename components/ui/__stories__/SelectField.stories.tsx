import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import SelectField from '../SelectField';

const SCALE_OPTIONS = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'locrian', label: 'Locrian', disabled: true },
];

const meta: Meta<typeof SelectField> = {
  title: 'UI/SelectField',
  component: SelectField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: {
    onChange: fn(),
    options: SCALE_OPTIONS,
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

export const Default: Story = {
  args: {
    label: 'Scale',
    value: 'major',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Scale',
    value: 'dorian',
    helperText: 'Choose the scale for your progression.',
  },
};

export const Error: Story = {
  args: {
    label: 'Scale',
    value: '',
    error: true,
    helperText: 'Please select a scale.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Scale',
    value: 'major',
    disabled: true,
  },
};

export const WithDisabledOption: Story = {
  args: {
    label: 'Scale',
    value: 'major',
    helperText: 'Locrian is disabled as an example.',
  },
};
