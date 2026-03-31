/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockGetMarketingContentSourceVersion = jest.fn();
var mockSaveMarketingContentDraft = jest.fn();
var mockRecordMarketingContentAuditLog = jest.fn();
var mockValidateMarketingContentShape = jest.fn();
var mockOpenAIResponsesCreate = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/marketingContent', () => ({
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
  getMarketingContentSourceVersion: (...args: unknown[]) =>
    mockGetMarketingContentSourceVersion(...args),
  saveMarketingContentDraft: (...args: unknown[]) => mockSaveMarketingContentDraft(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_MARKETING_CONTENT_TRANSLATION_GENERATED: 'GENERATE_MARKETING_CONTENT_TRANSLATION',
  recordMarketingContentAuditLog: (...args: unknown[]) =>
    mockRecordMarketingContentAuditLog(...args),
}));

jest.mock('../../../../../lib/marketingContentValidation', () => ({
  validateMarketingContentShape: (...args: unknown[]) => mockValidateMarketingContentShape(...args),
}));

jest.mock('openai', () => {
  return function OpenAI() {
    return {
      responses: {
        create: (...args: unknown[]) => mockOpenAIResponsesCreate(...args),
      },
    };
  };
});

import { POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

describe('POST /api/marketing-content/translate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    process.env.OPENAI_API_KEY = 'test-key';

    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockGetMarketingContentSourceVersion.mockResolvedValue({
      id: 'source-1',
      contentKey: 'homepage',
      locale: 'en',
      versionNumber: 4,
      content: { hero: { title: 'Hello' } },
    });
    mockOpenAIResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ hero: { title: 'Bonjour' } }),
    });
    mockValidateMarketingContentShape.mockReturnValue({ valid: true, errors: [] });
    mockSaveMarketingContentDraft.mockResolvedValue({
      id: 'translated-draft-1',
      locale: 'fr',
      versionNumber: 7,
      translationOrigin: 'AI_ASSISTED',
    });
    mockRecordMarketingContentAuditLog.mockResolvedValue(undefined);
  });

  it('returns csrf error when check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/translate', {
        method: 'POST',
        body: JSON.stringify({
          contentKey: 'homepage',
          sourceLocale: 'en',
          targetLocale: 'fr',
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockOpenAIResponsesCreate).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({ ...ADMIN_USER, role: 'AUDITOR' });

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/translate', {
        method: 'POST',
        body: JSON.stringify({
          contentKey: 'homepage',
          sourceLocale: 'en',
          targetLocale: 'fr',
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Only ADMIN can generate marketing content translations' });
  });

  it('returns 400 for invalid locale combination', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/translate', {
        method: 'POST',
        body: JSON.stringify({
          contentKey: 'homepage',
          sourceLocale: 'en',
          targetLocale: 'en',
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'sourceLocale and targetLocale must be different' });
    expect(mockGetMarketingContentSourceVersion).not.toHaveBeenCalled();
  });

  it('returns 404 when source version cannot be resolved', async () => {
    mockGetMarketingContentSourceVersion.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/translate', {
        method: 'POST',
        body: JSON.stringify({
          contentKey: 'homepage',
          sourceLocale: 'en',
          targetLocale: 'fr',
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: 'No source marketing content version found for translation' });
  });

  it('returns 400 when translated content shape is invalid', async () => {
    mockValidateMarketingContentShape.mockReturnValue({
      valid: false,
      errors: ['homepage.hero.title must be a string'],
    });

    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/translate', {
        method: 'POST',
        body: JSON.stringify({
          contentKey: 'homepage',
          sourceLocale: 'en',
          targetLocale: 'fr',
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: 'Translated content shape validation failed',
      errors: ['homepage.hero.title must be a string'],
    });
    expect(mockSaveMarketingContentDraft).not.toHaveBeenCalled();
  });

  it('creates translation draft and records audit metadata', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/marketing-content/translate', {
        method: 'POST',
        body: JSON.stringify({
          contentKey: 'homepage',
          sourceLocale: 'en',
          targetLocale: 'fr',
          sourceVersionId: 'source-1',
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      item: expect.objectContaining({
        id: 'translated-draft-1',
        locale: 'fr',
        versionNumber: 7,
      }),
      sourceVersion: expect.objectContaining({
        id: 'source-1',
        versionNumber: 4,
      }),
    });
    expect(mockOpenAIResponsesCreate).toHaveBeenCalledTimes(1);
    expect(mockSaveMarketingContentDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        contentKey: 'homepage',
        locale: 'fr',
        sourceVersionId: 'source-1',
        translationOrigin: 'AI_ASSISTED',
      }),
    );
    expect(mockRecordMarketingContentAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'GENERATE_MARKETING_CONTENT_TRANSLATION',
        contentKey: 'homepage',
      }),
    );
  });
});
