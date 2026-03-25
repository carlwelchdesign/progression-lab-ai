import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import SuccessSnackbar from './SuccessSnackbar';

const meta: Meta<typeof SuccessSnackbar> = {
  title: 'UI/SuccessSnackbar',
  component: SuccessSnackbar,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    message: { control: 'text' },
    autoHideDuration: { control: 'number' },
  },
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof SuccessSnackbar>;

export const Visible: Story = {
  args: {
    open: true,
    message: 'Progression saved successfully!',
  },
};

export const Hidden: Story = {
  args: {
    open: false,
    message: 'Progression saved successfully!',
  },
};

export const CustomMessage: Story = {
  args: {
    open: true,
    message: 'Your changes have been saved.',
    autoHideDuration: 3000,
  },
};
