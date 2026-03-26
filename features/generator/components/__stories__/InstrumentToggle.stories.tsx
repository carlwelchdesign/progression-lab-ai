import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import InstrumentToggle from '../InstrumentToggle';

const meta: Meta<typeof InstrumentToggle> = {
  title: 'Generator/InstrumentToggle',
  component: InstrumentToggle,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
  argTypes: {
    value: {
      control: 'radio',
      options: ['piano', 'guitar'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InstrumentToggle>;

export const Piano: Story = {
  args: { value: 'piano' },
};

export const Guitar: Story = {
  args: { value: 'guitar' },
};
