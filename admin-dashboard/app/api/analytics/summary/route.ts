import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { prisma } from '../../../../lib/prisma';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const MAX_CUSTOM_DAYS = 180;
const RECENT_LIMIT = 50;
const FUNNEL_EVENT_TYPES = [
  'page_view',
  'auth_modal_opened',
  'auth_completed',
  'upgrade_intent',
  'upgrade_completed',
] as const;

type EventTypeCountRow = {
  eventType: string;
  _count: {
    _all: number;
  };
};

type SessionGroupRow = {
  sessionId: string | null;
};

type RecentEventRow = {
  id: string;
  eventType: string;
  sessionId: string | null;
  createdAt: Date;
  properties: unknown;
};

type AnalyticsEventModel = {
  count: (args: unknown) => Promise<number>;
  groupBy: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown>;
};

type FunnelEventRow = {
  eventType: string;
  properties: unknown;
};

type AnalyticsWindow = {
  since: Date;
  until: Date;
  days: number;
  mode: 'lookback' | 'custom';
};

function toPercent(part: number, whole: number): number {
  if (whole <= 0) {
    return 0;
  }
  return Math.round((part / whole) * 1000) / 10;
}

function parseDays(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_DAYS;
  }
  return Math.min(parsed, MAX_DAYS);
}

