import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import GeneratorHeader from '../GeneratorHeader';

const meta: Meta<typeof GeneratorHeader> = {
  title: 'Generator/GeneratorHeader',
  component: GeneratorHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Top-of-page branding and short generator description.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GeneratorHeader>;

export const Default: Story = {};
