import { BillingInterval, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

import {
  getAppUrl,
  getBillingInterval,
  getCheckoutPriceId,
  isBillablePlan,
  isCheckoutInterval,
  mapStripeSubscriptionStatus,
  resolvePlanFromPriceId,
} from '../billing';

describe('billing helpers', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.STRIPE_COMPOSER_MONTHLY_PRICE_ID = 'price_composer_month';
    process.env.STRIPE_COMPOSER_YEARLY_PRICE_ID = 'price_composer_year';
    process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID = 'price_studio_month';
    process.env.STRIPE_STUDIO_YEARLY_PRICE_ID = 'price_studio_year';
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('validates billable plans and intervals', () => {
    expect(isBillablePlan(SubscriptionPlan.COMPOSER)).toBe(true);
    expect(isBillablePlan(SubscriptionPlan.STUDIO)).toBe(true);
    expect(isBillablePlan(SubscriptionPlan.SESSION)).toBe(false);
    expect(isCheckoutInterval('monthly')).toBe(true);
    expect(isCheckoutInterval('yearly')).toBe(true);
    expect(isCheckoutInterval('weekly')).toBe(false);
  });

  it('maps checkout intervals to Prisma billing intervals', () => {
    expect(getBillingInterval('monthly')).toBe(BillingInterval.MONTHLY);
    expect(getBillingInterval('yearly')).toBe(BillingInterval.YEARLY);
  });

  it('resolves checkout price ids from the environment', () => {
    expect(getCheckoutPriceId(SubscriptionPlan.COMPOSER, 'monthly')).toBe('price_composer_month');
    expect(getCheckoutPriceId(SubscriptionPlan.STUDIO, 'yearly')).toBe('price_studio_year');
  });

  it('resolves a plan from a Stripe price id', () => {
    expect(resolvePlanFromPriceId('price_composer_year')).toBe(SubscriptionPlan.COMPOSER);
    expect(resolvePlanFromPriceId('price_studio_month')).toBe(SubscriptionPlan.STUDIO);
    expect(resolvePlanFromPriceId('price_unknown')).toBeNull();
  });

  it('maps Stripe subscription statuses to Prisma statuses', () => {
    expect(mapStripeSubscriptionStatus('active')).toBe(SubscriptionStatus.ACTIVE);
    expect(mapStripeSubscriptionStatus('trialing')).toBe(SubscriptionStatus.TRIALING);
    expect(mapStripeSubscriptionStatus('past_due')).toBe(SubscriptionStatus.PAST_DUE);
    expect(mapStripeSubscriptionStatus('unpaid')).toBe(SubscriptionStatus.PAST_DUE);
    expect(mapStripeSubscriptionStatus('canceled')).toBe(SubscriptionStatus.CANCELED);
    expect(mapStripeSubscriptionStatus('paused')).toBe(SubscriptionStatus.CANCELED);
  });

  it('prefers explicit app urls over the request origin fallback', () => {
    process.env.APP_URL = 'https://progressionlab.app';
    expect(getAppUrl('http://localhost:3000')).toBe('https://progressionlab.app');

    delete process.env.APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://preview.progressionlab.app';
    expect(getAppUrl('http://localhost:3000')).toBe('https://preview.progressionlab.app');

    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getAppUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });
});
