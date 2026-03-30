/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockPublishPlanDraft = jest.fn();
var mockRecordPlanVersionAuditLog = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/planVersions', () => ({
  publishPlanDraft: (...args: unknown[]) => mockPublishPlanDraft(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_PLAN_PUBLISHED: 'PUBLISH_PLAN_DRAFT',
  recordPlanVersionAuditLog: (...args: unknown[]) => mockRecordPlanVersionAuditLog(...args),
}));

import { POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

describe('POST /api/subscription-plans/publish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockPublishPlanDraft.mockResolvedValue({
      id: 'spv-published-1',
      planId: 'COMPOSER',
      versionNumber: 2,
      isActive: true,
      isDraft: false,
      displayName: 'Composer',
    });
    mockRecordPlanVersionAuditLog.mockResolvedValue(undefined);
  });

  it('returns csrf error when check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/publish', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER' }),
      }),
    );
    expect(response.status).toBe(403);
    expect(mockPublishPlanDraft).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({ ...ADMIN_USER, role: 'AUDITOR' });

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/publish', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Only ADMIN can publish plan drafts' });
    expect(mockPublishPlanDraft).not.toHaveBeenCalled();
  });

  it('returns 400 when planId is missing', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/publish', {
        method: 'POST',
        body: JSON.stringify({ planId: '' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid planId' });
  });

  it('returns 404 when no draft exists to publish', async () => {
    mockPublishPlanDraft.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/publish', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: 'No draft found to publish' });
  });

  it('publishes draft and records audit log', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/publish', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.item).toMatchObject({ planId: 'COMPOSER', versionNumber: 2 });
    expect(mockPublishPlanDraft).toHaveBeenCalledWith({ planId: 'COMPOSER' });
    expect(mockRecordPlanVersionAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PUBLISH_PLAN_DRAFT',
        planId: 'COMPOSER',
      }),
    );
  });
});
