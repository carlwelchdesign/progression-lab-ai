import { NextRequest, NextResponse } from 'next/server';

import { clearPendingAuthCookie, clearSessionCookie } from '../../../../lib/auth';
import { checkCsrfToken, clearCsrfToken } from '../../../../lib/csrf';

export async function POST(request: NextRequest) {
  const csrfError = checkCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const response = NextResponse.json({ ok: true });
  clearPendingAuthCookie(response);
  clearSessionCookie(response);
  clearCsrfToken(response);
  return response;
}
