/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockPublishMarketingContentDraft = jest.fn();
var mockRecordMarketingContentAuditLog = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/marketingContent', () => ({
  publishMarketingContentDraft: (...args: unknown[]) => mockPublishMarketingContentDraft(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_MARKETING_CONTENT_PUBLISHED: 'PUBLISH_MARKETING_CONTENT_DRAFT',
  recordMarketingContentAuditLog: (...args: unknown[]) =>
    mockRecordMarketingContentAuditLog(...args),
}));

import { POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

describe('POST /api/marketing-content/publish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockPublishMarketingContentDraft.mockResolvedValue({
      id: 'mcv-2',
      contentKey: 'homepage',
      locale: 'fr',
      versionNumber: 2,
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
      new NextRequest('http://localhost/api/marketing-content/publish', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockPublishMarketingContentDraft).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({ ...ADMIN_USER, role: 'AUDITOR' });

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/publish', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Only ADMIN can publish marketing content drafts' });
    expect(mockPublishMarketingContentDraft).not.toHaveBeenCalled();
  });

  it('returns 400 when contentKey or locale is missing', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/publish', {
        method: 'POST',
        body: JSON.stringify({ contentKey: '', locale: '' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid contentKey or locale' });
  });

  it('returns 404 when no draft exists to publish', async () => {
    mockPublishMarketingContentDraft.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/publish', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: 'No draft found to publish' });
  });

  it('publishes a draft and records audit metadata', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/publish', {
        method: 'POST',
        body: JSON.stringify({ contentKey: 'homepage', locale: 'fr' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      item: expect.objectContaining({
        id: 'mcv-2',
        contentKey: 'homepage',
        locale: 'fr',
        versionNumber: 2,
      }),
    });
    expect(mockPublishMarketingContentDraft).toHaveBeenCalledWith({
      contentKey: 'homepage',
      locale: 'fr',
    });
    expect(mockRecordMarketingContentAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PUBLISH_MARKETING_CONTENT_DRAFT',
        contentKey: 'homepage',
      }),
    );
  });
});
