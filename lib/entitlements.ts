import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

import type { UserRole } from './auth';
import { prisma } from './prisma';

export type PlanEntitlements = {
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUsePremiumAiModel: boolean;
};

export type AccessContext = {
  userId: string;
  role: UserRole;
  plan: SubscriptionPlan;
  entitlements: PlanEntitlements;
  planOverride: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
};

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  [SubscriptionPlan.SESSION]: {
    aiGenerationsPerMonth: 10,
    maxSavedProgressions: 10,
    maxSavedArrangements: 5,
    maxPublicShares: 2,
    canExportMidi: false,
    canExportPdf: false,
    canSharePublicly: true,
    canUsePremiumAiModel: false,
  },
  [SubscriptionPlan.COMPOSER]: {
    aiGenerationsPerMonth: 50,
    maxSavedProgressions: 50,
    maxSavedArrangements: 25,
    maxPublicShares: 10,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: true,
    canUsePremiumAiModel: false,
  },
  [SubscriptionPlan.STUDIO]: {
    aiGenerationsPerMonth: 200,
    maxSavedProgressions: null,
    maxSavedArrangements: null,
    maxPublicShares: null,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: true,
    canUsePremiumAiModel: true,
  },
  [SubscriptionPlan.COMP]: {
    aiGenerationsPerMonth: 200,
    maxSavedProgressions: null,
    maxSavedArrangements: null,
    maxPublicShares: null,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: true,
    canUsePremiumAiModel: true,
  },
};

function isSubscriptionEntitled(status: SubscriptionStatus | null | undefined): boolean {
  return (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.TRIALING ||
    status === SubscriptionStatus.PAST_DUE
  );
}

export function hasReachedLimit(limit: number | null, used: number): boolean {
  return limit !== null && used >= limit;
}

export function resolvePlan(options: {
  planOverride?: SubscriptionPlan | null;
  subscriptionPlan?: SubscriptionPlan | null;
  subscriptionStatus?: SubscriptionStatus | null;
}): SubscriptionPlan {
  if (options.planOverride) {
    return options.planOverride;
  }

  if (options.subscriptionPlan && isSubscriptionEntitled(options.subscriptionStatus)) {
    return options.subscriptionPlan;
  }

  return SubscriptionPlan.SESSION;
}

export async function getAccessContextForSession(session: {
  userId: string;
  role: UserRole;
}): Promise<AccessContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      planOverride: true,
      subscription: {
        select: {
          plan: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const plan = resolvePlan({
    planOverride: user.planOverride,
    subscriptionPlan: user.subscription?.plan,
    subscriptionStatus: user.subscription?.status,
  });

  return {
    userId: session.userId,
    role: session.role,
    plan,
    entitlements: PLAN_ENTITLEMENTS[plan],
    planOverride: user.planOverride,
    subscriptionStatus: user.subscription?.status ?? null,
  };
}
