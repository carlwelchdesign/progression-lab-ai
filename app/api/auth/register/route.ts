import { NextRequest, NextResponse } from 'next/server';

import {
  createSessionToken,
  hashPassword,
  normalizeAuthCredentials,
  setSessionCookie,
  validateAuthCredentials,
} from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

/**
 * Registers a new user and sets a signed session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const credentials = normalizeAuthCredentials(await request.json());
    const validationError = validateAuthCredentials(credentials, { minPasswordLength: 8 });

    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { email, password, name } = credentials;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
      },
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );

    setSessionCookie(response, createSessionToken(user.id, user.email));
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}
