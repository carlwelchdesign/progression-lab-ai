import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { http, HttpResponse } from 'msw';

import { AuthProvider } from '../../../../components/providers/AuthProvider';
import ProgressionsPageContent from '../ProgressionsPageContent';

const MOCK_PUBLIC_PROGRESSIONS = [
  {
    id: 'pub-1',
    shareId: 'share-public-1',
    userId: 'user-public-1',
    title: 'Neon Skyline',
    chords: [
      { name: 'Cmaj7', beats: 2 },
      { name: 'Am7', beats: 2 },
      { name: 'Fmaj7', beats: 2 },
      { name: 'G7', beats: 2 },
    ],
    pianoVoicings: [
      { leftHand: ['C3', 'G3'], rightHand: ['E4', 'G4', 'B4', 'C5'] },
      { leftHand: ['A2', 'E3'], rightHand: ['C4', 'E4', 'G4', 'A4'] },
      { leftHand: ['F2', 'C3'], rightHand: ['A4', 'C5', 'E5'] },
      { leftHand: ['G2', 'D3'], rightHand: ['F4', 'B4', 'D5'] },
    ],
    feel: 'Dreamy and cinematic',
    scale: 'C Major',
    genre: 'Indie Pop',
    notes: 'Try sidechain-style rhythm for movement.',
    tags: ['dreamy', 'cinematic', 'indie'],
    isPublic: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'pub-2',
    shareId: 'share-public-2',
    userId: 'user-public-2',
    title: 'Sunday House Loop',
    chords: [
      { name: 'Fmaj7', beats: 2 },
      { name: 'G', beats: 2 },
      { name: 'Em7', beats: 2 },
      { name: 'Am7', beats: 2 },
    ],
    pianoVoicings: [],
    feel: 'Uplifting and warm',
    scale: 'F Lydian',
    genre: 'House',
    notes: 'Works well with four-on-the-floor drums.',
    tags: ['house', 'uplifting'],
    isPublic: true,
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  },
];

const MOCK_MY_PROGRESSIONS = [
  {
    id: 'mine-1',
    shareId: 'share-mine-1',
    userId: 'user-auth-1',
    title: 'Late Night Jazz',
    chords: [
      { name: 'Dm7', beats: 2 },
      { name: 'G7', beats: 2 },
      { name: 'Cmaj7', beats: 2 },
      { name: 'A7', beats: 2 },
    ],
    pianoVoicings: [
      { leftHand: ['D3', 'A3'], rightHand: ['F4', 'A4', 'C5'] },
      { leftHand: ['G2', 'D3'], rightHand: ['F4', 'B4', 'D5'] },
      { leftHand: ['C3', 'G3'], rightHand: ['E4', 'G4', 'B4'] },
      { leftHand: ['A2', 'E3'], rightHand: ['G4', 'C#5', 'E5'] },
    ],
    feel: 'Moody and intimate',
    scale: 'C Major',
    genre: 'Jazz',
    notes: 'Use brush kit and low-pass piano.',
    tags: ['jazz', 'late-night'],
    isPublic: false,
    createdAt: '2026-03-03T00:00:00.000Z',
    updatedAt: '2026-03-03T00:00:00.000Z',
  },
];

const meta: Meta<typeof ProgressionsPageContent> = {
  title: 'Progressions/ProgressionsPageContent',
  component: ProgressionsPageContent,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AuthProvider>
        <Story />
      </AuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressionsPageContent>;

export const PublicFeed: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
        ),
        http.get('*/api/progressions', () => HttpResponse.json([])),
        http.get('*/api/shared', () => HttpResponse.json(MOCK_PUBLIC_PROGRESSIONS)),
      ],
    },
  },
};

export const MyProgressions: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/api/auth/me', () =>
          HttpResponse.json({
            user: {
              id: 'user-auth-1',
              email: 'demo@example.com',
              name: 'Demo User',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          }),
        ),
        http.get('*/api/progressions', () => HttpResponse.json(MOCK_MY_PROGRESSIONS)),
        http.get('*/api/shared', () => HttpResponse.json([])),
      ],
    },
  },
};

export const EmptyPublic: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
        ),
        http.get('*/api/progressions', () => HttpResponse.json([])),
        http.get('*/api/shared', () => HttpResponse.json([])),
      ],
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
        ),
        http.get('*/api/progressions', () => HttpResponse.json([])),
        http.get('*/api/shared', () =>
          HttpResponse.json({ message: 'Server unavailable' }, { status: 500 }),
        ),
      ],
    },
  },
};
