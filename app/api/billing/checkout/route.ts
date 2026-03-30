import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import {
  ensureStripeCustomerForUser,
  getAppUrl,
  getBillingInterval,
  getCheckoutPriceId,
  isBillablePlan,
  isCheckoutInterval,
} from '../../../../lib/billing';
import { checkCsrfToken } from '../../../../lib/csrf';
import { prisma } from '../../../../lib/prisma';
import { getStripeClient } from '../../../../lib/stripe';

type CheckoutRequestBody = {
  plan?: unknown;
  interval?: unknown;
};

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

    const body = (await request.json()) as CheckoutRequestBody;
    const plan = typeof body.plan === 'string' ? body.plan : '';
    const interval = typeof body.interval === 'string' ? body.interval : '';

    if (!isBillablePlan(plan) || !isCheckoutInterval(interval)) {
      return NextResponse.json({ message: 'Invalid billing selection' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const stripeCustomerId = await ensureStripeCustomerForUser({
      id: user.id,
      email: user.email,
      name: user.name,
      stripeCustomerId: user.stripeCustomerId,
    });
    const stripe = getStripeClient();
    const appUrl = getAppUrl(request.nextUrl.origin);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: getCheckoutPriceId(plan, interval),
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${appUrl}/settings/billing?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: {
        userId: user.id,
        plan,
        billingInterval: getBillingInterval(interval),
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Failed to create Stripe checkout session:', error);
    return NextResponse.json({ message: 'Failed to start checkout' }, { status: 500 });
  }
}
