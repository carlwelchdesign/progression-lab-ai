/** @jest-environment node */

import { NextResponse } from 'next/server';

var mockGetSessionFromRequest = jest.fn();
var mockCheckCsrfToken = jest.fn();
var mockProgressionCreate = jest.fn();
var mockProgressionCount = jest.fn();
var mockArrangementCount = jest.fn();
var mockGetAccessContextForSession = jest.fn();

jest.mock('../../../../lib/auth', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSessionFromRequest(...args),
}));

jest.mock('../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../lib/entitlements', () => ({
  getAccessContextForSession: (...args: unknown[]) => mockGetAccessContextForSession(...args),
  hasReachedLimit: () => false,
}));

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    progression: {
      create: (...args: unknown[]) => mockProgressionCreate(...args),
      count: (...args: unknown[]) => mockProgressionCount(...args),
    },
    arrangement: {
      count: (...args: unknown[]) => mockArrangementCount(...args),
    },
  },
}));

import { POST } from '../route';

describe('POST /api/progressions', () => {
  beforeEach(() => {
    mockGetSessionFromRequest.mockReset();
    mockCheckCsrfToken.mockReset();
    mockProgressionCreate.mockReset();
    mockProgressionCount.mockReset();
    mockArrangementCount.mockReset();
    mockGetAccessContextForSession.mockReset();
    console.error = jest.fn();

    // Default: authenticated user with full entitlements
    mockGetAccessContextForSession.mockResolvedValue({
      plan: 'pro',
      entitlements: {
        maxSavedProgressions: null,
        canSharePublicly: true,
      },
    });
    mockProgressionCount.mockResolvedValue(0);
    mockArrangementCount.mockResolvedValue(0);
  });

  it('returns 403 when the CSRF token is missing', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST({} as never);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'CSRF token validation failed' });
    expect(mockGetSessionFromRequest).not.toHaveBeenCalled();
    expect(mockProgressionCreate).not.toHaveBeenCalled();
  });

  it('does not leak raw errors on persistence failures', async () => {
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetSessionFromRequest.mockReturnValue({ userId: 'user-1' });
    mockProgressionCreate.mockRejectedValue(new Error('database exploded'));

    const response = await POST({
      json: async () => ({ title: 'Test', chords: ['Cmaj7'] }),
    } as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ message: 'Failed to save progression' });
    expect('error' in body).toBe(false);
  });

  it('derives progression metadata from generator snapshot when title and chords are omitted', async () => {
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetSessionFromRequest.mockReturnValue({ userId: 'user-1' });
    mockProgressionCreate.mockResolvedValue({ id: 'progression-1' });

    const response = await POST({
      json: async () => ({
        generatorSnapshot: {
          formData: {
            seedChords: 'Cmaj7, Am7',
            mood: 'warm',
            mode: 'ionian',
            customMode: '',
            genre: 'jazz',
            customGenre: '',
            styleReference: '',
            adventurousness: 'balanced',
            tempoBpm: 100,
          },
          data: {
            inputSummary: {
              seedChords: ['Cmaj7', 'Am7'],
              mood: 'warm',
              mode: 'ionian',
              genre: 'jazz',
              styleReference: null,
              instrument: 'both',
              adventurousness: 'balanced',
              language: 'en',
            },
            nextChordSuggestions: [],
            progressionIdeas: [
              {
                label: 'Lift and Resolve',
                chords: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
                feel: 'Warm and flowing',
                performanceTip: null,
                pianoVoicings: [],
              },
            ],
            structureSuggestions: [],
          },
        },
      }),
    } as never);

    expect(response.status).toBe(201);
    expect(mockProgressionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Lift and Resolve',
          chords: [
            { name: 'Cmaj7', beats: 1 },
            { name: 'Am7', beats: 1 },
            { name: 'Dm7', beats: 1 },
            { name: 'G7', beats: 1 },
          ],
          feel: 'Warm and flowing',
          scale: 'ionian',
          genre: 'jazz',
          userId: 'user-1',
        }),
      }),
    );
  });
});
