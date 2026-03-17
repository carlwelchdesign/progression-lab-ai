import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const progression = await prisma.progression.findFirst({
      where: {
        shareId: params.shareId,
        isPublic: true,
      },
    });

    if (!progression) {
      return NextResponse.json(
        { message: 'Shared progression not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(progression);
  } catch (error) {
    console.error('Failed to fetch shared progression:', error);
    return NextResponse.json(
      { message: 'Failed to fetch shared progression', error },
      { status: 500 }
    );
  }
}
