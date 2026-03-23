import { NextResponse } from 'next/server';

import { clearSessionCookie } from '../../../../lib/auth';

/**
 * Clears the auth session cookie for the current client.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
