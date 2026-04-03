import { Prisma, type SubscriptionPlan } from '@prisma/client';

import type { AdminUser } from './adminAccess';
import { prisma } from './prisma';
import type { SubscriptionTierConfig } from './subscriptionConfig';

export const AUDIT_ACTION_TIER_CONFIG_UPDATED = 'UPDATE_SUBSCRIPTION_TIER_CONFIG';
export const AUDIT_TARGET_TYPE_TIER_CONFIG = 'SUBSCRIPTION_TIER_CONFIG';
export const AUDIT_TARGET_TYPE_PROMPT_VERSION = 'PROMPT_VERSION';
export const AUDIT_ACTION_PROMPT_DRAFT_SAVED = 'SAVE_PROMPT_DRAFT';
export const AUDIT_ACTION_PROMPT_PUBLISHED = 'PUBLISH_PROMPT_DRAFT';
export const AUDIT_ACTION_PROMPT_ROLLED_BACK = 'ROLLBACK_PROMPT_VERSION';
export const AUDIT_TARGET_TYPE_MARKETING_CONTENT = 'MARKETING_CONTENT';
export const AUDIT_ACTION_MARKETING_CONTENT_DRAFT_SAVED = 'SAVE_MARKETING_CONTENT_DRAFT';
export const AUDIT_ACTION_MARKETING_CONTENT_PUBLISHED = 'PUBLISH_MARKETING_CONTENT_DRAFT';
export const AUDIT_ACTION_MARKETING_CONTENT_ROLLED_BACK = 'ROLLBACK_MARKETING_CONTENT_VERSION';
export const AUDIT_ACTION_MARKETING_CONTENT_TRANSLATION_GENERATED =
  'GENERATE_MARKETING_CONTENT_TRANSLATION_DRAFT';
export const AUDIT_TARGET_TYPE_PLAN_VERSION = 'SUBSCRIPTION_PLAN_VERSION';
export const AUDIT_ACTION_PLAN_DRAFT_SAVED = 'SAVE_PLAN_DRAFT';
export const AUDIT_ACTION_PLAN_PUBLISHED = 'PUBLISH_PLAN_DRAFT';
export const AUDIT_ACTION_PLAN_ROLLED_BACK = 'ROLLBACK_PLAN_VERSION';
export const AUDIT_TARGET_TYPE_PROMO_CODE = 'PROMO_CODE';
export const AUDIT_ACTION_PROMO_CODE_CREATED = 'CREATE_PROMO_CODE';
export const AUDIT_ACTION_PROMO_CODE_UPDATED = 'UPDATE_PROMO_CODE';
export const AUDIT_ACTION_PROMO_CODE_REVOKED = 'REVOKE_PROMO_CODE';
export const AUDIT_TARGET_TYPE_BOARDROOM = 'AI_BOARDROOM';
export const AUDIT_ACTION_BOARDROOM_RUN_EXECUTED = 'EXECUTE_BOARDROOM_RUN';
export const AUDIT_TARGET_TYPE_BOARDROOM_BOARD = 'AI_BOARDROOM_BOARD';
export const AUDIT_ACTION_BOARDROOM_BOARD_CREATED = 'CREATE_AI_BOARDROOM_BOARD';
export const AUDIT_ACTION_BOARDROOM_BOARD_UPDATED = 'UPDATE_AI_BOARDROOM_BOARD';
export const AUDIT_ACTION_BOARDROOM_BOARD_DELETED = 'DELETE_AI_BOARDROOM_BOARD';

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

export async function recordPromptVersionAuditLog(params: {
  actor: AdminUser;
  action:
    | typeof AUDIT_ACTION_PROMPT_DRAFT_SAVED
    | typeof AUDIT_ACTION_PROMPT_PUBLISHED
    | typeof AUDIT_ACTION_PROMPT_ROLLED_BACK;
  promptKey: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const metadata = params.metadata as Prisma.InputJsonValue | undefined;

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: params.actor.id,
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      action: params.action,
      targetType: AUDIT_TARGET_TYPE_PROMPT_VERSION,
      targetId: params.promptKey,
      metadata,
    },
  });
}

export async function recordMarketingContentAuditLog(params: {
  actor: AdminUser;
  action:
    | typeof AUDIT_ACTION_MARKETING_CONTENT_DRAFT_SAVED
    | typeof AUDIT_ACTION_MARKETING_CONTENT_PUBLISHED
    | typeof AUDIT_ACTION_MARKETING_CONTENT_ROLLED_BACK
    | typeof AUDIT_ACTION_MARKETING_CONTENT_TRANSLATION_GENERATED;
  contentKey: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const metadata = params.metadata as Prisma.InputJsonValue | undefined;

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: params.actor.id,
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      action: params.action,
      targetType: AUDIT_TARGET_TYPE_MARKETING_CONTENT,
      targetId: params.contentKey,
      metadata,
    },
  });
}

export async function recordPlanVersionAuditLog(params: {
  actor: AdminUser;
  action:
    | typeof AUDIT_ACTION_PLAN_DRAFT_SAVED
    | typeof AUDIT_ACTION_PLAN_PUBLISHED
    | typeof AUDIT_ACTION_PLAN_ROLLED_BACK;
  planId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const metadata = params.metadata as Prisma.InputJsonValue | undefined;

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: params.actor.id,
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      action: params.action,
      targetType: AUDIT_TARGET_TYPE_PLAN_VERSION,
      targetId: params.planId,
      metadata,
    },
  });
}

export async function recordBoardroomRunAuditLog(params: {
  actor: AdminUser;
  action: typeof AUDIT_ACTION_BOARDROOM_RUN_EXECUTED;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const metadata = params.metadata as Prisma.InputJsonValue | undefined;

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: params.actor.id,
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      action: params.action,
      targetType: AUDIT_TARGET_TYPE_BOARDROOM,
      targetId: params.targetId,
      metadata,
    },
  });
}

export async function recordBoardroomBoardAuditLog(params: {
  actor: AdminUser;
  action:
    | typeof AUDIT_ACTION_BOARDROOM_BOARD_CREATED
    | typeof AUDIT_ACTION_BOARDROOM_BOARD_UPDATED
    | typeof AUDIT_ACTION_BOARDROOM_BOARD_DELETED;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const metadata = params.metadata as Prisma.InputJsonValue | undefined;

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: params.actor.id,
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      action: params.action,
      targetType: AUDIT_TARGET_TYPE_BOARDROOM_BOARD,
      targetId: params.targetId,
      metadata,
    },
  });
}
