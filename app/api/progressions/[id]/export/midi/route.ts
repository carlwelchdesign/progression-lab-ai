/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../../../lib/auth';
import { getAccessContextForSession } from '../../../../../../lib/entitlements';
import { buildProgressionMidiBytes } from '../../../../../../lib/midi';
import { prisma } from '../../../../../../lib/prisma';
import type { PianoVoicing } from '../../../../../../lib/types';
import { getProgressionFileName } from '../../../../../../features/progressions/utils/progressionDownloadUtils';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const accessContext = await getAccessContextForSession(session);
    if (!accessContext) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!accessContext.entitlements.canExportMidi) {
      return NextResponse.json(
        { message: 'MIDI export requires a Composer or Studio plan' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const progression = await prisma.progression.findFirst({
      where: { id, userId: session.userId },
    });

    if (!progression) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
    }

    const voicings = Array.isArray(progression.pianoVoicings)
      ? (progression.pianoVoicings as unknown as PianoVoicing[])
      : [];

    if (voicings.length === 0) {
      return NextResponse.json(
        { message: 'This progression has no voicings to export' },
        { status: 422 },
      );
    }

    const fileName = `${getProgressionFileName(progression.title)}.mid`;
    const bytes = buildProgressionMidiBytes(progression.title, voicings, 100);

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'audio/midi',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to export MIDI for progression:', error);
    return NextResponse.json({ message: 'Failed to generate MIDI export' }, { status: 500 });
  }
}
