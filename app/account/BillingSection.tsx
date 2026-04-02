import { UsageEventType } from '@prisma/client';

import BillingPageContent, {
  type BillingStatusResponse,
} from '../../features/billing/components/BillingPageContent';
import { getBillingStatusForUser } from '../../lib/billing';
import { getAccessContextForSession } from '../../lib/entitlements';
import { getCurrentMonthUsageCount } from '../../lib/usage';
import type { UserRole } from '../../lib/auth';

type BillingSectionProps = {
  session: {
    userId: string;
    role: UserRole;
  };
};

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.toISOString();
}

export default async function BillingSection({ session }: BillingSectionProps) {
  const accessContext = await getAccessContextForSession(session);

  if (!accessContext) {
    return <BillingPageContent suppressUnauthenticatedNotice />;
  }

  const [{ user }, aiGenerationsUsed] = await Promise.all([
    getBillingStatusForUser(session.userId),
    getCurrentMonthUsageCount(session.userId, UsageEventType.AI_GENERATION),
  ]);

  if (!user) {
    return <BillingPageContent suppressUnauthenticatedNotice />;
  }

  const initialBillingStatus: BillingStatusResponse = {
    plan: accessContext.plan,
    entitlements: accessContext.entitlements,
    planOverride: accessContext.planOverride,
    planOverrideExpiresAt: toIsoString(accessContext.planOverrideExpiresAt),
    subscriptionStatus: accessContext.subscriptionStatus,
    billing: {
      stripeCustomerId: user.stripeCustomerId,
      subscription: user.subscription
        ? {
            plan: user.subscription.plan,
            status: user.subscription.status,
            billingInterval: user.subscription.billingInterval,
            currentPeriodStart: toIsoString(user.subscription.currentPeriodStart),
            currentPeriodEnd: toIsoString(user.subscription.currentPeriodEnd),
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
            stripePriceId: user.subscription.stripePriceId,
            stripeSubscriptionId: user.subscription.stripeSubscriptionId,
          }
        : null,
    },
    usage: {
      aiGenerationsUsed,
      aiGenerationsLimit: accessContext.entitlements.aiGenerationsPerMonth,
    },
  };

  return (
    <BillingPageContent suppressUnauthenticatedNotice initialBillingStatus={initialBillingStatus} />
  );
}
