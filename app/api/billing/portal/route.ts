import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { getAppUrl } from '../../../../lib/billing';
import { checkCsrfToken } from '../../../../lib/csrf';
import { prisma } from '../../../../lib/prisma';
import { getStripeClient } from '../../../../lib/stripe';

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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ message: 'No billing account found' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppUrl(request.nextUrl.origin)}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Failed to create Stripe billing portal session:', error);
    return NextResponse.json({ message: 'Failed to open billing portal' }, { status: 500 });
  }
}
