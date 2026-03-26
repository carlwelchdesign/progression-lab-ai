import { createHmac, scryptSync, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'progressionlab_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type UserRole = 'ADMIN' | 'AUDITOR';

type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
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

export function normalizeAuthPayload(payload: AuthRequestPayload) {
  return {
    email: payload.email?.trim().toLowerCase() ?? '',
    password: payload.password?.trim() ?? '',
  };
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

export function parseSessionToken(token: string | undefined): SessionPayload | null {
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
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.email || !payload.role || !payload.exp) {
      return null;
    }

    if (payload.role !== 'ADMIN' && payload.role !== 'AUDITOR') {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return parseSessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
