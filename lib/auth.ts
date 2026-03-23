import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'progressionlab_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Signed session payload stored in the auth cookie.
 */
type SessionPayload = {
  userId: string;
  email: string;
  exp: number;
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
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    // This will be caught by the API route try/catch and returned as a 500,
    // which makes it obvious in Vercel logs that AUTH_SECRET is missing.
    throw new Error(
      'Server misconfiguration: AUTH_SECRET environment variable is not set. ' +
        'Add AUTH_SECRET to your Vercel environment variables and redeploy.',
    );
  }

  return 'dev-only-auth-secret-change-me';
}

function sign(value: string): string {
  return base64UrlEncode(createHmac('sha256', getAuthSecret()).update(value).digest());
}

/**
 * Hashes a plaintext password using scrypt + random salt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash.
 */
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

/**
 * Creates an HMAC-signed session token for cookie storage.
 */
export function createSessionToken(userId: string, email: string): string {
  const payload: SessionPayload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Parses and validates a session token from cookie value.
 */
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

  const signaturesMatch = timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer);

  if (!signaturesMatch) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.email || !payload.exp) {
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

/**
 * Reads and verifies the current session from request cookies.
 */
export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return parseSessionToken(token);
}

/**
 * Sets the signed session cookie on a response.
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the session cookie on a response.
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
