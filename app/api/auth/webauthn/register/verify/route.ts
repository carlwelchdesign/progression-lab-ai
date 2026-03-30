import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../../lib/auth';
import { checkCsrfToken } from '../../../../../lib/csrf';
import { verifyRegistrationAndStoreCredential } from '../../../../../lib/webauthn';
import { WebAuthnFlowType } from '@prisma/client';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const csrfError = checkCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as {
      response?: RegistrationResponseJSON;
      label?: string | null;
    };
    if (!payload.response) {
      return NextResponse.json({ message: 'Registration response is required' }, { status: 400 });
    }

    const { credential } = await verifyRegistrationAndStoreCredential({
      userId: session.userId,
      flowType: WebAuthnFlowType.CUSTOMER_REGISTRATION,
      response: payload.response,
      label: payload.label,
    });

    return NextResponse.json({
      credential: {
        id: credential.id,
        credentialId: credential.credentialId,
        label: credential.label,
        deviceType: credential.deviceType,
        backedUp: credential.backedUp,
        createdAt: credential.createdAt,
      },
    });
  } catch (error) {
    console.error('WebAuthn registration verify failed:', error);
    return NextResponse.json({ message: 'WebAuthn enrollment failed' }, { status: 500 });
  }
}
