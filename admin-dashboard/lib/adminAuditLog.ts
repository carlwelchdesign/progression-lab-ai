import type { SubscriptionPlan } from '@prisma/client';

import type { AdminUser } from './adminAccess';
import { prisma } from './prisma';
import type { SubscriptionTierConfig } from './subscriptionConfig';

export const AUDIT_ACTION_TIER_CONFIG_UPDATED = 'UPDATE_SUBSCRIPTION_TIER_CONFIG';
export const AUDIT_TARGET_TYPE_TIER_CONFIG = 'SUBSCRIPTION_TIER_CONFIG';

export type TierConfigAuditMetadata = {
  updatedFields: string[];
  before: SubscriptionTierConfig;
  after: SubscriptionTierConfig;
};

export async function recordTierConfigUpdateAuditLog(params: {
  actor: AdminUser;
  plan: SubscriptionPlan;
  updatedFields: string[];
  before: SubscriptionTierConfig;
  after: SubscriptionTierConfig;
}): Promise<void> {
  const metadata: TierConfigAuditMetadata = {
    updatedFields: params.updatedFields,
    before: params.before,
    after: params.after,
  };

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: params.actor.id,
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      action: AUDIT_ACTION_TIER_CONFIG_UPDATED,
      targetType: AUDIT_TARGET_TYPE_TIER_CONFIG,
      targetId: params.plan,
      metadata,
    },
  });
}

export async function getRecentTierConfigAuditLogs(limit: number) {
  return prisma.adminAuditLog.findMany({
    where: {
      targetType: AUDIT_TARGET_TYPE_TIER_CONFIG,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}
