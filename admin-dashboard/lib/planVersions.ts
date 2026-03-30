import { Decimal } from '@prisma/client/runtime/library';

import { prisma } from './prisma';

// Supported plan IDs — must match values in SubscriptionPlanVersion.planId
export const PLAN_IDS = ['SESSION', 'COMPOSER', 'STUDIO', 'COMP'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanVersionRecord = {
  id: string;
  planId: string;
  displayName: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyStripePriceId: string | null;
  yearlyStripePriceId: string | null;
  gptModel: string;
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUsePremiumAiModel: boolean;
  versionNumber: number;
  isDraft: boolean;
  isActive: boolean;
  publishedAt: string | null;
  editorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanVersionsState = {
  planId: string;
  active: PlanVersionRecord | null;
  draft: PlanVersionRecord | null;
  versions: PlanVersionRecord[];
};

function toPlanVersionRecord(item: {
  id: string;
  planId: string;
  displayName: string;
  description: string;
  monthlyPrice: Decimal;
  yearlyPrice: Decimal;
  monthlyStripePriceId: string | null;
  yearlyStripePriceId: string | null;
  gptModel: string;
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUsePremiumAiModel: boolean;
  versionNumber: number;
  isDraft: boolean;
  isActive: boolean;
  publishedAt: Date | null;
  editorEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PlanVersionRecord {
  return {
    id: item.id,
    planId: item.planId,
    displayName: item.displayName,
    description: item.description,
    monthlyPrice: item.monthlyPrice.toFixed(2),
    yearlyPrice: item.yearlyPrice.toFixed(2),
    monthlyStripePriceId: item.monthlyStripePriceId,
    yearlyStripePriceId: item.yearlyStripePriceId,
    gptModel: item.gptModel,
    aiGenerationsPerMonth: item.aiGenerationsPerMonth,
    maxSavedProgressions: item.maxSavedProgressions,
    maxSavedArrangements: item.maxSavedArrangements,
    maxPublicShares: item.maxPublicShares,
    canExportMidi: item.canExportMidi,
    canExportPdf: item.canExportPdf,
    canSharePublicly: item.canSharePublicly,
    canUsePremiumAiModel: item.canUsePremiumAiModel,
    versionNumber: item.versionNumber,
    isDraft: item.isDraft,
    isActive: item.isActive,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    editorEmail: item.editorEmail,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getPlanIds(): Promise<string[]> {
  const result = await prisma.subscriptionPlanVersion.findMany({
    distinct: ['planId'],
    select: { planId: true },
    orderBy: { planId: 'asc' },
  });
  return result.map((r) => r.planId);
}

export async function getPlanVersions(planId: string): Promise<PlanVersionRecord[]> {
  const rows = await prisma.subscriptionPlanVersion.findMany({
    where: { planId },
    orderBy: [{ versionNumber: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(toPlanVersionRecord);
}

export async function getPlanVersionsState(planId: string): Promise<PlanVersionsState> {
  const versions = await getPlanVersions(planId);
  return {
    planId,
    active: versions.find((v) => v.isActive) ?? null,
    draft: versions.find((v) => v.isDraft) ?? null,
    versions,
  };
}

export type SavePlanDraftParams = {
  planId: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyStripePriceId: string | null;
  yearlyStripePriceId: string | null;
  gptModel: string;
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUsePremiumAiModel: boolean;
  editorEmail: string;
};

export async function savePlanDraft(params: SavePlanDraftParams): Promise<PlanVersionRecord> {
  return prisma.$transaction(async (tx) => {
    const existingDraft = await tx.subscriptionPlanVersion.findFirst({
      where: { planId: params.planId, isDraft: true },
      orderBy: { versionNumber: 'desc' },
    });

    if (existingDraft) {
      const updated = await tx.subscriptionPlanVersion.update({
        where: { id: existingDraft.id },
        data: {
          displayName: params.displayName,
          description: params.description,
          monthlyPrice: params.monthlyPrice,
          yearlyPrice: params.yearlyPrice,
          monthlyStripePriceId: params.monthlyStripePriceId,
          yearlyStripePriceId: params.yearlyStripePriceId,
          gptModel: params.gptModel,
          aiGenerationsPerMonth: params.aiGenerationsPerMonth,
          maxSavedProgressions: params.maxSavedProgressions,
          maxSavedArrangements: params.maxSavedArrangements,
          maxPublicShares: params.maxPublicShares,
          canExportMidi: params.canExportMidi,
          canExportPdf: params.canExportPdf,
          canSharePublicly: params.canSharePublicly,
          canUsePremiumAiModel: params.canUsePremiumAiModel,
          editorEmail: params.editorEmail,
          updatedAt: new Date(),
        },
      });
      return toPlanVersionRecord(updated);
    }

    const maxVersion = await tx.subscriptionPlanVersion.aggregate({
      where: { planId: params.planId },
      _max: { versionNumber: true },
    });

    const created = await tx.subscriptionPlanVersion.create({
      data: {
        planId: params.planId,
        displayName: params.displayName,
        description: params.description,
        monthlyPrice: params.monthlyPrice,
        yearlyPrice: params.yearlyPrice,
        monthlyStripePriceId: params.monthlyStripePriceId,
        yearlyStripePriceId: params.yearlyStripePriceId,
        gptModel: params.gptModel,
        aiGenerationsPerMonth: params.aiGenerationsPerMonth,
        maxSavedProgressions: params.maxSavedProgressions,
        maxSavedArrangements: params.maxSavedArrangements,
        maxPublicShares: params.maxPublicShares,
        canExportMidi: params.canExportMidi,
        canExportPdf: params.canExportPdf,
        canSharePublicly: params.canSharePublicly,
        canUsePremiumAiModel: params.canUsePremiumAiModel,
        versionNumber: (maxVersion._max.versionNumber ?? 0) + 1,
        isDraft: true,
        isActive: false,
        editorEmail: params.editorEmail,
        updatedAt: new Date(),
      },
    });
    return toPlanVersionRecord(created);
  });
}

export async function publishPlanDraft(params: {
  planId: string;
}): Promise<PlanVersionRecord | null> {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.subscriptionPlanVersion.findFirst({
      where: { planId: params.planId, isDraft: true },
      orderBy: { versionNumber: 'desc' },
    });

    if (!draft) return null;

    await tx.subscriptionPlanVersion.updateMany({
      where: { planId: params.planId, isActive: true },
      data: { isActive: false },
    });

    const published = await tx.subscriptionPlanVersion.update({
      where: { id: draft.id },
      data: {
        isDraft: false,
        isActive: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return toPlanVersionRecord(published);
  });
}

export async function rollbackPlanVersion(params: {
  planId: string;
  versionId: string;
}): Promise<PlanVersionRecord | null> {
  return prisma.$transaction(async (tx) => {
    const target = await tx.subscriptionPlanVersion.findFirst({
      where: { id: params.versionId, planId: params.planId },
    });

    if (!target) return null;

    await tx.subscriptionPlanVersion.updateMany({
      where: { planId: params.planId, isActive: true },
      data: { isActive: false },
    });

    const rolledBack = await tx.subscriptionPlanVersion.update({
      where: { id: target.id },
      data: {
        isDraft: false,
        isActive: true,
        publishedAt: target.publishedAt ?? new Date(),
        updatedAt: new Date(),
      },
    });

    return toPlanVersionRecord(rolledBack);
  });
}
