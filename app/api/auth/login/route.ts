import { NextRequest, NextResponse } from 'next/server';

import {
  clearPendingAuthCookie,
  createPendingAuthToken,
  createSessionToken,
  normalizeAuthCredentials,
  setPendingAuthCookie,
  setSessionCookie,
  validateAuthCredentials,
  verifyPassword,
} from '../../../../lib/auth';
import { issueCsrfToken } from '../../../../lib/csrf';
import { createRateLimitResponse } from '../../../../lib/rateLimiting';
import { createAuthenticationOptions, listActiveCredentials } from '../../../../lib/webauthn';
import { WebAuthnFlowType } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Authenticates a user and returns user profile with session cookie.
 * Includes rate limiting (5 attempts per 15 minutes) to prevent brute force attacks.
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const rateLimitResponse = createRateLimitResponse(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const payload = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      preferPassword?: boolean;
    };
    const credentials = normalizeAuthCredentials(payload);
    const preferPassword = payload.preferPassword === true;

    if (!credentials.email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(credentials.email) || credentials.email.length > 254) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    const { email, password } = credentials;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const activeCredentials = await listActiveCredentials(user.id);

    if (activeCredentials.length > 0 && !preferPassword) {
      const response = NextResponse.json({
        status: 'MFA_REQUIRED',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        options: await createAuthenticationOptions({
          userId: user.id,
          flowType: WebAuthnFlowType.ADMIN_AUTHENTICATION,
        }),
      });

      setPendingAuthCookie(response, createPendingAuthToken(user.id, user.email, user.role));
      return response;
    }

    const validationError = validateAuthCredentials(credentials);
    if (validationError || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const response = NextResponse.json({
      status: 'AUTHENTICATED',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    clearPendingAuthCookie(response);
    setSessionCookie(response, createSessionToken(user.id, user.email, user.role));
    issueCsrfToken(response, request);
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
