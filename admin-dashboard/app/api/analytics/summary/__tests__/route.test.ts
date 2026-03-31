/** @jest-environment node */

import { NextRequest } from 'next/server';

var mockGetAdminUserFromRequest = jest.fn();
var mockCount = jest.fn();
var mockGroupBy = jest.fn();
var mockFindMany = jest.fn();

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/prisma', () => ({
  prisma: {
    analyticsEvent: {
      count: (...args: unknown[]) => mockCount(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { GET } from '../route';

describe('GET /api/analytics/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAdminUserFromRequest.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockCount.mockResolvedValue(42);
    mockGroupBy
      .mockResolvedValueOnce([
        { eventType: 'page_view', _count: { _all: 20 } },
        { eventType: 'auth_completed', _count: { _all: 7 } },
        { eventType: 'upgrade_intent', _count: { _all: 4 } },
      ])
      .mockResolvedValueOnce([{ sessionId: 'session-1' }, { sessionId: 'session-2' }]);
    mockFindMany.mockResolvedValue([
      {
        id: 'evt-1',
        eventType: 'auth_completed',
        sessionId: 'session-1',
        createdAt: new Date('2026-03-31T00:00:00.000Z'),
        properties: { mode: 'register' },
      },
    ]);
  });

  it('returns 403 when user is not authorized', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/analytics/summary'));

    expect(response.status).toBe(403);
  });

  it('returns aggregate analytics summary', async () => {
    const response = await GET(new NextRequest('http://localhost/api/analytics/summary?days=7'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totals).toEqual({
      totalEvents: 42,
      uniqueSessions: 2,
      conversionEvents: 11,
    });
    expect(body.eventsByType).toEqual([
      { eventType: 'page_view', count: 20 },
      { eventType: 'auth_completed', count: 7 },
      { eventType: 'upgrade_intent', count: 4 },
    ]);
    expect(body.recentEvents).toHaveLength(1);
  });
});
