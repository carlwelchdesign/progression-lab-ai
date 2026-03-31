/** @jest-environment node */

var mockGetSessionFromRequest = jest.fn();
var mockGetAccessContextForSession = jest.fn();
var mockProgressionFindFirst = jest.fn();
var mockBuildProgressionMidiBytes = jest.fn();

jest.mock('../../../../../../../lib/auth', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSessionFromRequest(...args),
}));

jest.mock('../../../../../../../lib/entitlements', () => ({
  getAccessContextForSession: (...args: unknown[]) =>
    mockGetAccessContextForSession(...args),
}));

jest.mock('../../../../../../../lib/prisma', () => ({
  prisma: {
    progression: {
      findFirst: (...args: unknown[]) => mockProgressionFindFirst(...args),
    },
  },
}));

jest.mock('../../../../../../../lib/midi', () => ({
  buildProgressionMidiBytes: (...args: unknown[]) => mockBuildProgressionMidiBytes(...args),
}));

// progressionDownloadUtils is pure — no mock needed.

import { NextRequest } from 'next/server';
import { GET } from '../route';

const makeRequest = () =>
  new NextRequest('http://localhost/api/progressions/prog-1/export/midi', {
    method: 'GET',
  });

const makeParams = (id = 'prog-1') =>
  ({ params: Promise.resolve({ id }) }) as { params: Promise<{ id: string }> };

const FAKE_SESSION = { userId: 'user-1' };

const ENTITLED_CONTEXT = {
  entitlements: { canExportMidi: true },
};

const PROGRESSION = {
  id: 'prog-1',
  title: 'My Jazz Suite',
  pianoVoicings: [
    { leftHand: ['C3', 'E3'], rightHand: ['G3', 'B3'] },
  ],
};

describe('GET /api/progressions/[id]/export/midi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockGetSessionFromRequest.mockReturnValue(FAKE_SESSION);
    mockGetAccessContextForSession.mockResolvedValue(ENTITLED_CONTEXT);
    mockProgressionFindFirst.mockResolvedValue(PROGRESSION);
    mockBuildProgressionMidiBytes.mockReturnValue(new Uint8Array([0x4d, 0x54]));
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSessionFromRequest.mockReturnValue(null);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it('returns 401 when access context is null', async () => {
    mockGetAccessContextForSession.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it('returns 403 when user lacks canExportMidi entitlement', async () => {
    mockGetAccessContextForSession.mockResolvedValue({
      entitlements: { canExportMidi: false },
    });
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(403);
    const body = await res.json() as { message: string };
    expect(body.message).toMatch(/Composer or Studio/);
  });

  it('returns 404 when progression is not found', async () => {
    mockProgressionFindFirst.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  it('returns 422 when progression has no voicings', async () => {
    mockProgressionFindFirst.mockResolvedValue({
      ...PROGRESSION,
      pianoVoicings: [],
    });
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(422);
  });

  it('returns MIDI bytes with correct headers on success', async () => {
    const fakeBytes = new Uint8Array([0x4d, 0x54, 0x68, 0x64]);
    mockBuildProgressionMidiBytes.mockReturnValue(fakeBytes);

    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/midi');
    expect(res.headers.get('Content-Disposition')).toContain('.mid');
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    expect(mockBuildProgressionMidiBytes).toHaveBeenCalledWith(
      PROGRESSION.title,
      PROGRESSION.pianoVoicings,
      100,
    );
  });

  it('returns 500 on unexpected error', async () => {
    mockProgressionFindFirst.mockRejectedValue(new Error('db crash'));
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(500);
  });
});
