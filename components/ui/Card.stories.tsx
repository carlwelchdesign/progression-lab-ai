import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Typography } from '@mui/material';

import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    noPadding: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: <Typography>Card content goes here.</Typography>,
  },
};

export const NoPadding: Story = {
  args: {
    noPadding: true,
    children: (
      <div style={{ padding: '24px', background: '#333' }}>
        <Typography>Content with no CardContent wrapper — padding is self-controlled.</Typography>
      </div>
    ),
  },
};

export const WithTitle: Story = {
  args: {
    children: (
      <>
        <Typography variant="h6" gutterBottom>
          Card Title
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supporting body text below the title.
        </Typography>
      </>
    ),
  },
};
