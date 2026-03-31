/** @jest-environment node */

var mockGetSessionFromRequest = jest.fn();
var mockGetAccessContextForSession = jest.fn();
var mockProgressionFindFirst = jest.fn();
var mockBuildSessionPdfBytes = jest.fn();

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

jest.mock('../../../../../../../lib/pdf', () => ({
  buildSessionPdfBytes: (...args: unknown[]) => mockBuildSessionPdfBytes(...args),
}));

import { NextRequest } from 'next/server';
import { GET } from '../route';

const makeRequest = () =>
  new NextRequest('http://localhost/api/progressions/prog-1/export/pdf', {
    method: 'GET',
  });

const makeParams = (id = 'prog-1') =>
  ({ params: Promise.resolve({ id }) }) as { params: Promise<{ id: string }> };

const FAKE_SESSION = { userId: 'user-1' };

const ENTITLED_CONTEXT = {
  entitlements: { canExportPdf: true },
};

const PROGRESSION = {
  id: 'prog-1',
  title: 'My Jazz Suite',
  chords: [{ name: 'Cmaj7' }, { name: 'Fmaj7' }],
  pianoVoicings: null,
  feel: null,
  scale: 'C Major',
  genre: 'Jazz',
  notes: null,
};

describe('GET /api/progressions/[id]/export/pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockGetSessionFromRequest.mockReturnValue(FAKE_SESSION);
    mockGetAccessContextForSession.mockResolvedValue(ENTITLED_CONTEXT);
    mockProgressionFindFirst.mockResolvedValue(PROGRESSION);
    mockBuildSessionPdfBytes.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
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

  it('returns 403 when user lacks canExportPdf entitlement', async () => {
    mockGetAccessContextForSession.mockResolvedValue({
      entitlements: { canExportPdf: false },
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

  it('returns PDF bytes with correct headers on success', async () => {
    const fakeBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    mockBuildSessionPdfBytes.mockResolvedValue(fakeBytes);

    const res = await GET(makeRequest(), makeParams());

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('.pdf');
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    // buildSessionPdfBytes called with PdfChartOptions derived from progression
    expect(mockBuildSessionPdfBytes).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Jazz Suite', scale: 'C Major' }),
    );
  });

  it('returns 500 on unexpected error', async () => {
    mockProgressionFindFirst.mockRejectedValue(new Error('db crash'));
    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(500);
  });
});
