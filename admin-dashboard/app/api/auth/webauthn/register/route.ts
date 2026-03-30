import { NextRequest, NextResponse } from 'next/server';

import {
  clearPendingAuthCookie,
  createSessionToken,
  getPendingAuthFromRequest,
  setSessionCookie,
} from '../../../../../lib/auth';
import { issueCsrfToken } from '../../../../../lib/csrf';
import { verifyRegistrationAndStoreCredential } from '../../../../../lib/webauthn';
import { WebAuthnFlowType } from '@prisma/client';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const pendingAuth = getPendingAuthFromRequest(request);
    if (!pendingAuth || pendingAuth.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Pending admin enrollment required' }, { status: 401 });
    }

    const payload = (await request.json()) as {
      response?: RegistrationResponseJSON;
      label?: string | null;
    };
    if (!payload.response) {
      return NextResponse.json({ message: 'Registration response is required' }, { status: 400 });
    }

    await verifyRegistrationAndStoreCredential({
      userId: pendingAuth.userId,
      flowType: WebAuthnFlowType.ADMIN_BOOTSTRAP_REGISTRATION,
      response: payload.response,
      label: payload.label,
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
    console.error('Admin WebAuthn registration failed:', error);
    return NextResponse.json({ message: 'WebAuthn enrollment failed' }, { status: 401 });
  }
}
