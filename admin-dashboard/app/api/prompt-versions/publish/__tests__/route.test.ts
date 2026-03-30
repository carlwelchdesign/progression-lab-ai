/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockPublishPromptDraft = jest.fn();
var mockRecordPromptVersionAuditLog = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/promptVersions', () => ({
  publishPromptDraft: (...args: unknown[]) => mockPublishPromptDraft(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_PROMPT_PUBLISHED: 'PUBLISH_PROMPT_DRAFT',
  recordPromptVersionAuditLog: (...args: unknown[]) => mockRecordPromptVersionAuditLog(...args),
}));

import { POST } from '../route';

describe('POST /api/prompt-versions/publish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockPublishPromptDraft.mockResolvedValue({
      id: 'version-7',
      versionNumber: 7,
      promptKey: 'chord_suggestions',
    });
    mockRecordPromptVersionAuditLog.mockResolvedValue(undefined);
  });

  it('returns csrf error response when check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/publish', {
        method: 'POST',
        body: JSON.stringify({ promptKey: 'chord_suggestions' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockPublishPromptDraft).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'auditor-1',
      email: 'auditor@progressionlab.ai',
      role: 'AUDITOR',
    });

    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/publish', {
        method: 'POST',
        body: JSON.stringify({ promptKey: 'chord_suggestions' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Only ADMIN can publish prompts' });
    expect(mockPublishPromptDraft).not.toHaveBeenCalled();
  });

  it('returns 404 when no draft exists to publish', async () => {
    mockPublishPromptDraft.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/publish', {
        method: 'POST',
        body: JSON.stringify({ promptKey: 'chord_suggestions' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: 'No draft found to publish' });
  });

  it('publishes a draft and records audit metadata', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/publish', {
        method: 'POST',
        body: JSON.stringify({ promptKey: 'chord_suggestions' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      item: {
        id: 'version-7',
        versionNumber: 7,
        promptKey: 'chord_suggestions',
      },
    });
    expect(mockPublishPromptDraft).toHaveBeenCalledWith({ promptKey: 'chord_suggestions' });
    expect(mockRecordPromptVersionAuditLog).toHaveBeenCalledWith({
      actor: {
        id: 'admin-1',
        email: 'admin@progressionlab.ai',
        role: 'ADMIN',
      },
      action: 'PUBLISH_PROMPT_DRAFT',
      promptKey: 'chord_suggestions',
      metadata: {
        versionId: 'version-7',
        versionNumber: 7,
      },
    });
  });
});
