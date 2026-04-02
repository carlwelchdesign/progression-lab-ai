import { NextRequest, NextResponse } from 'next/server';

import {
  clearPendingAuthCookie,
  createPendingAuthToken,
  createSessionToken,
  normalizeAuthPayload,
  setPendingAuthCookie,
  setSessionCookie,
  validateAdminAuthPayload,
  verifyPassword,
} from '../../../../lib/auth';
import { issueCsrfToken } from '../../../../lib/csrf';
import { createRateLimitResponse } from '../../../../lib/rateLimiting';
import {
  createAuthenticationOptions,
  createRegistrationOptions,
  listActiveCredentials,
} from '../../../../lib/webauthn';
import { prisma } from '../../../../lib/prisma';
import { WebAuthnFlowType } from '@prisma/client';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasActiveBypass(until: Date | null): boolean {
  return until != null && until.getTime() > Date.now();
}

/**
 * Admin login endpoint with rate limiting to prevent brute force attacks.
 * Rate limit: 5 attempts per 15 minutes per IP address
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = createRateLimitResponse(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const payload = (await request.json()) as {
      email?: string;
      password?: string;
      preferPassword?: boolean;
    };
    const credentials = normalizeAuthPayload(payload);
    const preferPassword = payload.preferPassword === true;

    if (!EMAIL_PATTERN.test(credentials.email) || credentials.email.length > 254) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: credentials.email } });

    if (!user || user.role === undefined || (user.role !== 'ADMIN' && user.role !== 'AUDITOR')) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const bypassActive = hasActiveBypass(user.mfaBypassUntil);
    const activeCredentials = await listActiveCredentials(user.id);
    const hasActiveCredentials = activeCredentials.length > 0;

    if (hasActiveCredentials && !preferPassword) {
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

    const requiresWebAuthn =
      user.role === 'ADMIN'
        ? hasActiveCredentials
          ? !bypassActive && !preferPassword
          : true
        : !bypassActive && hasActiveCredentials && !preferPassword;

    const passwordPayloadIsValid = validateAdminAuthPayload(credentials);
    if (
      !passwordPayloadIsValid ||
      !user.passwordHash ||
      !verifyPassword(credentials.password, user.passwordHash)
    ) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!requiresWebAuthn) {
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
    }

    const response = NextResponse.json({
      status: 'ENROLLMENT_REQUIRED',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      options: await createRegistrationOptions({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        flowType: WebAuthnFlowType.ADMIN_BOOTSTRAP_REGISTRATION,
        preferredAuthenticatorType: 'securityKey',
        label: 'Admin security key',
      }),
    });

    setPendingAuthCookie(response, createPendingAuthToken(user.id, user.email, user.role));
    return response;
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
