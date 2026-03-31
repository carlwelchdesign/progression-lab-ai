import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = (await request.json()) as {
      events?: Array<{
        eventType?: unknown;
        properties?: unknown;
        timestamp?: unknown;
      }>;
    };
    const events = Array.isArray(data.events) ? data.events.slice(0, 100) : [];

    const rows = events
      .map((event) => {
        const eventType = typeof event.eventType === 'string' ? event.eventType.trim() : '';
        if (!eventType) {
          return null;
        }

        const properties =
          event.properties &&
          typeof event.properties === 'object' &&
          !Array.isArray(event.properties)
            ? (event.properties as Record<string, unknown>)
            : {};

        const sessionId =
          typeof properties.sessionId === 'string' && properties.sessionId.trim().length > 0
            ? properties.sessionId.trim()
            : null;

        const timestamp =
          typeof event.timestamp === 'number' ? new Date(event.timestamp) : new Date();

        return {
          eventType: eventType.slice(0, 120),
          properties,
          sessionId,
          userId: null,
          createdAt: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    if (rows.length > 0) {
      await prisma.analyticsEvent.createMany({
        data: rows,
      });
    }

    return NextResponse.json({ status: 'ok', ingested: rows.length });
  } catch (error) {
    console.error('Failed to ingest analytics events:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
