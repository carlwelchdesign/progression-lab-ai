import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { prisma } from '../../../../lib/prisma';

/**
 * GET /api/promo-codes/config
 * Fetch promo code generation configuration.
 * Follows dependency inversion: caller depends on config shape, not default words.
 */
export async function GET(req: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(req);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let config = await prisma.promoCodeConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config) {
      // Initialize default config if not exists
      config = await prisma.promoCodeConfig.create({
        data: {
          id: 'singleton',
          prefixes: 'EARLY,BETA,LAUNCH,START,PROMO,GROWTH,ACCESS',
          suffixLength: 4,
          separator: '-',
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch config';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * PUT /api/promo-codes/config
 * Update promo code generation configuration.
 * Admin can customize prefixes for their business domain.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getAdminUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();

    // Validate prefixes format
    if (body.prefixes && typeof body.prefixes === 'string') {
      const prefixes = body.prefixes.split(',').map((p: string) => p.trim());
      if (prefixes.length === 0) {
        return NextResponse.json({ error: 'At least one prefix is required' }, { status: 400 });
      }
      if (prefixes.some((p: string) => p.length === 0)) {
        return NextResponse.json({ error: 'Empty prefixes are not allowed' }, { status: 400 });
      }
    }

    // Validate suffix length
    if (body.suffixLength && (body.suffixLength < 1 || body.suffixLength > 10)) {
      return NextResponse.json(
        { error: 'Suffix length must be between 1 and 10' },
        { status: 400 },
      );
    }

    const config = await prisma.promoCodeConfig.upsert({
      where: { id: 'singleton' },
      update: {
        prefixes: body.prefixes,
        suffixLength: body.suffixLength,
        separator: body.separator,
        updatedByUserId: user.id,
      },
      create: {
        id: 'singleton',
        prefixes: body.prefixes || 'EARLY,BETA,LAUNCH,START,PROMO,GROWTH,ACCESS',
        suffixLength: body.suffixLength || 4,
        separator: body.separator || '-',
        updatedByUserId: user.id,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update config';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
