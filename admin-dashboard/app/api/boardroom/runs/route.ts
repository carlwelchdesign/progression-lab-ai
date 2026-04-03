import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { prisma } from '../../../../lib/prisma';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizePositiveInt(rawValue: string | null, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can retrieve AI Boardroom runs' },
        { status: 403 },
      );
    }

    const page = normalizePositiveInt(request.nextUrl.searchParams.get('page'), 1);
    const pageSize = Math.min(
      normalizePositiveInt(request.nextUrl.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    const where = { adminUserId: adminUser.id };

    const [total, rows] = await Promise.all([
      prisma.boardroomRun.count({ where }),
      prisma.boardroomRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          question: true,
          decision: true,
          createdAt: true,
          durationMs: true,
        },
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      pageSize,
      items: rows,
    });
  } catch (error) {
    console.error('Failed to list AI Boardroom runs:', error);
    return NextResponse.json({ message: 'Failed to list AI Boardroom runs' }, { status: 500 });
  }
}
