import { NextRequest, NextResponse } from 'next/server';

import {
  clearPendingAuthCookie,
  createSessionToken,
  getPendingAuthFromRequest,
  setSessionCookie,
} from '../../../../../lib/auth';
import { issueCsrfToken } from '../../../../../lib/csrf';
import { verifyAuthenticationResponseForUser } from '../../../../../lib/webauthn';
import { WebAuthnFlowType } from '@prisma/client';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const pendingAuth = getPendingAuthFromRequest(request);
    if (!pendingAuth || pendingAuth.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Pending admin authentication required' }, { status: 401 });
    }

    const payload = (await request.json()) as { response?: AuthenticationResponseJSON };
    if (!payload.response) {
      return NextResponse.json({ message: 'Authentication response is required' }, { status: 400 });
    }

    await verifyAuthenticationResponseForUser({
      userId: pendingAuth.userId,
      flowType: WebAuthnFlowType.ADMIN_AUTHENTICATION,
      response: payload.response,
    });

    const response = NextResponse.json({
      status: 'AUTHENTICATED',
      user: {
        id: pendingAuth.userId,
        email: pendingAuth.email,
        role: pendingAuth.role,
      },
    });

    clearPendingAuthCookie(response);
    setSessionCookie(
      response,
      createSessionToken(pendingAuth.userId, pendingAuth.email, pendingAuth.role),
    );
    issueCsrfToken(response, request);
    return response;
  } catch (error) {
    console.error('Admin WebAuthn verification failed:', error);
    return NextResponse.json({ message: 'WebAuthn verification failed' }, { status: 401 });
  }
}
