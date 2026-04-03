/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockGetAdminUserFromRequest = jest.fn();
const mockBoardroomRunCount = jest.fn();
const mockBoardroomRunFindMany = jest.fn();

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/prisma', () => ({
  prisma: {
    boardroomRun: {
      count: (...args: unknown[]) => mockBoardroomRunCount(...args),
      findMany: (...args: unknown[]) => mockBoardroomRunFindMany(...args),
    },
  },
}));

import { GET } from '../route';

describe('GET /api/boardroom/runs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockBoardroomRunCount.mockResolvedValue(1);
    mockBoardroomRunFindMany.mockResolvedValue([
      {
        id: 'run-1',
        boardId: 'board-1',
        boardName: 'Classic Boardroom',
        question: 'Should we focus on retention?',
        decision: 'Prioritize retention loops before acquisition spend.',
        durationMs: 1800,
        createdAt: new Date('2026-04-02T10:00:00.000Z'),
      },
    ]);
  });

  it('returns forbidden for unauthenticated requests', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/boardroom/runs'));

    expect(response.status).toBe(403);
    expect(mockBoardroomRunCount).not.toHaveBeenCalled();
  });

  it('returns runs scoped to the requesting admin', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/boardroom/runs?page=2&pageSize=5'),
    );
    const body = (await response.json()) as {
      total: number;
      page: number;
      pageSize: number;
      items: Array<{ id: string }>;
    };

    expect(response.status).toBe(200);
    expect(mockBoardroomRunCount).toHaveBeenCalledWith({ where: { adminUserId: 'admin-1' } });
    expect(mockBoardroomRunFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { adminUserId: 'admin-1' },
        skip: 5,
        take: 5,
      }),
    );
    expect(body.total).toBe(1);
    expect(body.items[0].id).toBe('run-1');
    expect(body.items[0]).toMatchObject({
      boardId: 'board-1',
      boardName: 'Classic Boardroom',
    });
  });
});
