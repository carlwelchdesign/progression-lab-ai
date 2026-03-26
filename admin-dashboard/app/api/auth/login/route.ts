import { NextRequest, NextResponse } from 'next/server';

import {
  createSessionToken,
  normalizeAuthPayload,
  setSessionCookie,
  verifyPassword,
} from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const credentials = normalizeAuthPayload(await request.json());

    if (!credentials.email || !credentials.password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: credentials.email } });

    if (
      !user ||
      user.role === undefined ||
      (user.role !== 'ADMIN' && user.role !== 'AUDITOR') ||
      !user.passwordHash ||
      !verifyPassword(credentials.password, user.passwordHash)
    ) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    setSessionCookie(response, createSessionToken(user.id, user.email, user.role));
    return response;
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
