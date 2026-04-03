import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_BOARDROOM_RUN_EXECUTED,
  recordBoardroomRunAuditLog,
} from '../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { resolveBoardroomExecutionBoard } from '../../../../lib/boardroom/boards';
import { BoardroomOrchestrator } from '../../../../lib/boardroom/orchestrator';
import { toBoardroomError } from '../../../../lib/boardroom/errors';
import { parseBoardroomRunRequest } from '../../../../lib/boardroom/validation';
import { checkCsrfToken } from '../../../../lib/csrf';
import { prisma } from '../../../../lib/prisma';

type RunBoardroomRequest = {
  question?: unknown;
  context?: unknown;
  boardId?: unknown;
  boardName?: unknown;
  boardMembers?: unknown;
};

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

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
      return NextResponse.json({ message: 'Only ADMIN can run AI Boardroom' }, { status: 403 });
    }

    const body = (await request.json()) as RunBoardroomRequest;
    const parsed = parseBoardroomRunRequest(body);
    const resolvedBoard = await resolveBoardroomExecutionBoard(parsed);

    const orchestrator = new BoardroomOrchestrator();
    const result = await orchestrator.runWithRequest({
      ...parsed,
      boardId: resolvedBoard.boardId ?? undefined,
      boardName: resolvedBoard.boardName,
      boardMembers: resolvedBoard.boardMembers,
    });
    const durationMs = Date.now() - startedAt;
    const modelClasses = Array.from(
      new Set([...resolvedBoard.boardMembers.map((member) => member.modelClass), 'LARGE']),
    );

    await prisma.boardroomRun.create({
      data: {
        adminUserId: adminUser.id,
        boardId: resolvedBoard.boardId,
        boardName: resolvedBoard.boardName,
        boardSnapshot: resolvedBoard.boardMembers,
        question: parsed.question,
        context: parsed.context,
        decision: result.decision,
        reasoning: result.reasoning,
        keyTradeoffs: result.keyTradeoffs,
        risks: result.risks,
        actionPlan: result.actionPlan,
        dissentingOpinions: result.dissentingOpinions,
        debate: result.debate,
        durationMs,
        modelClasses,
      },
    });

    try {
      await recordBoardroomRunAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_BOARDROOM_RUN_EXECUTED,
        targetId: 'AI_BOARDROOM',
        metadata: {
          boardId: resolvedBoard.boardId,
          boardName: resolvedBoard.boardName,
          questionLength: parsed.question.length,
          usedContext: Boolean(parsed.context),
          memberCount: resolvedBoard.boardMembers.length,
          durationMs,
          modelClasses,
        },
      });
    } catch (auditError) {
      console.error('Failed to record boardroom run audit log:', auditError);
    }

    return NextResponse.json(result);
  } catch (error) {
    const boardroomError = toBoardroomError(error);

    return NextResponse.json(
      {
        message: boardroomError.message,
        code: boardroomError.code,
        details: boardroomError.details,
      },
      {
        status: boardroomError.status,
      },
    );
  }
}
