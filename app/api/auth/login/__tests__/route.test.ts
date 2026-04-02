/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server';

var mockClearPendingAuthCookie = jest.fn();
var mockCreatePendingAuthToken = jest.fn();
var mockCreateSessionToken = jest.fn();
var mockNormalizeAuthCredentials = jest.fn();
var mockSetPendingAuthCookie = jest.fn();
var mockSetSessionCookie = jest.fn();
var mockValidateAuthCredentials = jest.fn();
var mockVerifyPassword = jest.fn();
var mockIssueCsrfToken = jest.fn();
var mockCreateRateLimitResponse = jest.fn();
var mockCreateAuthenticationOptions = jest.fn();
var mockListActiveCredentials = jest.fn();
var mockUserFindUnique = jest.fn();

jest.mock('../../../../../lib/auth', () => ({
  clearPendingAuthCookie: (...args: unknown[]) => mockClearPendingAuthCookie(...args),
  createPendingAuthToken: (...args: unknown[]) => mockCreatePendingAuthToken(...args),
  createSessionToken: (...args: unknown[]) => mockCreateSessionToken(...args),
  normalizeAuthCredentials: (...args: unknown[]) => mockNormalizeAuthCredentials(...args),
  setPendingAuthCookie: (...args: unknown[]) => mockSetPendingAuthCookie(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
  validateAuthCredentials: (...args: unknown[]) => mockValidateAuthCredentials(...args),
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

const USER = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'User',
  role: 'USER',
  passwordHash: 'hashed-password',
};

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockCreateRateLimitResponse.mockReturnValue(null);
    mockNormalizeAuthCredentials.mockImplementation((payload: Record<string, unknown>) => ({
      email: typeof payload.email === 'string' ? payload.email : '',
      password: typeof payload.password === 'string' ? payload.password : '',
      name: null,
    }));

    mockUserFindUnique.mockResolvedValue(USER);
    mockListActiveCredentials.mockResolvedValue([]);
    mockCreateAuthenticationOptions.mockResolvedValue({ challenge: 'challenge-1' });
    mockCreatePendingAuthToken.mockReturnValue('pending-token');
    mockValidateAuthCredentials.mockReturnValue(null);
    mockVerifyPassword.mockReturnValue(true);
    mockCreateSessionToken.mockReturnValue('session-token');
  });

  it('returns MFA_REQUIRED for enrolled users without requiring password first', async () => {
    mockListActiveCredentials.mockResolvedValue([{ id: 'cred-1' }]);

    const response = await POST(buildRequest({ email: 'user@example.com' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'MFA_REQUIRED', user: { id: USER.id } });
    expect(mockVerifyPassword).not.toHaveBeenCalled();
    expect(mockSetPendingAuthCookie).toHaveBeenCalledWith(
      expect.any(NextResponse),
      'pending-token',
    );
    expect(mockSetSessionCookie).not.toHaveBeenCalled();
  });

  it('allows password fallback when preferPassword is true', async () => {
    mockListActiveCredentials.mockResolvedValue([{ id: 'cred-1' }]);

    const response = await POST(
      buildRequest({
        email: 'user@example.com',
        password: 'secret123',
        preferPassword: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'AUTHENTICATED', user: { id: USER.id } });
    expect(mockValidateAuthCredentials).toHaveBeenCalled();
    expect(mockVerifyPassword).toHaveBeenCalledWith('secret123', USER.passwordHash);
    expect(mockSetSessionCookie).toHaveBeenCalledWith(expect.any(NextResponse), 'session-token');
  });

  it('returns 401 when fallback password is invalid', async () => {
    mockListActiveCredentials.mockResolvedValue([{ id: 'cred-1' }]);
    mockVerifyPassword.mockReturnValue(false);

    const response = await POST(
      buildRequest({
        email: 'user@example.com',
        password: 'wrong',
        preferPassword: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ message: 'Invalid email or password' });
  });
});
