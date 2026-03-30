/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockRollbackPromptVersion = jest.fn();
var mockRecordPromptVersionAuditLog = jest.fn();

jest.mock('../../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../../lib/promptVersions', () => ({
  rollbackPromptVersion: (...args: unknown[]) => mockRollbackPromptVersion(...args),
}));

jest.mock('../../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_PROMPT_ROLLED_BACK: 'ROLLBACK_PROMPT_VERSION',
  recordPromptVersionAuditLog: (...args: unknown[]) => mockRecordPromptVersionAuditLog(...args),
}));

import { POST } from '../route';

describe('POST /api/prompt-versions/rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@progressionlab.ai',
      role: 'ADMIN',
    });
    mockRollbackPromptVersion.mockResolvedValue({
      id: 'version-3',
      versionNumber: 3,
      promptKey: 'chord_suggestions',
    });
    mockRecordPromptVersionAuditLog.mockResolvedValue(undefined);
  });

  it('returns csrf error response when check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/rollback', {
        method: 'POST',
        body: JSON.stringify({ promptKey: 'chord_suggestions', versionId: 'version-3' }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockRollbackPromptVersion).not.toHaveBeenCalled();
  });

  it('returns 400 when promptKey or versionId is invalid', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/rollback', {
        method: 'POST',
        body: JSON.stringify({ promptKey: '', versionId: '' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid promptKey or versionId' });
  });

  it('returns 404 when target version is not found', async () => {
    mockRollbackPromptVersion.mockResolvedValue(null);

    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/rollback', {
        method: 'POST',
        body: JSON.stringify({ promptKey: 'chord_suggestions', versionId: 'missing' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: 'Version not found' });
  });

  it('rolls back to a selected version and records audit metadata', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/prompt-versions/rollback', {
        method: 'POST',
        body: JSON.stringify({ promptKey: 'chord_suggestions', versionId: 'version-3' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      item: {
        id: 'version-3',
        versionNumber: 3,
        promptKey: 'chord_suggestions',
      },
    });
    expect(mockRollbackPromptVersion).toHaveBeenCalledWith({
      promptKey: 'chord_suggestions',
      versionId: 'version-3',
    });
    expect(mockRecordPromptVersionAuditLog).toHaveBeenCalledWith({
      actor: {
        id: 'admin-1',
        email: 'admin@progressionlab.ai',
        role: 'ADMIN',
      },
      action: 'ROLLBACK_PROMPT_VERSION',
      promptKey: 'chord_suggestions',
      metadata: {
        versionId: 'version-3',
        versionNumber: 3,
      },
    });
  });
});
