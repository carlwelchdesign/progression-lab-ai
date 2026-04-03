import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_BOARDROOM_BOARD_CREATED,
  recordBoardroomBoardAuditLog,
} from '../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { createBoardroomBoard, listBoardroomBoards } from '../../../../lib/boardroom/boards';
import { BOARDROOM_PERSONA_SUGGESTIONS } from '../../../../lib/boardroom/personaSuggestions';
import { toBoardroomError } from '../../../../lib/boardroom/errors';
import { parseBoardroomBoardInput } from '../../../../lib/boardroom/validation';
import { checkCsrfToken } from '../../../../lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const items = await listBoardroomBoards();
    return NextResponse.json({
      items,
      suggestions: BOARDROOM_PERSONA_SUGGESTIONS,
    });
  } catch (error) {
    console.error('Failed to list AI Boardroom boards:', error);
    return NextResponse.json({ message: 'Failed to list AI Boardroom boards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const item = await createBoardroomBoard(parsed);

    try {
      await recordBoardroomBoardAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_BOARDROOM_BOARD_CREATED,
        targetId: item.id ?? 'unknown',
        metadata: {
          boardName: item.name,
          isDefault: item.isDefault === true,
          memberCount: item.members.length,
        },
      });
    } catch (auditError) {
      console.error('Failed to record board creation audit log:', auditError);
    }

    return NextResponse.json({ item }, { status: 201 });
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
