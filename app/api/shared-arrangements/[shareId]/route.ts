import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/prisma';

/**
 * Fetches a public arrangement by shareId.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const arrangement = await prisma.arrangement.findFirst({
      where: {
        shareId,
        isPublic: true,
      },
    });

    if (!arrangement) {
      return NextResponse.json({ message: 'Shared arrangement not found' }, { status: 404 });
    }

    return NextResponse.json(arrangement);
  } catch (error) {
    console.error('Failed to fetch shared arrangement:', error);
    return NextResponse.json({ message: 'Failed to fetch shared arrangement' }, { status: 500 });
  }
}
