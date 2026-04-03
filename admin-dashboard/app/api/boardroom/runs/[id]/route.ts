import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest } from '../../../../../lib/adminAccess';
import { checkCsrfToken } from '../../../../../lib/csrf';
import { prisma } from '../../../../../lib/prisma';

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    const row = await prisma.boardroomRun.findFirst({
      where: {
        id,
        adminUserId: adminUser.id,
      },
      select: {
        id: true,
        question: true,
        context: true,
        decision: true,
        reasoning: true,
        keyTradeoffs: true,
        risks: true,
        actionPlan: true,
        dissentingOpinions: true,
        debate: true,
        durationMs: true,
        modelClasses: true,
        createdAt: true,
      },
    });

    if (!row) {
      return NextResponse.json({ message: 'AI Boardroom run not found' }, { status: 404 });
    }

    return NextResponse.json({
      item: {
        id: row.id,
        question: row.question,
        context: row.context,
        durationMs: row.durationMs,
        modelClasses: row.modelClasses,
        createdAt: row.createdAt,
        result: {
          decision: row.decision,
          reasoning: row.reasoning,
          keyTradeoffs: asStringArray(row.keyTradeoffs),
          risks: asStringArray(row.risks),
          actionPlan: asStringArray(row.actionPlan),
          dissentingOpinions: asStringArray(row.dissentingOpinions),
          debate: row.debate ?? undefined,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch AI Boardroom run:', error);
    return NextResponse.json({ message: 'Failed to fetch AI Boardroom run' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = checkCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can delete AI Boardroom runs' },
        { status: 403 },
      );
    }

    const { id } = await params;

    const result = await prisma.boardroomRun.deleteMany({
      where: {
        id,
        adminUserId: adminUser.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'AI Boardroom run not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete AI Boardroom run:', error);
    return NextResponse.json({ message: 'Failed to delete AI Boardroom run' }, { status: 500 });
  }
}
