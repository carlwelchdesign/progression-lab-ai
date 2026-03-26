import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mui/material';
import { fn } from 'storybook/test';

import StatusSnackbar from '../StatusSnackbar';

const meta: Meta<typeof StatusSnackbar> = {
  title: 'UI/StatusSnackbar',
  component: StatusSnackbar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box sx={{ minHeight: 180, width: '100%', p: 2 }}>
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    open: { control: 'boolean' },
    message: { control: 'text' },
    severity: {
      control: { type: 'select' },
      options: ['success', 'error', 'warning', 'info'],
    },
    autoHideDuration: { control: 'number' },
  },
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof StatusSnackbar>;

export const Visible: Story = {
  args: {
    open: true,
    message: 'Progression saved successfully!',
    severity: 'success',
  },
};

export const Hidden: Story = {
  args: {
    open: false,
    message: 'Progression saved successfully!',
    severity: 'success',
  },
};

export const CustomMessage: Story = {
  args: {
    open: true,
    message: 'Your changes have been saved.',
    severity: 'success',
    autoHideDuration: 3000,
  },
};

export const ErrorVariant: Story = {
  args: {
    open: true,
    message: 'Something went wrong while saving your progression.',
    severity: 'error',
  },
};

export const InfoVariant: Story = {
  args: {
    open: true,
    message: 'Your session has been refreshed.',
    severity: 'info',
  },
};
