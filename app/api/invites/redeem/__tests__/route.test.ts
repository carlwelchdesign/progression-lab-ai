/** @jest-environment node */

import { NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetSessionFromRequest = jest.fn();
var mockRedeemInviteCodeForUser = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/auth', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSessionFromRequest(...args),
}));

jest.mock('../../../../../lib/billing', () => ({
  redeemInviteCodeForUser: (...args: unknown[]) => mockRedeemInviteCodeForUser(...args),
}));

import { POST } from '../route';

describe('POST /api/invites/redeem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetSessionFromRequest.mockReturnValue({ userId: 'user-1' });
    mockRedeemInviteCodeForUser.mockResolvedValue({
      applied: true,
      code: 'PRODUCER14',
      grantedPlan: 'INVITE',
      expiresAt: new Date('2026-04-14T00:00:00.000Z'),
    });
  });

  it('returns csrf error response when token validation fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST({} as never);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'CSRF token validation failed' });
    expect(mockGetSessionFromRequest).not.toHaveBeenCalled();
  });

  it('returns unauthorized for missing session', async () => {
    mockGetSessionFromRequest.mockReturnValue(null);

    const response = await POST({ json: async () => ({ code: 'PRODUCER14' }) } as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ message: 'Unauthorized' });
  });

  it('returns 400 when invite code is missing', async () => {
    const response = await POST({ json: async () => ({ code: '   ' }) } as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invite code is required' });
  });

  it('returns success payload when invite is redeemed', async () => {
    const response = await POST({ json: async () => ({ code: 'producer14' }) } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockRedeemInviteCodeForUser).toHaveBeenCalledWith({
      rawCode: 'producer14',
      userId: 'user-1',
    });
    expect(body).toEqual({
      applied: true,
      plan: 'INVITE',
      expiresAt: '2026-04-14T00:00:00.000Z',
    });
  });

  it('returns 200 informational response when paid plan takes precedence', async () => {
    mockRedeemInviteCodeForUser.mockResolvedValue({
      applied: false,
      reason: 'already_paid_plan',
    });

    const response = await POST({ json: async () => ({ code: 'producer14' }) } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      applied: false,
      message: 'Your paid plan remains active. Invite access was not applied.',
    });
  });

  it('returns 400 for invalid invite state', async () => {
    mockRedeemInviteCodeForUser.mockResolvedValue({
      applied: false,
      reason: 'expired',
    });

    const response = await POST({ json: async () => ({ code: 'producer14' }) } as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      applied: false,
      message: 'Invite code is invalid or unavailable',
      reason: 'expired',
    });
  });

  it('returns 500 when invite redemption throws unexpectedly', async () => {
    mockRedeemInviteCodeForUser.mockRejectedValue(new Error('db down'));

    const response = await POST({ json: async () => ({ code: 'producer14' }) } as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ message: 'Failed to redeem invite code' });
  });
});