function parseDateParam(raw: string | null): Date | null {
  if (!raw) {
    return null;
  }
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseWindow(request: NextRequest): AnalyticsWindow {
  const startDate = parseDateParam(request.nextUrl.searchParams.get('startDate'));
  const endDate = parseDateParam(request.nextUrl.searchParams.get('endDate'));

  if (startDate && endDate && startDate <= endDate) {
    const cappedEnd = new Date(Math.min(endDate.getTime(), Date.now()));
    const maxSpanMs = MAX_CUSTOM_DAYS * 24 * 60 * 60 * 1000;
    const sinceMs = Math.max(startDate.getTime(), cappedEnd.getTime() - maxSpanMs);
    const since = new Date(sinceMs);
    const until = cappedEnd;
    const days = Math.max(
      1,
      Math.ceil((until.getTime() - since.getTime()) / (24 * 60 * 60 * 1000)),
    );
    return { since, until, days, mode: 'custom' };
  }

  const days = parseDays(request.nextUrl.searchParams.get('days'));
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return { since, until, days, mode: 'lookback' };
}

function readStringProperty(properties: unknown, keys: string[]): string | null {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return null;
  }

  const bag = properties as Record<string, unknown>;
  for (const key of keys) {
    const value = bag[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
}

type BreakdownAccumulator = {
  pageViews: number;
  authStarted: number;
  authCompleted: number;
  upgradeIntent: number;
  upgradeCompleted: number;
};

function incrementFunnelCount(accumulator: BreakdownAccumulator, eventType: string): void {
  if (eventType === 'page_view') {
    accumulator.pageViews += 1;
  } else if (eventType === 'auth_modal_opened') {
    accumulator.authStarted += 1;
  } else if (eventType === 'auth_completed') {
    accumulator.authCompleted += 1;
  } else if (eventType === 'upgrade_intent') {
    accumulator.upgradeIntent += 1;
  } else if (eventType === 'upgrade_completed') {
    accumulator.upgradeCompleted += 1;
  }
}

function computeBreakdownRows(
  events: FunnelEventRow[],
  keys: string[],
  fallbackKey: string,
): Array<{
  key: string;
  pageViews: number;
  authStarted: number;
  authCompleted: number;
  upgradeIntent: number;
  upgradeCompleted: number;
  authStartRateFromViews: number;
  authCompletionRateFromStarts: number;
  upgradeIntentRateFromAuthCompletion: number;
  upgradeCompletionRateFromIntent: number;
}> {
  const map = new Map<string, BreakdownAccumulator>();

  for (const event of events) {
    const groupKey = readStringProperty(event.properties, keys) ?? fallbackKey;
    const existing = map.get(groupKey) ?? {
      pageViews: 0,
      authStarted: 0,
      authCompleted: 0,
      upgradeIntent: 0,
      upgradeCompleted: 0,
    };

    incrementFunnelCount(existing, event.eventType);
    map.set(groupKey, existing);
  }

  return Array.from(map.entries())
    .map(([key, item]) => ({
      key,
      pageViews: item.pageViews,
      authStarted: item.authStarted,
      authCompleted: item.authCompleted,
      upgradeIntent: item.upgradeIntent,
      upgradeCompleted: item.upgradeCompleted,
      authStartRateFromViews: toPercent(item.authStarted, item.pageViews),
      authCompletionRateFromStarts: toPercent(item.authCompleted, item.authStarted),
      upgradeIntentRateFromAuthCompletion: toPercent(item.upgradeIntent, item.authCompleted),
      upgradeCompletionRateFromIntent: toPercent(item.upgradeCompleted, item.upgradeIntent),
    }))
    .sort((a, b) => b.pageViews - a.pageViews)
    .slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const window = parseWindow(request);

    // Narrow prisma model access explicitly to avoid stale editor type metadata issues.
    const analyticsEventModel = (prisma as unknown as { analyticsEvent: AnalyticsEventModel })
      .analyticsEvent;

    const [totalEvents, eventsByTypeRows, recentEvents, sessionGroups, funnelEvents] =
      await Promise.all([
        analyticsEventModel.count({
          where: {
            createdAt: {
              gte: window.since,
              lte: window.until,
            },
          },
        }),
        analyticsEventModel.groupBy({
          by: ['eventType'],
          where: {
            createdAt: {
              gte: window.since,
              lte: window.until,
            },
          },
          _count: {
            _all: true,
          },
          orderBy: {
            _count: {
              eventType: 'desc',
            },
          },
        }) as Promise<EventTypeCountRow[]>,
        analyticsEventModel.findMany({
          where: {
            createdAt: {
              gte: window.since,
              lte: window.until,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: RECENT_LIMIT,
          select: {
            id: true,
            eventType: true,
            sessionId: true,
            createdAt: true,
            properties: true,
          },
        }) as Promise<RecentEventRow[]>,
        analyticsEventModel.groupBy({
          by: ['sessionId'],
          where: {
            createdAt: {
              gte: window.since,
              lte: window.until,
            },
            sessionId: {
              not: null,
            },
          },
        }) as Promise<SessionGroupRow[]>,
        analyticsEventModel.findMany({
          where: {
            createdAt: {
              gte: window.since,
              lte: window.until,
            },
            eventType: {
              in: [...FUNNEL_EVENT_TYPES],
            },
          },
          select: {
            eventType: true,
            properties: true,
          },
        }) as Promise<FunnelEventRow[]>,
      ]);

    const eventCountByType = new Map(
      eventsByTypeRows.map((row) => [row.eventType, row._count._all]),
    );

    const pageViews = eventCountByType.get('page_view') ?? 0;
    const authStarted = eventCountByType.get('auth_modal_opened') ?? 0;
    const authCompleted = eventCountByType.get('auth_completed') ?? 0;
    const upgradeIntent = eventCountByType.get('upgrade_intent') ?? 0;
    const upgradeCompleted = eventCountByType.get('upgrade_completed') ?? 0;

    const conversionEventTypes = ['auth_completed', 'upgrade_intent', 'upgrade_completed'];
    const conversionEvents = eventsByTypeRows
      .filter((row) => conversionEventTypes.includes(row.eventType))
      .reduce((acc, row) => acc + row._count._all, 0);

    const breakdownByLocale = computeBreakdownRows(
      funnelEvents,
      ['locale', 'language', 'userLocale'],
      'unknown',
    );
    const breakdownByPersona = computeBreakdownRows(
      funnelEvents,
      ['persona', 'userPersona'],
      'unknown',
    );

    return NextResponse.json({
      days: window.days,
      since: window.since.toISOString(),
      until: window.until.toISOString(),
      rangeMode: window.mode,
      totals: {
        totalEvents,
        uniqueSessions: sessionGroups.length,
        conversionEvents,
      },
      funnel: {
        pageViews,
        authStarted,
        authCompleted,
        upgradeIntent,
        upgradeCompleted,
        authStartRateFromViews: toPercent(authStarted, pageViews),
        authCompletionRateFromStarts: toPercent(authCompleted, authStarted),
        upgradeIntentRateFromAuthCompletion: toPercent(upgradeIntent, authCompleted),
        upgradeCompletionRateFromIntent: toPercent(upgradeCompleted, upgradeIntent),
      },
      breakdownByLocale,
      breakdownByPersona,
      eventsByType: eventsByTypeRows.map((row) => ({
        eventType: row.eventType,
        count: row._count._all,
      })),
      recentEvents: recentEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        sessionId: event.sessionId,
        createdAt: event.createdAt.toISOString(),
        properties: event.properties,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch analytics summary:', error);
    return NextResponse.json({ message: 'Failed to fetch analytics summary' }, { status: 500 });
  }
}
