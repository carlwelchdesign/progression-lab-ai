/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../../../lib/auth';
import { getAccessContextForSession } from '../../../../../../lib/entitlements';
import { buildSessionPdfBytes } from '../../../../../../lib/pdf';
import { prisma } from '../../../../../../lib/prisma';
import { progressionToPdfOptions, getProgressionFileName } from '../../../../../../features/progressions/utils/progressionDownloadUtils';
import type { Progression } from '../../../../../../lib/types';

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

    if (!accessContext.entitlements.canExportPdf) {
      return NextResponse.json(
        { message: 'PDF export requires a Composer or Studio plan' },
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

    const pdfOptions = progressionToPdfOptions(progression as unknown as Progression);
    const bytes = await buildSessionPdfBytes(pdfOptions);
    const fileName = `${getProgressionFileName(progression.title)}_session_chart.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to export PDF for progression:', error);
    return NextResponse.json({ message: 'Failed to generate PDF export' }, { status: 500 });
  }
}
