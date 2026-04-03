/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

const mockCheckCsrfToken = jest.fn();
const mockGetAdminUserFromRequest = jest.fn();
const mockListBoardroomBoards = jest.fn();
const mockCreateBoardroomBoard = jest.fn();
const mockRecordBoardroomBoardAuditLog = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/boardroom/boards', () => ({
  listBoardroomBoards: (...args: unknown[]) => mockListBoardroomBoards(...args),
  createBoardroomBoard: (...args: unknown[]) => mockCreateBoardroomBoard(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_BOARDROOM_BOARD_CREATED: 'CREATE_AI_BOARDROOM_BOARD',
  recordBoardroomBoardAuditLog: (...args: unknown[]) => mockRecordBoardroomBoardAuditLog(...args),
}));

import { GET, POST } from '../route';

describe('GET /api/boardroom/boards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockListBoardroomBoards.mockResolvedValue([
      {
        id: 'board-1',
        name: 'Classic Boardroom',
        description: null,
        isDefault: true,
        members: [],
      },
    ]);
  });

  it('returns forbidden when requester is not admin', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/boardroom/boards'));

    expect(response.status).toBe(403);
    expect(mockListBoardroomBoards).not.toHaveBeenCalled();
  });

  it('returns saved boards and suggestion catalog', async () => {
    const response = await GET(new NextRequest('http://localhost/api/boardroom/boards'));
    const body = (await response.json()) as {
      items: Array<{ id: string; name: string }>;
      suggestions: Array<{ key: string; label: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.items[0]).toMatchObject({ id: 'board-1', name: 'Classic Boardroom' });
    expect(body.suggestions.length).toBeGreaterThan(0);
  });
});

describe('POST /api/boardroom/boards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockCreateBoardroomBoard.mockResolvedValue({
      id: 'board-2',
      name: 'Growth Board',
      description: 'Saved from test',
      isDefault: false,
      members: [
        {
          id: 'member-1',
          personaLabel: 'CTO',
          title: 'Chief Technology Officer',
          priorities: ['Delivery feasibility'],
          biases: ['Prefers low uncertainty'],
          modelClass: 'SMALL',
          maxOutputChars: 1400,
          displayOrder: 0,
          suggestionKey: null,
          isActive: true,
        },
      ],
    });
  });

  it('returns csrf response when token validation fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/boardroom/boards', {
        method: 'POST',
        body: JSON.stringify({ name: 'x', members: [] }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockCreateBoardroomBoard).not.toHaveBeenCalled();
  });

  it('creates board and records audit log', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/boardroom/boards', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Growth Board',
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
    );

    const body = (await response.json()) as { item: { id: string; name: string } };

    expect(response.status).toBe(201);
    expect(body.item).toMatchObject({ id: 'board-2', name: 'Growth Board' });
    expect(mockCreateBoardroomBoard).toHaveBeenCalled();
    expect(mockRecordBoardroomBoardAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_AI_BOARDROOM_BOARD',
        targetId: 'board-2',
      }),
    );
  });
});
