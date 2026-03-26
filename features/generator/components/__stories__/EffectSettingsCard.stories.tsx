import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Typography } from '@mui/material';

import EffectSettingsCard from '../EffectSettingsCard';

const meta: Meta<typeof EffectSettingsCard> = {
  title: 'Generator/EffectSettingsCard',
  component: EffectSettingsCard,
  tags: ['autodocs'],
  args: {
    onEnabledChange: fn(),
    onLevelChange: fn(),
    onAdvancedToggle: fn(),
  },
  argTypes: {
    enabled: { control: 'boolean' },
    advancedOpen: { control: 'boolean' },
    level: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
};

export default meta;
type Story = StoryObj<typeof EffectSettingsCard>;

export const ReverbEnabled: Story = {
  args: {
    title: 'Reverb',
    enabled: true,
    level: 0.4,
    levelAriaLabel: 'Reverb level',
    advancedOpen: false,
  },
};

export const DelayDisabled: Story = {
  args: {
    title: 'Delay',
    enabled: false,
    level: 0.3,
    levelAriaLabel: 'Delay level',
    advancedOpen: false,
  },
};

export const WithAdvancedOpen: Story = {
  args: {
    title: 'Reverb',
    enabled: true,
    level: 0.5,
    levelAriaLabel: 'Reverb level',
    advancedOpen: true,
    children: (
      <Typography variant="caption" color="text.secondary">
        Advanced controls would appear here.
      </Typography>
    ),
  },
};
