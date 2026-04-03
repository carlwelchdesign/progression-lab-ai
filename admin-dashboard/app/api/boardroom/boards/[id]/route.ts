import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_BOARDROOM_BOARD_DELETED,
  AUDIT_ACTION_BOARDROOM_BOARD_UPDATED,
  recordBoardroomBoardAuditLog,
} from '../../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../../lib/adminAccess';
import {
  deleteBoardroomBoard,
  getBoardroomBoardById,
  updateBoardroomBoard,
} from '../../../../../lib/boardroom/boards';
import { toBoardroomError } from '../../../../../lib/boardroom/errors';
import { parseBoardroomBoardInput } from '../../../../../lib/boardroom/validation';
import { checkCsrfToken } from '../../../../../lib/csrf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const item = await getBoardroomBoardById(id);
    if (!item) {
      return NextResponse.json({ message: 'AI Boardroom board not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to fetch AI Boardroom board:', error);
    return NextResponse.json({ message: 'Failed to fetch AI Boardroom board' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfError = checkCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = parseBoardroomBoardInput(body);
    const { id } = await params;
    const item = await updateBoardroomBoard(id, parsed);

    try {
      await recordBoardroomBoardAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_BOARDROOM_BOARD_UPDATED,
        targetId: id,
        metadata: {
          boardName: item.name,
          isDefault: item.isDefault === true,
          memberCount: item.members.length,
        },
      });
    } catch (auditError) {
      console.error('Failed to record board update audit log:', auditError);
    }

    return NextResponse.json({ item });
  } catch (error) {
    const boardroomError = toBoardroomError(error);
    return NextResponse.json(
      {
        message: boardroomError.message,
        code: boardroomError.code,
        details: boardroomError.details,
      },
      { status: boardroomError.status },
    );
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
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await deleteBoardroomBoard(id);
    if (!deleted) {
      return NextResponse.json({ message: 'AI Boardroom board not found' }, { status: 404 });
    }

    try {
      await recordBoardroomBoardAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_BOARDROOM_BOARD_DELETED,
        targetId: id,
      });
    } catch (auditError) {
      console.error('Failed to record board delete audit log:', auditError);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete AI Boardroom board:', error);
    return NextResponse.json({ message: 'Failed to delete AI Boardroom board' }, { status: 500 });
  }
}
