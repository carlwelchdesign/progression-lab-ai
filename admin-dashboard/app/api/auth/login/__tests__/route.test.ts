/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockClearPendingAuthCookie = jest.fn();
var mockCreatePendingAuthToken = jest.fn();
var mockCreateSessionToken = jest.fn();
var mockNormalizeAuthPayload = jest.fn();
var mockSetPendingAuthCookie = jest.fn();
var mockSetSessionCookie = jest.fn();
var mockValidateAdminAuthPayload = jest.fn();
var mockVerifyPassword = jest.fn();
var mockIssueCsrfToken = jest.fn();
var mockCreateRateLimitResponse = jest.fn();
var mockCreateAuthenticationOptions = jest.fn();
var mockCreateRegistrationOptions = jest.fn();
var mockListActiveCredentials = jest.fn();
var mockUserFindUnique = jest.fn();

jest.mock('../../../../../lib/auth', () => ({
  clearPendingAuthCookie: (...args: unknown[]) => mockClearPendingAuthCookie(...args),
  createPendingAuthToken: (...args: unknown[]) => mockCreatePendingAuthToken(...args),
  createSessionToken: (...args: unknown[]) => mockCreateSessionToken(...args),
  normalizeAuthPayload: (...args: unknown[]) => mockNormalizeAuthPayload(...args),
  setPendingAuthCookie: (...args: unknown[]) => mockSetPendingAuthCookie(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
  validateAdminAuthPayload: (...args: unknown[]) => mockValidateAdminAuthPayload(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

jest.mock('../../../../../lib/csrf', () => ({
  issueCsrfToken: (...args: unknown[]) => mockIssueCsrfToken(...args),
}));

jest.mock('../../../../../lib/rateLimiting', () => ({
  createRateLimitResponse: (...args: unknown[]) => mockCreateRateLimitResponse(...args),
}));

jest.mock('../../../../../lib/webauthn', () => ({
  createAuthenticationOptions: (...args: unknown[]) => mockCreateAuthenticationOptions(...args),
  createRegistrationOptions: (...args: unknown[]) => mockCreateRegistrationOptions(...args),
  listActiveCredentials: (...args: unknown[]) => mockListActiveCredentials(...args),
}));

jest.mock('../../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

import { POST } from '../route';

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN',
  passwordHash: 'hashed-password',
  mfaBypassUntil: null,
};

describe('POST /admin api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockCreateRateLimitResponse.mockReturnValue(null);
    mockNormalizeAuthPayload.mockImplementation((payload: Record<string, unknown>) => ({
      email: typeof payload.email === 'string' ? payload.email : '',
      password: typeof payload.password === 'string' ? payload.password : '',
    }));
    mockUserFindUnique.mockResolvedValue(ADMIN_USER);
    mockListActiveCredentials.mockResolvedValue([{ id: 'cred-1' }]);
    mockCreateAuthenticationOptions.mockResolvedValue({ challenge: 'challenge-admin' });
    mockCreateRegistrationOptions.mockResolvedValue({ challenge: 'register-admin' });
    mockCreatePendingAuthToken.mockReturnValue('pending-token');
    mockValidateAdminAuthPayload.mockReturnValue(true);
    mockVerifyPassword.mockReturnValue(true);
    mockCreateSessionToken.mockReturnValue('session-token');
  });

  it('returns MFA_REQUIRED for enrolled admins without requiring password first', async () => {
    const response = await POST(buildRequest({ email: 'admin@example.com' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'MFA_REQUIRED', user: { id: ADMIN_USER.id } });
    expect(mockVerifyPassword).not.toHaveBeenCalled();
    expect(mockSetPendingAuthCookie).toHaveBeenCalledWith(
      expect.any(NextResponse),
      'pending-token',
    );
  });

  it('authenticates with password when preferPassword is true', async () => {
    const response = await POST(
      buildRequest({
        email: 'admin@example.com',
        password: 'secret123',
        preferPassword: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'AUTHENTICATED', user: { id: ADMIN_USER.id } });
    expect(mockVerifyPassword).toHaveBeenCalledWith('secret123', ADMIN_USER.passwordHash);
    expect(mockSetSessionCookie).toHaveBeenCalledWith(expect.any(NextResponse), 'session-token');
  });

  it('returns enrollment required for admins without credentials after password verification', async () => {
    mockListActiveCredentials.mockResolvedValue([]);

    const response = await POST(
      buildRequest({
        email: 'admin@example.com',
        password: 'secret123',
        preferPassword: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'ENROLLMENT_REQUIRED', user: { id: ADMIN_USER.id } });
    expect(mockCreateRegistrationOptions).toHaveBeenCalled();
  });
});
