/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockRollbackMarketingContentVersion = jest.fn();
var mockRecordMarketingContentAuditLog = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/marketingContent', () => ({
  rollbackMarketingContentVersion: (...args: unknown[]) =>
    mockRollbackMarketingContentVersion(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_MARKETING_CONTENT_ROLLED_BACK: 'ROLLBACK_MARKETING_CONTENT_VERSION',
  recordMarketingContentAuditLog: (...args: unknown[]) =>
    mockRecordMarketingContentAuditLog(...args),
}));

import { POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

describe('POST /api/marketing-content/rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockRollbackMarketingContentVersion.mockResolvedValue({
      id: 'mcv-3',
      contentKey: 'homepage',
      locale: 'fr',
      versionNumber: 3,
      isActive: true,
      isDraft: false,
    });
    mockRecordMarketingContentAuditLog.mockResolvedValue(undefined);
  });

  it('returns csrf error when check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/rollback', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr', versionId: 'mcv-2' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockRollbackMarketingContentVersion).not.toHaveBeenCalled();
  });

  it('returns 400 when contentKey, locale, or versionId is invalid', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/rollback', {
        method: 'POST',
        body: JSON.stringify({ contentKey: '', locale: '', versionId: '' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid contentKey, locale, or versionId' });
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({ ...ADMIN_USER, role: 'AUDITOR' });

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/rollback', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr', versionId: 'mcv-2' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Only ADMIN can rollback marketing content versions' });
    expect(mockRollbackMarketingContentVersion).not.toHaveBeenCalled();
  });

  it('returns 404 when version is not found', async () => {
    mockRollbackMarketingContentVersion.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/rollback', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr', versionId: 'missing' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: 'Version not found' });
  });

  it('rolls back a version and records audit metadata', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/rollback', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr', versionId: 'mcv-2' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      item: expect.objectContaining({
        id: 'mcv-3',
        contentKey: 'homepage',
        locale: 'fr',
        versionNumber: 3,
      }),
    });
    expect(mockRollbackMarketingContentVersion).toHaveBeenCalledWith({
      contentKey: 'homepage',
      locale: 'fr',
      versionId: 'mcv-2',
    });
    expect(mockRecordMarketingContentAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ROLLBACK_MARKETING_CONTENT_VERSION',
        contentKey: 'homepage',
      }),
    );
  });
});
