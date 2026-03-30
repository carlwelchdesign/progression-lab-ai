import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../../lib/auth';
import { createRegistrationOptions } from '../../../../../lib/webauthn';
import { WebAuthnFlowType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const options = await createRegistrationOptions({
      user: {
        id: session.userId,
        email: session.email,
        name: null,
      },
      flowType: WebAuthnFlowType.CUSTOMER_REGISTRATION,
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error('WebAuthn registration options failed:', error);
    return NextResponse.json({ message: 'Failed to generate registration options' }, { status: 500 });
  }
}
