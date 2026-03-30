import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { syncStripeSubscription, updateUserStripeCustomerId } from '../../../../lib/billing';
import { getStripeClient, getStripeWebhookSecret } from '../../../../lib/stripe';

export const runtime = 'nodejs';

async function syncInvoiceSubscription(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : (invoice.subscription?.id ?? null);

  if (!subscriptionId) {
    return;
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription);
}

export async function POST(request: NextRequest) {
  try {
    const stripeSignature = request.headers.get('stripe-signature');
    if (!stripeSignature) {
      return NextResponse.json({ message: 'Missing Stripe signature' }, { status: 400 });
    }

    const body = await request.text();
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, stripeSignature, getStripeWebhookSecret());

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (
          session.client_reference_id &&
          typeof session.customer === 'string' &&
          session.mode === 'subscription'
        ) {
          await updateUserStripeCustomerId({
            userId: session.client_reference_id,
            stripeCustomerId: session.customer,
          });
        }

        if (typeof session.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncStripeSubscription(subscription);
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded': {
        await syncInvoiceSubscription(event.data.object as Stripe.Invoice);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handling failed:', error);
    return NextResponse.json({ message: 'Webhook handling failed' }, { status: 400 });
  }
}
