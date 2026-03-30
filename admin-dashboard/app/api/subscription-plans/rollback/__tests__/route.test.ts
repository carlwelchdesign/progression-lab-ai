/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockRollbackPlanVersion = jest.fn();
var mockRecordPlanVersionAuditLog = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/planVersions', () => ({
  rollbackPlanVersion: (...args: unknown[]) => mockRollbackPlanVersion(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_PLAN_ROLLED_BACK: 'ROLLBACK_PLAN_VERSION',
  recordPlanVersionAuditLog: (...args: unknown[]) => mockRecordPlanVersionAuditLog(...args),
}));

import { POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

describe('POST /api/subscription-plans/rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockRollbackPlanVersion.mockResolvedValue({
      id: 'spv-v1',
      planId: 'COMPOSER',
      versionNumber: 1,
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
      new NextRequest('http://localhost/api/subscription-plans/rollback', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER', versionId: 'spv-v1' }),
      }),
    );
    expect(response.status).toBe(403);
    expect(mockRollbackPlanVersion).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({ ...ADMIN_USER, role: 'AUDITOR' });

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/rollback', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER', versionId: 'spv-v1' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Only ADMIN can rollback plan versions' });
    expect(mockRollbackPlanVersion).not.toHaveBeenCalled();
  });

  it('returns 400 when planId is missing', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/rollback', {
        method: 'POST',
        body: JSON.stringify({ planId: '', versionId: 'spv-v1' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid planId or versionId' });
  });

  it('returns 400 when versionId is missing', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/rollback', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER', versionId: '' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid planId or versionId' });
  });

  it('returns 404 when version not found', async () => {
    mockRollbackPlanVersion.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/rollback', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER', versionId: 'spv-not-found' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: 'Version not found' });
  });

  it('rolls back version and records audit log', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans/rollback', {
        method: 'POST',
        body: JSON.stringify({ planId: 'COMPOSER', versionId: 'spv-v1' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.item).toMatchObject({ planId: 'COMPOSER', versionNumber: 1 });
    expect(mockRollbackPlanVersion).toHaveBeenCalledWith({
      planId: 'COMPOSER',
      versionId: 'spv-v1',
    });
    expect(mockRecordPlanVersionAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ROLLBACK_PLAN_VERSION',
        planId: 'COMPOSER',
      }),
    );
  });
});
