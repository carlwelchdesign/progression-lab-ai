/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockCheckCsrfToken = jest.fn();
var mockGetAdminUserFromRequest = jest.fn();
var mockGetPlanIds = jest.fn();
var mockGetPlanVersionsState = jest.fn();
var mockSavePlanDraft = jest.fn();
var mockRecordPlanVersionAuditLog = jest.fn();

jest.mock('../../../../lib/csrf', () => ({
  checkCsrfToken: (...args: unknown[]) => mockCheckCsrfToken(...args),
}));

jest.mock('../../../../lib/adminAccess', () => ({
  getAdminUserFromRequest: (...args: unknown[]) => mockGetAdminUserFromRequest(...args),
}));

jest.mock('../../../../lib/planVersions', () => ({
  getPlanIds: (...args: unknown[]) => mockGetPlanIds(...args),
  getPlanVersionsState: (...args: unknown[]) => mockGetPlanVersionsState(...args),
  savePlanDraft: (...args: unknown[]) => mockSavePlanDraft(...args),
}));

jest.mock('../../../../lib/adminAuditLog', () => ({
  AUDIT_ACTION_PLAN_DRAFT_SAVED: 'SAVE_PLAN_DRAFT',
  recordPlanVersionAuditLog: (...args: unknown[]) => mockRecordPlanVersionAuditLog(...args),
}));

import { GET, POST } from '../route';

const ADMIN_USER = { id: 'admin-1', email: 'admin@progressionlab.ai', role: 'ADMIN' };

const PLAN_STATE = {
  planId: 'COMPOSER',
  planIds: ['COMPOSER', 'SESSION', 'STUDIO'],
  active: { id: 'spv-1', planId: 'COMPOSER', versionNumber: 1, isActive: true, isDraft: false },
  draft: null,
  versions: [{ id: 'spv-1', planId: 'COMPOSER', versionNumber: 1, isActive: true, isDraft: false }],
};

describe('GET /api/subscription-plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockGetPlanIds.mockResolvedValue(['SESSION', 'COMPOSER', 'STUDIO']);
    mockGetPlanVersionsState.mockResolvedValue(PLAN_STATE);
  });

  it('returns 403 for unauthenticated requests', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/subscription-plans'));
    expect(response.status).toBe(403);
    expect(mockGetPlanVersionsState).not.toHaveBeenCalled();
  });

  it('returns plan state for default plan when no planId param', async () => {
    const response = await GET(new NextRequest('http://localhost/api/subscription-plans'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ versions: PLAN_STATE.versions });
    expect(mockGetPlanVersionsState).toHaveBeenCalledWith(expect.any(String));
  });

  it('returns plan state for specified planId', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/subscription-plans?planId=COMPOSER'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetPlanVersionsState).toHaveBeenCalledWith('COMPOSER');
    expect(body).toMatchObject({ planId: PLAN_STATE.planId });
  });

  it('returns 500 on database error', async () => {
    mockGetPlanVersionsState.mockRejectedValue(new Error('db error'));

    const response = await GET(new NextRequest('http://localhost/api/subscription-plans'));
    expect(response.status).toBe(500);
  });
});

describe('POST /api/subscription-plans', () => {
  const VALID_BODY = {
    planId: 'COMPOSER',
    displayName: 'Composer',
    description: 'For serious sessions',
    monthlyPrice: 9,
    yearlyPrice: 90,
    monthlyStripePriceId: 'price_monthly',
    yearlyStripePriceId: 'price_yearly',
    gptModel: 'gpt-3.5-turbo',
    aiGenerationsPerMonth: 50,
    maxSavedProgressions: 50,
    maxSavedArrangements: 25,
    maxPublicShares: 10,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: true,
    canUsePremiumAiModel: false,
  };

  const DRAFT_RESULT = { id: 'spv-draft-1', planId: 'COMPOSER', versionNumber: 2 };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    mockCheckCsrfToken.mockReturnValue(null);
    mockGetAdminUserFromRequest.mockResolvedValue(ADMIN_USER);
    mockSavePlanDraft.mockResolvedValue(DRAFT_RESULT);
    mockRecordPlanVersionAuditLog.mockResolvedValue(undefined);
  });

  it('returns csrf error when check fails', async () => {
    mockCheckCsrfToken.mockReturnValue(
      NextResponse.json({ message: 'CSRF token validation failed' }, { status: 403 }),
    );

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );
    expect(response.status).toBe(403);
    expect(mockSavePlanDraft).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    mockGetAdminUserFromRequest.mockResolvedValue({ ...ADMIN_USER, role: 'AUDITOR' });

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ message: 'Only ADMIN can save plan drafts' });
  });

  it('returns 400 when planId is missing', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_BODY, planId: '' }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid planId' });
  });

  it('returns 400 when displayName is missing', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_BODY, displayName: '' }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'displayName cannot be empty' });
  });

  it('returns 400 when monthlyPrice is invalid', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_BODY, monthlyPrice: -5 }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ message: 'Invalid monthlyPrice' });
  });

  it('saves draft and records audit log on success', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ item: DRAFT_RESULT });
    expect(mockSavePlanDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: 'COMPOSER',
        displayName: 'Composer',
        monthlyPrice: 9,
        editorEmail: ADMIN_USER.email,
      }),
    );
    expect(mockRecordPlanVersionAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SAVE_PLAN_DRAFT',
        planId: 'COMPOSER',
      }),
    );
  });

  it('returns 200 even when audit log fails', async () => {
    mockRecordPlanVersionAuditLog.mockRejectedValue(new Error('audit error'));

    const response = await POST(
      new NextRequest('http://localhost/api/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );

    expect(response.status).toBe(200);
  });
});
