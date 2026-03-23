import { NextRequest, NextResponse } from 'next/server';

import { createSessionToken, setSessionCookie, verifyPassword } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

/**
 * Authenticates a user and returns user profile with session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    setSessionCookie(response, createSessionToken(user.id, user.email));
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
