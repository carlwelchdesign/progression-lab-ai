import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import EffectParamSlider from '../EffectParamSlider';

const meta: Meta<typeof EffectParamSlider> = {
  title: 'Generator/EffectParamSlider',
  component: EffectParamSlider,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof EffectParamSlider>;

export const Reverb: Story = {
  args: {
    label: 'Decay',
    valueText: '2.50s',
    value: 2.5,
    min: 0.5,
    max: 10,
    step: 0.1,
    ariaLabel: 'Reverb decay',
  },
};

export const Delay: Story = {
  args: {
    label: 'Feedback',
    valueText: '35%',
    value: 0.35,
    min: 0,
    max: 0.95,
    step: 0.01,
    ariaLabel: 'Delay feedback',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Depth',
    valueText: '50%',
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    ariaLabel: 'Effect depth',
    disabled: true,
  },
};
