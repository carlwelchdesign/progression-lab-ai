/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

import { BoardroomError } from '../../../../../lib/boardroom/errors';

const mockCheckCsrfToken = jest.fn();
const mockGetAdminUserFromRequest = jest.fn();
const mockRunWithRequest = jest.fn();
const mockRecordBoardroomRunAuditLog = jest.fn();
const mockBoardroomRunCreate = jest.fn();
const mockResolveBoardroomExecutionBoard = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (request: NextRequest) => mockCheckCsrfToken(request),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (request: NextRequest) => mockGetAdminUserFromRequest(request),
}));

jest.mock('../../../../../lib/boardroom/orchestrator', () => ({
  BoardroomOrchestrator: jest.fn().mockImplementation(() => ({
    runWithRequest: (...args: unknown[]) => mockRunWithRequest(...args),
  })),
}));

jest.mock('../../../../../lib/boardroom/boards', () => ({
  resolveBoardroomExecutionBoard: (...args: unknown[]) =>
    mockResolveBoardroomExecutionBoard(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_BOARDROOM_RUN_EXECUTED: 'EXECUTE_BOARDROOM_RUN',
  recordBoardroomRunAuditLog: (args: unknown) => mockRecordBoardroomRunAuditLog(args),
}));

jest.mock('../../../../../lib/prisma', () => ({
  prisma: {
    boardroomRun: {
      create: (...args: unknown[]) => mockBoardroomRunCreate(...args),
    },
  },
}));

import { POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

describe('POST /api/boardroom/run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockRunWithRequest.mockResolvedValue({
      decision: 'Run a staged growth experiment',
      reasoning: 'Balances learning speed with downside control',
      keyTradeoffs: ['Speed vs certainty'],
      risks: ['Attribution lag'],
      actionPlan: ['Define test cohort', 'Launch campaign', 'Review KPIs weekly'],
      dissentingOpinions: ['CFO prefers tighter spend cap'],
      debate: {
        independentSummaries: [],
        critiqueSummaries: [],
        revisionSummaries: [],
      },
    });
    mockResolveBoardroomExecutionBoard.mockResolvedValue({
      boardId: 'board-1',
      boardName: 'Classic Boardroom',
      boardMembers: [
        {
          personaLabel: 'CTO',
          title: 'Chief Technology Officer',
          priorities: ['Delivery feasibility'],
          biases: ['Prefers low uncertainty'],
          modelClass: 'SMALL',
          maxOutputChars: 1400,
          displayOrder: 0,
          isActive: true,
        },
      ],
    });
    mockBoardroomRunCreate.mockResolvedValue({ id: 'run-1' });
    mockRecordBoardroomRunAuditLog.mockResolvedValue(undefined);
  });

  it('returns csrf error response when token check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/boardroom/run', {
        method: 'POST',
        body: JSON.stringify({ question: 'Should we invest in retention?' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockRunWithRequest).not.toHaveBeenCalled();
  });

  it('returns forbidden for unauthenticated users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/boardroom/run', {
        method: 'POST',
        body: JSON.stringify({ question: 'Should we invest in retention?' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockRunWithRequest).not.toHaveBeenCalled();
  });

  it('returns forbidden when role is not ADMIN', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'auditor-1',
      email: 'audit@progressionlab.ai',
      role: 'AUDITOR',
    });

    const response = await POST(
      new NextRequest('http://localhost/api/boardroom/run', {
        method: 'POST',
        body: JSON.stringify({ question: 'Should we invest in retention?' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockRunWithRequest).not.toHaveBeenCalled();
  });

  it('runs orchestrator and returns structured decision payload', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/boardroom/run', {
        method: 'POST',
        body: JSON.stringify({
          question: '  Should we double paid acquisition budget this quarter?  ',
          context: {
            productStage: 'GROWTH',
            goals: ['Increase MRR by 20%'],
          },
        }),
      }),
    );

    const body = (await response.json()) as {
      decision: string;
      actionPlan: string[];
    };

    expect(response.status).toBe(200);
    expect(body.decision).toBe('Run a staged growth experiment');
    expect(body.actionPlan.length).toBeGreaterThan(0);
    expect(mockRunWithRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Should we double paid acquisition budget this quarter?',
        boardId: 'board-1',
        boardName: 'Classic Boardroom',
        boardMembers: expect.any(Array),
        context: expect.objectContaining({
          productStage: 'GROWTH',
          goals: ['Increase MRR by 20%'],
        }),
      }),
    );
    expect(mockBoardroomRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminUserId: 'admin-1',
          boardId: 'board-1',
          boardName: 'Classic Boardroom',
          boardSnapshot: expect.any(Array),
          question: 'Should we double paid acquisition budget this quarter?',
          decision: 'Run a staged growth experiment',
        }),
      }),
    );
    expect(mockRecordBoardroomRunAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXECUTE_BOARDROOM_RUN',
        targetId: 'AI_BOARDROOM',
        metadata: expect.objectContaining({
          boardId: 'board-1',
          boardName: 'Classic Boardroom',
          memberCount: 1,
        }),
      }),
    );
  });

  it('maps boardroom errors to route status and code payload', async () => {
    mockRunWithRequest.mockRejectedValue(
      new BoardroomError({
        code: 'RETRIES_EXHAUSTED',
        message: 'Boardroom provider retries exhausted',
        status: 504,
      }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/boardroom/run', {
        method: 'POST',
        body: JSON.stringify({ question: 'Should we invest in retention?' }),
      }),
    );

    const body = (await response.json()) as { code: string; message: string };

    expect(response.status).toBe(504);
    expect(body.code).toBe('RETRIES_EXHAUSTED');
    expect(body.message).toBe('Boardroom provider retries exhausted');
  });
});
