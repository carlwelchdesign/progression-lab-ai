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
        { eventType: 'auth_modal_opened', _count: { _all: 10 } },
        { eventType: 'auth_completed', _count: { _all: 7 } },
        { eventType: 'upgrade_intent', _count: { _all: 4 } },
        { eventType: 'upgrade_completed', _count: { _all: 2 } },
      ])
      .mockResolvedValueOnce([{ sessionId: 'session-1' }, { sessionId: 'session-2' }]);
    mockFindMany
      .mockResolvedValueOnce([
        {
          id: 'evt-1',
          eventType: 'auth_completed',
          sessionId: 'session-1',
          createdAt: new Date('2026-03-31T00:00:00.000Z'),
          properties: { mode: 'register', locale: 'en-US' },
        },
      ])
      .mockResolvedValueOnce([
        { eventType: 'page_view', properties: { locale: 'en-US', persona: 'beginner' } },
        {
          eventType: 'auth_modal_opened',
          properties: { locale: 'en-US', persona: 'beginner' },
        },
        { eventType: 'auth_completed', properties: { locale: 'en-US', persona: 'beginner' } },
        { eventType: 'upgrade_intent', properties: { locale: 'fr-FR', persona: 'pro' } },
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
    expect(body.rangeMode).toBe('lookback');
    expect(body.totals).toEqual({
      totalEvents: 42,
      uniqueSessions: 2,
      conversionEvents: 13,
    });
    expect(body.eventsByType).toEqual([
      { eventType: 'page_view', count: 20 },
      { eventType: 'auth_modal_opened', count: 10 },
      { eventType: 'auth_completed', count: 7 },
      { eventType: 'upgrade_intent', count: 4 },
      { eventType: 'upgrade_completed', count: 2 },
    ]);
    expect(body.funnel).toEqual({
      pageViews: 20,
      authStarted: 10,
      authCompleted: 7,
      upgradeIntent: 4,
      upgradeCompleted: 2,
      authStartRateFromViews: 50,
      authCompletionRateFromStarts: 70,
      upgradeIntentRateFromAuthCompletion: 57.1,
      upgradeCompletionRateFromIntent: 50,
    });
    expect(body.breakdownByLocale).toEqual([
      {
        key: 'en-US',
        pageViews: 1,
        authStarted: 1,
        authCompleted: 1,
        upgradeIntent: 0,
        upgradeCompleted: 0,
        authStartRateFromViews: 100,
        authCompletionRateFromStarts: 100,
        upgradeIntentRateFromAuthCompletion: 0,
        upgradeCompletionRateFromIntent: 0,
      },
      {
        key: 'fr-FR',
        pageViews: 0,
        authStarted: 0,
        authCompleted: 0,
        upgradeIntent: 1,
        upgradeCompleted: 0,
        authStartRateFromViews: 0,
        authCompletionRateFromStarts: 0,
        upgradeIntentRateFromAuthCompletion: 0,
        upgradeCompletionRateFromIntent: 0,
      },
    ]);
    expect(body.breakdownByPersona).toEqual([
      {
        key: 'beginner',
        pageViews: 1,
        authStarted: 1,
        authCompleted: 1,
        upgradeIntent: 0,
        upgradeCompleted: 0,
        authStartRateFromViews: 100,
        authCompletionRateFromStarts: 100,
        upgradeIntentRateFromAuthCompletion: 0,
        upgradeCompletionRateFromIntent: 0,
      },
      {
        key: 'pro',
        pageViews: 0,
        authStarted: 0,
        authCompleted: 0,
        upgradeIntent: 1,
        upgradeCompleted: 0,
        authStartRateFromViews: 0,
        authCompletionRateFromStarts: 0,
        upgradeIntentRateFromAuthCompletion: 0,
        upgradeCompletionRateFromIntent: 0,
      },
    ]);
    expect(body.recentEvents).toHaveLength(1);
  });

  it('supports custom date range params', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/analytics/summary?startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-10T00:00:00.000Z',
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rangeMode).toBe('custom');
    expect(body.days).toBe(9);
  });
});
