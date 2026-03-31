/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockGetMarketingContentBuilderState = jest.fn();
var mockSaveMarketingContentDraft = jest.fn();
var mockRecordMarketingContentAuditLog = jest.fn();
var mockValidateMarketingContentShape = jest.fn();

jest.mock('../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../lib/marketingContent', () => ({
  MARKETING_CONTENT_DEFINITIONS: [
    {
      key: 'homepage',
      label: 'Homepage',
      description: 'Homepage content',
      contentKind: 'PAGE',
      schemaVersion: 1,
      defaultLocale: 'en',
      defaultContent: {},
    },
  ],
  SUPPORTED_MARKETING_LOCALES: ['en', 'fr', 'de'],
  getMarketingContentBuilderState: (...args: unknown[]) =>
    mockGetMarketingContentBuilderState(...args),
  saveMarketingContentDraft: (...args: unknown[]) => mockSaveMarketingContentDraft(...args),
}));

jest.mock('../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_MARKETING_CONTENT_DRAFT_SAVED: 'SAVE_MARKETING_CONTENT_DRAFT',
  recordMarketingContentAuditLog: (...args: unknown[]) =>
    mockRecordMarketingContentAuditLog(...args),
}));

jest.mock('../../../../lib/marketingContentValidation', () => ({
  validateMarketingContentShape: (...args: unknown[]) => mockValidateMarketingContentShape(...args),
}));

import { GET, POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

describe('GET /api/marketing-content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockGetMarketingContentBuilderState.mockResolvedValue({
      contentKey: 'homepage',
      locale: 'en',
      sourceLocale: 'en',
      definitions: [],
      supportedLocales: ['en', 'fr', 'de'],
      active: null,
      draft: null,
      versions: [],
      sourceActiveVersionId: null,
      sourceActiveVersionNumber: null,
      staleVersionIds: [],
      selectedDraftIsStale: false,
      defaultContent: {},
    });
  });

  it('returns 403 for unauthenticated requests', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/marketing-content'));

    expect(response.status).toBe(403);
    expect(mockGetMarketingContentBuilderState).not.toHaveBeenCalled();
  });

  it('passes requested sourceLocale to builder state', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/marketing-content?contentKey=homepage&locale=fr&sourceLocale=de',
      ),
    );

    expect(response.status).toBe(200);
    expect(mockGetMarketingContentBuilderState).toHaveBeenCalledWith('homepage', 'fr', 'de');
  });

  it('falls back invalid sourceLocale to en', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/marketing-content?contentKey=homepage&locale=fr&sourceLocale=bad-locale',
      ),
    );

    expect(response.status).toBe(200);
    expect(mockGetMarketingContentBuilderState).toHaveBeenCalledWith('homepage', 'fr', 'en');
  });
});

describe('POST /api/marketing-content', () => {
  const VALID_BODY = {
    contentKey: 'homepage',
    locale: 'fr',
    content: { hero: { title: 'Bonjour' } },
    notes: 'Draft update',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockValidateMarketingContentShape.mockReturnValue({ valid: true, errors: [] });
    mockSaveMarketingContentDraft.mockResolvedValue({ id: 'mcv-1', versionNumber: 2 });
    mockRecordMarketingContentAuditLog.mockResolvedValue(undefined);
  });

  it('returns 400 when content shape validation fails', async () => {
    mockValidateMarketingContentShape.mockReturnValue({
      valid: false,
      errors: ['homepage.hero.title must be a string'],
    });

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: 'Invalid marketing content shape',
      errors: ['homepage.hero.title must be a string'],
    });
    expect(mockSaveMarketingContentDraft).not.toHaveBeenCalled();
  });

  it('saves draft and records audit metadata', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ item: { id: 'mcv-1', versionNumber: 2 } });
    expect(mockSaveMarketingContentDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        contentKey: 'homepage',
        locale: 'fr',
        actorEmail: ADMIN_USER.email,
      }),
    );
    expect(mockRecordMarketingContentAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SAVE_MARKETING_CONTENT_DRAFT',
        contentKey: 'homepage',
      }),
    );
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({ ...ADMIN_USER, role: 'AUDITOR' });

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockSaveMarketingContentDraft).not.toHaveBeenCalled();
  });

  it('returns csrf error response when check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockSaveMarketingContentDraft).not.toHaveBeenCalled();
  });
});
