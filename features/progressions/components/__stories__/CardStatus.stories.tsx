import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

import CardStatus from '../CardStatus';

const meta: Meta<typeof CardStatus> = {
  title: 'Progressions/CardStatus',
  component: CardStatus,
  tags: ['autodocs'],
  argTypes: {
    primary: { control: 'text' },
    secondary: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof CardStatus>;

export const PublicWithDate: Story = {
  name: 'Public with date',
  args: {
    primary: '🌍 Public',
    secondary: new Date('2026-01-15').toLocaleDateString(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/🌍 Public/)).toBeInTheDocument();
  },
};

export const PrivateWithDate: Story = {
  name: 'Private with date',
  args: {
    primary: '🔒 Private',
    secondary: new Date('2026-03-27').toLocaleDateString(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/🔒 Private/)).toBeInTheDocument();
  },
};

export const PrimaryOnly: Story = {
  name: 'Primary only (no secondary)',
  args: {
    primary: '✅ Draft',
    secondary: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/✅ Draft/)).toBeInTheDocument();
  },
};

export const CustomStatus: Story = {
  name: 'Custom status',
  args: {
    primary: '⭐ Featured',
    secondary: 'Trending',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/⭐ Featured/)).toBeInTheDocument();
    await expect(canvas.getByText(/Trending/)).toBeInTheDocument();
  },
};
