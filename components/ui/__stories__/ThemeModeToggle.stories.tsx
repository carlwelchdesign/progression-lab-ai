import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

import ThemeModeToggle from '../ThemeModeToggle';

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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: /switch to (light|dark) mode/i });
    await expect(toggle).toBeInTheDocument();

    const initialLabel = toggle.getAttribute('aria-label');
    await userEvent.click(toggle);
    await expect(toggle).not.toHaveAttribute('aria-label', initialLabel ?? '');
  },
};
