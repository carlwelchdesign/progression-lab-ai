import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = (await request.json()) as { events?: Array<Record<string, unknown>> };
    const events = data.events ?? [];

    // Log events for now; in production, this would write to an analytics backend
    // (Amplitude, Mixpanel, Segment, Sentry, etc.)
    if (events.length > 0) {
      console.log(`[Analytics] Received ${events.length} events`, {
        // In production, you'd structure this for your analytics backend
        timestamp: new Date().toISOString(),
        eventCount: events.length,
        firstEvent: events[0]?.eventType,
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch {
    // Silently ignore analytics errors
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
