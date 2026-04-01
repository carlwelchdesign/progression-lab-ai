import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../../lib/auth';
import { checkCsrfToken } from '../../../../../lib/csrf';
import { listActiveCredentials } from '../../../../../lib/webauthn';
import { prisma } from '../../../../../lib/prisma';
import type { StoredWebAuthnCredential } from '@carlwelchdesign/webauthn-core';

function serializeCredential(c: StoredWebAuthnCredential) {
  return {
    id: c.id,
    credentialId: c.credentialId,
    label: c.label,
    deviceType: c.deviceType,
    backedUp: c.backedUp,
    transports: c.transports,
    createdAt: c.createdAt,
    lastUsedAt: c.lastUsedAt,
  };
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 });
  }

  const credentials = await listActiveCredentials(session.userId);
  return NextResponse.json({ credentials: credentials.map(serializeCredential) });
}

export async function DELETE(request: NextRequest) {
  try {
    const csrfError = checkCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as { credentialId?: string };
    if (!payload.credentialId) {
      return NextResponse.json(
        { code: 'WEBAUTHN_CREDENTIAL_ID_REQUIRED', message: 'credentialId is required' },
        { status: 400 },
      );
    }

    const credential = await prisma.webAuthnCredential.findFirst({
      where: {
        id: payload.credentialId,
        userId: session.userId,
        revokedAt: null,
      },
    });

    if (!credential) {
      return NextResponse.json(
        { code: 'WEBAUTHN_CREDENTIAL_NOT_FOUND', message: 'Credential not found' },
        { status: 404 },
      );
    }

    await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('WebAuthn credential revoke failed:', error);
    return NextResponse.json(
      { code: 'WEBAUTHN_CREDENTIAL_REVOKE_FAILED', message: 'Failed to revoke credential' },
      { status: 500 },
    );
  }
}
