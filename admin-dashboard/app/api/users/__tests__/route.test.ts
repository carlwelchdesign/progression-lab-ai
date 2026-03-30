/** @jest-environment node */

import { NextRequest } from 'next/server';

var mockGetAdminUserFromRequest = jest.fn();
var mockMaskEmail = jest.fn((email: string) => `masked:${email}`);
var mockUserCount = jest.fn();
var mockUserFindMany = jest.fn();
var mockUsageEventAggregate = jest.fn();

jest.mock('../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
  maskEmail: (...args: unknown[]) => mockMaskEmail(...args),
}));

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      count: (...args: unknown[]) => mockUserCount(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    usageEvent: {
      aggregate: (...args: unknown[]) => mockUsageEventAggregate(...args),
    },
  },
}));

import { GET } from '../route';

describe('GET /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockUserCount
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2);
    mockUsageEventAggregate.mockResolvedValue({
      _sum: {
        quantity: 14,
      },
    });
    mockUserFindMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'artist@progressionlab.ai',
        name: 'Artist One',
        role: 'USER',
        planOverride: null,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
        subscription: {
          plan: 'COMPOSER',
          status: 'ACTIVE',
          billingInterval: 'MONTHLY',
        },
        usageEvents: [{ quantity: 4 }, { quantity: 2 }],
      },
    ]);
  });

  it('returns 403 when the requester is not an admin user', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/users'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Forbidden' });
    expect(mockUserCount).not.toHaveBeenCalled();
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('applies query, role, and override filters to the user query', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/users?page=2&pageSize=10&query=artist&role=USER&overrideState=OVERRIDDEN',
      ),
    );
    const body = await response.json();

    const expectedWhere = {
      AND: [
        {
          OR: [
            { email: { contains: 'artist', mode: 'insensitive' } },
            { name: { contains: 'artist', mode: 'insensitive' } },
          ],
        },
        { role: 'USER' },
        { planOverride: { not: null } },
      ],
    };

    expect(response.status).toBe(200);
    expect(mockUserCount).toHaveBeenNthCalledWith(2, { where: expectedWhere });
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedWhere,
        skip: 10,
        take: 10,
      }),
    );
    expect(body.total).toBe(3);
    expect(body.summary).toEqual({
      totalUsers: 20,
      payingUsers: 6,
      compedUsers: 2,
      monthlyAiGenerations: 14,
    });
    expect(body.items[0]).toMatchObject({
      id: 'user-1',
      email: 'artist@progressionlab.ai',
      resolvedPlan: 'COMPOSER',
      aiGenerationsUsed: 6,
      aiGenerationsLimit: 50,
    });
  });

  it('supports session-plan and no-subscription filters and masks emails for auditors', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'auditor-1',
      email: 'auditor@progressionlab.ai',
      role: 'AUDITOR',
    });
    mockUserFindMany.mockResolvedValueOnce([
      {
        id: 'user-2',
        email: 'free@progressionlab.ai',
        name: 'Free User',
        role: 'USER',
        planOverride: null,
        createdAt: new Date('2026-03-03T00:00:00.000Z'),
        updatedAt: new Date('2026-03-04T00:00:00.000Z'),
        subscription: null,
        usageEvents: [],
      },
    ]);

    const response = await GET(
      new NextRequest(
        'http://localhost/api/users?resolvedPlan=SESSION&subscriptionStatus=NONE&page=1&pageSize=25',
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUserCount).toHaveBeenNthCalledWith(2, {
      where: {
        AND: [
          {
            OR: [
              { planOverride: 'SESSION' },
              {
                planOverride: null,
                subscription: {
                  is: {
                    plan: 'SESSION',
                    status: {
                      in: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
                    },
                  },
                },
              },
              {
                planOverride: null,
                OR: [
                  { subscription: { is: null } },
                  {
                    subscription: {
                      is: {
                        status: {
                          notIn: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
          { subscription: { is: null } },
        ],
      },
    });
    expect(mockMaskEmail).toHaveBeenCalledWith('free@progressionlab.ai');
    expect(body.items[0]).toMatchObject({
      email: 'masked:free@progressionlab.ai',
      resolvedPlan: 'SESSION',
      aiGenerationsLimit: 10,
    });
  });
});
