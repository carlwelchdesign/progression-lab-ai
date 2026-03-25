import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import TextField from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'UI/TextField',
  component: TextField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search'],
    },
  },
  args: {
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: {
    label: 'Label',
    placeholder: 'Enter value…',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    helperText: 'We will never share your email.',
    type: 'email',
  },
};

export const Error: Story = {
  args: {
    label: 'Username',
    value: 'bad value',
    error: true,
    helperText: 'Username is already taken.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Read-only field',
    value: 'Cannot edit this',
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Required field',
    required: true,
    placeholder: 'Must be filled in',
  },
};
