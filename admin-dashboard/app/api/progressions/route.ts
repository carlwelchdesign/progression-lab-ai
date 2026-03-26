import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest, maskEmail } from '../../../lib/adminAccess';
import { prisma } from '../../../lib/prisma';

const DEFAULT_PAGE_SIZE = 25;
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

    const page = normalizePositiveInt(request.nextUrl.searchParams.get('page'), 1);
    const pageSize = Math.min(
      normalizePositiveInt(request.nextUrl.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    const [total, rows] = await Promise.all([
      prisma.progression.count(),
      prisma.progression.findMany({
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          genre: true,
          tags: true,
          isPublic: true,
          updatedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      role: adminUser.role,
      total,
      page,
      pageSize,
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        genre: row.genre,
        tags: row.tags,
        isPublic: row.isPublic,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        owner: {
          id: row.user.id,
          name: row.user.name,
          email: adminUser.role === 'ADMIN' ? row.user.email : maskEmail(row.user.email),
        },
      })),
    });
  } catch (error) {
    console.error('Failed to list progressions:', error);
    return NextResponse.json({ message: 'Failed to list progressions' }, { status: 500 });
  }
}
