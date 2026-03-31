import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { prisma } from '../../../../lib/prisma';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const RECENT_LIMIT = 50;

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

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const days = parseDays(request.nextUrl.searchParams.get('days'));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Narrow prisma model access explicitly to avoid stale editor type metadata issues.
    const analyticsEventModel = (prisma as unknown as { analyticsEvent: AnalyticsEventModel })
      .analyticsEvent;

    const [totalEvents, eventsByTypeRows, recentEvents, sessionGroups] = await Promise.all([
      analyticsEventModel.count({
        where: {
          createdAt: {
            gte: since,
          },
        },
      }),
      analyticsEventModel.groupBy({
        by: ['eventType'],
        where: {
          createdAt: {
            gte: since,
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
            gte: since,
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
            gte: since,
          },
          sessionId: {
            not: null,
          },
        },
      }) as Promise<SessionGroupRow[]>,
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

    return NextResponse.json({
      days,
      since: since.toISOString(),
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
