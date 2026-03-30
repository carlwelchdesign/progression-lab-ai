import type {
  BillingInterval,
  SubscriptionPlan,
  SubscriptionStatus,
  UsageEventType,
} from '@prisma/client';
import Stripe from 'stripe';

import { prisma } from './prisma';
import { getStripeClient } from './stripe';
import { getCurrentMonthUsageCount } from './usage';

export type CheckoutInterval = 'monthly' | 'yearly';
export type BillablePlan = Extract<SubscriptionPlan, 'COMPOSER' | 'STUDIO'>;

type StripePriceEnvMap = Record<BillablePlan, Record<CheckoutInterval, string>>;

const BILLABLE_PLANS = ['COMPOSER', 'STUDIO'] as const satisfies readonly BillablePlan[];
const BILLING_INTERVAL_BY_CHECKOUT_INTERVAL = {
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
} as const satisfies Record<CheckoutInterval, BillingInterval>;
const SUBSCRIPTION_STATUS_BY_STRIPE_STATUS = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST_DUE',
  unpaid: 'PAST_DUE',
  incomplete: 'PAST_DUE',
  canceled: 'CANCELED',
  incomplete_expired: 'CANCELED',
  paused: 'CANCELED',
} as const satisfies Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>>;
const AI_GENERATION_USAGE_EVENT = 'AI_GENERATION' as UsageEventType;

const STRIPE_PRICE_ENV_BY_PLAN: StripePriceEnvMap = {
  COMPOSER: {
    monthly: 'STRIPE_COMPOSER_MONTHLY_PRICE_ID',
    yearly: 'STRIPE_COMPOSER_YEARLY_PRICE_ID',
  },
  STUDIO: {
    monthly: 'STRIPE_STUDIO_MONTHLY_PRICE_ID',
    yearly: 'STRIPE_STUDIO_YEARLY_PRICE_ID',
  },
};

export function isBillablePlan(value: string): value is BillablePlan {
  return value === 'COMPOSER' || value === 'STUDIO';
}

export function isCheckoutInterval(value: string): value is CheckoutInterval {
  return value === 'monthly' || value === 'yearly';
}

export function getBillingInterval(interval: CheckoutInterval): BillingInterval {
  return BILLING_INTERVAL_BY_CHECKOUT_INTERVAL[interval];
}

export function getPrimaryPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price.id ?? null;
}

export function getCheckoutPriceId(plan: BillablePlan, interval: CheckoutInterval): string {
  const envName = STRIPE_PRICE_ENV_BY_PLAN[plan][interval];
  const value = process.env[envName];

  if (!value) {
    throw new Error(`${envName} is not configured`);
  }

  return value;
}

export function resolvePlanFromPriceId(priceId: string | null | undefined): BillablePlan | null {
  if (!priceId) {
    return null;
  }

  for (const plan of BILLABLE_PLANS) {
    for (const interval of ['monthly', 'yearly'] as const) {
      if (process.env[STRIPE_PRICE_ENV_BY_PLAN[plan][interval]] === priceId) {
        return plan;
      }
    }
  }

  return null;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  return SUBSCRIPTION_STATUS_BY_STRIPE_STATUS[status] ?? 'CANCELED';
}

export function getAppUrl(origin?: string): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (origin) {
    return origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export async function ensureStripeCustomerForUser(user: {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function updateUserStripeCustomerId(options: {
  userId: string;
  stripeCustomerId: string;
}) {
  return prisma.user.update({
    where: { id: options.userId },
    data: { stripeCustomerId: options.stripeCustomerId },
  });
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const stripeCustomerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const stripePriceId = getPrimaryPriceId(subscription);
  const plan = resolvePlanFromPriceId(stripePriceId);

  if (!plan) {
    throw new Error(`Unsupported Stripe price ID: ${stripePriceId ?? 'missing'}`);
  }

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`No user found for Stripe customer ${stripeCustomerId}`);
  }

  const interval = subscription.items.data[0]?.price.recurring?.interval;
  const billingInterval = interval === 'year' ? 'YEARLY' : interval === 'month' ? 'MONTHLY' : null;

  return prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: stripePriceId ?? undefined,
      plan,
      billingInterval: billingInterval ?? undefined,
      status: mapStripeSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: stripePriceId ?? undefined,
      plan,
      billingInterval,
      status: mapStripeSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function getBillingStatusForUser(userId: string) {
  const [user, aiGenerationsUsed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        planOverride: true,
        stripeCustomerId: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            billingInterval: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            stripePriceId: true,
            stripeSubscriptionId: true,
          },
        },
      },
    }),
    getCurrentMonthUsageCount(userId, AI_GENERATION_USAGE_EVENT),
  ]);

  return {
    user,
    aiGenerationsUsed,
  };
}
