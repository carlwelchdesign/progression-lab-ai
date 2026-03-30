import { createHmac, scryptSync, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'progressionlab_admin_session';
const PENDING_AUTH_COOKIE_NAME = 'progressionlab_admin_pending_auth';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const PENDING_AUTH_MAX_AGE_SECONDS = 10 * 60;

export type UserRole = 'ADMIN' | 'AUDITOR';

type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
};

export type PendingAuthPayload = {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
  purpose: 'ADMIN_WEBAUTHN';
};

export type AuthRequestPayload = {
  email?: string;
  password?: string;
};

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const base64 = padding ? normalized + '='.repeat(4 - padding) : normalized;
  return Buffer.from(base64, 'base64').toString('utf8');
}

function getAuthSecret(): string {
  if (process.env.ADMIN_AUTH_SECRET) {
    return process.env.ADMIN_AUTH_SECRET;
  }

  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing ADMIN_AUTH_SECRET in production');
  }

  return 'dev-only-admin-auth-secret-change-me';
}

function sign(value: string): string {
  return base64UrlEncode(createHmac('sha256', getAuthSecret()).update(value).digest());
}

function parseSignedToken<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split('.');
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedSignatureBuffer = Buffer.from(encodedSignature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as T;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
): void {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

function clearCookie(response: NextResponse, name: string): void {
  response.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function normalizeAuthPayload(payload: AuthRequestPayload) {
  return {
    email: payload.email?.trim().toLowerCase() ?? '',
    password: payload.password?.trim() ?? '',
  };
}

/**
 * Validates admin auth payload
 * Prevents obviously invalid input without leaking timing information
 */
export function validateAdminAuthPayload(payload: { email: string; password: string }): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(payload.email)) {
    return false;
  }

  if (!payload.password || payload.password.length < 6 || payload.password.length > 512) {
    return false;
  }

  if (payload.email.length > 254) {
    return false;
  }

  return true;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [scheme, salt, hash] = storedHash.split('$');

  if (scheme !== 'scrypt' || !salt || !hash) {
    return false;
  }

  try {
    const candidate = scryptSync(password, salt, 64).toString('hex');
    const candidateBuffer = Buffer.from(candidate, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');

    if (candidateBuffer.length !== hashBuffer.length) {
      return false;
    }

    return timingSafeEqual(candidateBuffer, hashBuffer);
  } catch {
    return false;
  }
}

export function createSessionToken(userId: string, email: string, role: UserRole): string {
  const payload: SessionPayload = {
    userId,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function createPendingAuthToken(userId: string, email: string, role: UserRole): string {
  const payload: PendingAuthPayload = {
    userId,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + PENDING_AUTH_MAX_AGE_SECONDS,
    purpose: 'ADMIN_WEBAUTHN',
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseSessionToken(token: string | undefined): SessionPayload | null {
  const payload = parseSignedToken<SessionPayload>(token);
  if (!payload || !payload.userId || !payload.email || !payload.role) {
    return null;
  }

  if (payload.role !== 'ADMIN' && payload.role !== 'AUDITOR') {
    return null;
  }

  return payload;
}

export function parsePendingAuthToken(token: string | undefined): PendingAuthPayload | null {
  const payload = parseSignedToken<PendingAuthPayload>(token);
  if (!payload || !payload.userId || !payload.email || !payload.role) {
    return null;
  }

  if (payload.role !== 'ADMIN' && payload.role !== 'AUDITOR') {
    return null;
  }

  if (payload.purpose !== 'ADMIN_WEBAUTHN') {
    return null;
  }

  return payload;
}

export function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return parseSessionToken(token);
}

export function getPendingAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get(PENDING_AUTH_COOKIE_NAME)?.value;
  return parsePendingAuthToken(token);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  setCookie(response, AUTH_COOKIE_NAME, token, SESSION_MAX_AGE_SECONDS);
}

export function setPendingAuthCookie(response: NextResponse, token: string): void {
  setCookie(response, PENDING_AUTH_COOKIE_NAME, token, PENDING_AUTH_MAX_AGE_SECONDS);
}

export function clearSessionCookie(response: NextResponse): void {
  clearCookie(response, AUTH_COOKIE_NAME);
}

export function clearPendingAuthCookie(response: NextResponse): void {
  clearCookie(response, PENDING_AUTH_COOKIE_NAME);
}
