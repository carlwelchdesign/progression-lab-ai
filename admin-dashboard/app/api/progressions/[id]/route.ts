import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest, maskEmail } from '../../../../lib/adminAccess';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const row = await prisma.progression.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        chords: true,
        pianoVoicings: true,
        feel: true,
        scale: true,
        genre: true,
        notes: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!row) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
    }

    return NextResponse.json({
      role: adminUser.role,
      item: {
        id: row.id,
        title: row.title,
        chords: row.chords,
        pianoVoicings: row.pianoVoicings,
        feel: row.feel,
        scale: row.scale,
        genre: row.genre,
        notes: row.notes,
        tags: row.tags,
        isPublic: row.isPublic,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        owner: {
          id: row.user.id,
          name: row.user.name,
          email: adminUser.role === 'ADMIN' ? row.user.email : maskEmail(row.user.email),
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch progression:', error);
    return NextResponse.json({ message: 'Failed to fetch progression' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Only ADMIN can delete records' }, { status: 403 });
    }

    const { id } = await params;
    const result = await prisma.progression.deleteMany({ where: { id } });

    if (result.count === 0) {
      return NextResponse.json({ message: 'Progression not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete progression:', error);
    return NextResponse.json({ message: 'Failed to delete progression' }, { status: 500 });
  }
}
