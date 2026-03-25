import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import PdfDownloadButton from './PdfDownloadButton';

const meta: Meta<typeof PdfDownloadButton> = {
  title: 'UI/PdfDownloadButton',
  component: PdfDownloadButton,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PdfDownloadButton>;

export const Default: Story = {
  args: {
    label: 'PDF',
    variant: 'outlined',
    chartOptions: {
      title: 'My Progression',
      chords: [{ chord: 'Cmaj7' }, { chord: 'Am7' }, { chord: 'Fmaj7' }, { chord: 'G7' }],
      scale: 'C Major',
    },
  },
};

export const Disabled: Story = {
  args: {
    label: 'PDF',
    disabled: true,
    variant: 'outlined',
    chartOptions: {
      title: 'My Progression',
      chords: [],
    },
  },
};

export const Contained: Story = {
  args: {
    label: 'Download PDF',
    variant: 'contained',
    size: 'large',
    chartOptions: {
      title: 'Jazz in C',
      chords: [{ chord: 'Cmaj7' }, { chord: 'Am7' }, { chord: 'Dm7' }, { chord: 'G7' }],
      scale: 'C Major',
      genre: 'Jazz',
      tempoBpm: 120,
    },
  },
};
