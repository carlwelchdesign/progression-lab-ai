import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

import { PLAN_ENTITLEMENTS, hasReachedLimit, resolvePlan } from '../entitlements';

describe('entitlements', () => {
  describe('resolvePlan', () => {
    it('prefers a plan override over a paid subscription', () => {
      expect(
        resolvePlan({
          planOverride: SubscriptionPlan.COMP,
          subscriptionPlan: SubscriptionPlan.COMPOSER,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        }),
      ).toBe(SubscriptionPlan.COMP);
    });

    it('returns the paid subscription plan when the subscription is entitled', () => {
      expect(
        resolvePlan({
          subscriptionPlan: SubscriptionPlan.STUDIO,
          subscriptionStatus: SubscriptionStatus.PAST_DUE,
        }),
      ).toBe(SubscriptionPlan.STUDIO);
    });

    it('falls back to the session plan when no active subscription exists', () => {
      expect(
        resolvePlan({
          subscriptionPlan: SubscriptionPlan.COMPOSER,
          subscriptionStatus: SubscriptionStatus.CANCELED,
        }),
      ).toBe(SubscriptionPlan.SESSION);
    });
  });

  describe('hasReachedLimit', () => {
    it('returns false for unlimited limits', () => {
      expect(hasReachedLimit(null, 999)).toBe(false);
    });

    it('returns true once usage meets the limit', () => {
      expect(hasReachedLimit(10, 10)).toBe(true);
    });
  });

  it('keeps comp users on studio-level entitlements', () => {
    expect(PLAN_ENTITLEMENTS[SubscriptionPlan.COMP]).toEqual(
      PLAN_ENTITLEMENTS[SubscriptionPlan.STUDIO],
    );
  });
});
