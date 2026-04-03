/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

const mockCheckCsrfToken = jest.fn();
const mockGetAdminUserFromRequest = jest.fn();
const mockGetBoardroomBoardById = jest.fn();
const mockUpdateBoardroomBoard = jest.fn();
const mockDeleteBoardroomBoard = jest.fn();
const mockRecordBoardroomBoardAuditLog = jest.fn();

jest.mock('../../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../../lib/boardroom/boards', () => ({
  getBoardroomBoardById: (...args: unknown[]) => mockGetBoardroomBoardById(...args),
  updateBoardroomBoard: (...args: unknown[]) => mockUpdateBoardroomBoard(...args),
  deleteBoardroomBoard: (...args: unknown[]) => mockDeleteBoardroomBoard(...args),
}));

jest.mock('../../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_BOARDROOM_BOARD_UPDATED: 'UPDATE_AI_BOARDROOM_BOARD',
  AUDIT_ACTION_BOARDROOM_BOARD_DELETED: 'DELETE_AI_BOARDROOM_BOARD',
  recordBoardroomBoardAuditLog: (...args: unknown[]) => mockRecordBoardroomBoardAuditLog(...args),
}));

import { DELETE, GET, PATCH } from '../route';

const ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@progressionlab.ai',
  role: 'ADMIN',
};

describe('GET /api/boardroom/boards/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockGetBoardroomBoardById.mockResolvedValue({
      id: 'board-1',
      name: 'Classic Boardroom',
      description: null,
      isDefault: true,
      members: [],
    });
  });

  it('returns board details for admin users', async () => {
    const response = await GET(new NextRequest('http://localhost/api/boardroom/boards/board-1'), {
      params: Promise.resolve({ id: 'board-1' }),
    });
    const body = (await response.json()) as { item: { id: string } };

    expect(response.status).toBe(200);
    expect(body.item.id).toBe('board-1');
    expect(mockGetBoardroomBoardById).toHaveBeenCalledWith('board-1');
  });

  it('returns not found when board is missing', async () => {
    mockGetBoardroomBoardById.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/boardroom/boards/missing'), {
      params: Promise.resolve({ id: 'missing' }),
    });

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/boardroom/boards/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockUpdateBoardroomBoard.mockResolvedValue({
      id: 'board-1',
      name: 'Updated Board',
      description: null,
      isDefault: true,
      members: [],
    });
  });

  it('returns csrf response when token validation fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await PATCH(
      new NextRequest('http://localhost/api/boardroom/boards/board-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Board', members: [] }),
      }),
      { params: Promise.resolve({ id: 'board-1' }) },
    );

    expect(response.status).toBe(403);
    expect(mockUpdateBoardroomBoard).not.toHaveBeenCalled();
  });

  it('updates board and records audit entry', async () => {
    const response = await PATCH(
      new NextRequest('http://localhost/api/boardroom/boards/board-1', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Board',
          members: [
            {
              personaLabel: 'CTO',
              title: 'Chief Technology Officer',
              priorities: ['Delivery feasibility'],
              biases: ['Prefers low uncertainty'],
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: 'board-1' }) },
    );

    const body = (await response.json()) as { item: { id: string; name: string } };

    expect(response.status).toBe(200);
    expect(body.item).toMatchObject({ id: 'board-1', name: 'Updated Board' });
    expect(mockUpdateBoardroomBoard).toHaveBeenCalledWith('board-1', expect.any(Object));
    expect(mockRecordBoardroomBoardAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_AI_BOARDROOM_BOARD',
        targetId: 'board-1',
      }),
    );
  });
});

describe('DELETE /api/boardroom/boards/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockDeleteBoardroomBoard.mockResolvedValue(true);
  });

  it('deletes board and records audit entry', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/boardroom/boards/board-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'board-1' }) },
    );

    expect(response.status).toBe(204);
    expect(mockDeleteBoardroomBoard).toHaveBeenCalledWith('board-1');
    expect(mockRecordBoardroomBoardAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE_AI_BOARDROOM_BOARD',
        targetId: 'board-1',
      }),
    );
  });

  it('returns not found when board does not exist', async () => {
    mockDeleteBoardroomBoard.mockResolvedValue(false);

    const response = await DELETE(
      new NextRequest('http://localhost/api/boardroom/boards/missing', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(response.status).toBe(404);
  });
});
