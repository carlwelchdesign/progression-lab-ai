/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

const mockCheckCsrfToken = jest.fn();
const mockGetAdminUserFromRequest = jest.fn();
const mockBoardroomRunFindFirst = jest.fn();
const mockBoardroomRunDeleteMany = jest.fn();

jest.mock('../../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../../lib/prisma', () => ({
  prisma: {
    boardroomRun: {
      findFirst: (...args: unknown[]) => mockBoardroomRunFindFirst(...args),
      deleteMany: (...args: unknown[]) => mockBoardroomRunDeleteMany(...args),
    },
  },
}));

import { DELETE, GET } from '../route';

describe('GET /api/boardroom/runs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockBoardroomRunFindFirst.mockResolvedValue({
      id: 'run-1',
      boardId: 'board-1',
      boardName: 'Classic Boardroom',
      boardSnapshot: [
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
      question: 'Should we focus on retention?',
      context: { productStage: 'GROWTH' },
      decision: 'Prioritize retention loops before acquisition spend.',
      reasoning: 'Retention compounds and improves unit economics.',
      keyTradeoffs: ['Slower top-line growth'],
      risks: ['Feature velocity can slow down'],
      actionPlan: ['Ship win-back lifecycle emails'],
      dissentingOpinions: ['CMO prefers paid channels first'],
      debate: {
        independentSummaries: [],
        critiqueSummaries: [],
        revisionSummaries: [],
      },
      durationMs: 1800,
      modelClasses: ['SMALL', 'LARGE'],
      createdAt: new Date('2026-04-02T10:00:00.000Z'),
    });
  });

  it('returns a saved run detail for its owner', async () => {
    const response = await GET(new NextRequest('http://localhost/api/boardroom/runs/run-1'), {
      params: Promise.resolve({ id: 'run-1' }),
    });
    const body = (await response.json()) as {
      item: { id: string; result: { decision: string } };
    };

    expect(response.status).toBe(200);
    expect(mockBoardroomRunFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'run-1',
          adminUserId: 'admin-1',
        },
      }),
    );
    expect(body.item.id).toBe('run-1');
    expect(body.item).toMatchObject({
      boardId: 'board-1',
      boardName: 'Classic Boardroom',
      boardMembers: expect.any(Array),
    });
    expect(body.item.result.decision).toContain('retention');
  });
});

describe('DELETE /api/boardroom/runs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockBoardroomRunDeleteMany.mockResolvedValue({ count: 1 });
  });

  it('returns csrf response when token is invalid', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await DELETE(
      new NextRequest('http://localhost/api/boardroom/runs/run-1', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: 'run-1' }),
      },
    );

    expect(response.status).toBe(403);
    expect(mockBoardroomRunDeleteMany).not.toHaveBeenCalled();
  });

  it('deletes a saved run owned by the requesting admin', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/boardroom/runs/run-1', { method: 'DELETE' }),
      {
        params: Promise.resolve({ id: 'run-1' }),
      },
    );

    expect(response.status).toBe(204);
    expect(mockBoardroomRunDeleteMany).toHaveBeenCalledWith({
      where: {
        id: 'run-1',
        adminUserId: 'admin-1',
      },
    });
  });
});
