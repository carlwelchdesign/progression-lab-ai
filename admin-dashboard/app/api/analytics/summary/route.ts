import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { prisma } from '../../../../lib/prisma';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const RECENT_LIMIT = 50;

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

    const [totalEvents, eventsByTypeRows, recentEvents, sessionGroups] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          createdAt: {
            gte: since,
          },
        },
      }),
      prisma.analyticsEvent.groupBy({
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
      }),
      prisma.analyticsEvent.findMany({
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
      }),
      prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          createdAt: {
            gte: since,
          },
          sessionId: {
            not: null,
          },
        },
      }),
    ]);

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
