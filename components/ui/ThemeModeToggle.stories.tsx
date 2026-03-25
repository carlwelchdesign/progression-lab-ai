import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import ThemeModeToggle from './ThemeModeToggle';

const meta: Meta<typeof ThemeModeToggle> = {
  title: 'UI/ThemeModeToggle',
  component: ThemeModeToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Icon button that reads theme mode from `ThemeModeContext` and toggles between light and dark. The global `AppThemeProvider` decorator provides this context.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeModeToggle>;

export const Default: Story = {};
