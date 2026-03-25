import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import RestoringState from './RestoringState';

const meta: Meta<typeof RestoringState> = {
  title: 'Generator/RestoringState',
  component: RestoringState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Full-page placeholder shown while the previous generator session is being restored from storage.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RestoringState>;

export const Default: Story = {};
