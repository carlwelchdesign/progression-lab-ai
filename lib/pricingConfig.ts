import { SubscriptionPlan } from '@prisma/client';

import { prisma } from './prisma';

export type ActivePricingPlan = {
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
  versionNumber: number | null;
  source: 'db' | 'fallback';
};

const PUBLIC_PLAN_IDS: SubscriptionPlan[] = [
  SubscriptionPlan.SESSION,
  SubscriptionPlan.COMPOSER,
  SubscriptionPlan.STUDIO,
];

const FALLBACK_PRICING: Record<
  SubscriptionPlan,
  Omit<ActivePricingPlan, 'versionNumber' | 'source'>
> = {
  [SubscriptionPlan.SESSION]: {
    planId: 'SESSION',
    displayName: 'Session',
    description: 'Try the studio with meaningful limits',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyStripePriceId: null,
    yearlyStripePriceId: null,
    gptModel: 'gpt-3.5-turbo',
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
    planId: 'COMPOSER',
    displayName: 'Composer',
    description: 'For serious songwriting sessions',
    monthlyPrice: 9,
    yearlyPrice: 90,
    monthlyStripePriceId: null,
    yearlyStripePriceId: null,
    gptModel: 'gpt-3.5-turbo',
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
    planId: 'STUDIO',
    displayName: 'Studio',
    description: 'Maximum headroom for power users',
    monthlyPrice: 19,
    yearlyPrice: 190,
    monthlyStripePriceId: null,
    yearlyStripePriceId: null,
    gptModel: 'gpt-4o',
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
    planId: 'COMP',
    displayName: 'COMP',
    description: 'Legacy internal plan',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyStripePriceId: null,
    yearlyStripePriceId: null,
    gptModel: 'gpt-4o',
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

export async function getActivePricingPlan(planId: string): Promise<ActivePricingPlan> {
  try {
    const record = await prisma.subscriptionPlanVersion.findFirst({
      where: { planId, isActive: true },
      orderBy: { versionNumber: 'desc' },
    });

    if (!record) {
      const fallback =
        FALLBACK_PRICING[planId as SubscriptionPlan] ?? FALLBACK_PRICING[SubscriptionPlan.SESSION];
      return { ...fallback, versionNumber: null, source: 'fallback' };
    }

    return {
      planId: record.planId,
      displayName: record.displayName,
      description: record.description,
      monthlyPrice: Number(record.monthlyPrice),
      yearlyPrice: Number(record.yearlyPrice),
      monthlyStripePriceId: record.monthlyStripePriceId,
      yearlyStripePriceId: record.yearlyStripePriceId,
      gptModel: record.gptModel,
      aiGenerationsPerMonth: record.aiGenerationsPerMonth,
      maxSavedProgressions: record.maxSavedProgressions,
      maxSavedArrangements: record.maxSavedArrangements,
      maxPublicShares: record.maxPublicShares,
      canExportMidi: record.canExportMidi,
      canExportPdf: record.canExportPdf,
      canSharePublicly: record.canSharePublicly,
      canUsePremiumAiModel: record.canUsePremiumAiModel,
      versionNumber: record.versionNumber,
      source: 'db',
    };
  } catch (error) {
    console.error(`Failed to load active pricing plan for ${planId}:`, error);
    const fallback =
      FALLBACK_PRICING[planId as SubscriptionPlan] ?? FALLBACK_PRICING[SubscriptionPlan.SESSION];
    return { ...fallback, versionNumber: null, source: 'fallback' };
  }
}

export async function getPublicActivePlans(): Promise<ActivePricingPlan[]> {
  try {
    const records = await prisma.subscriptionPlanVersion.findMany({
      where: {
        planId: { in: PUBLIC_PLAN_IDS },
        isActive: true,
      },
      orderBy: { planId: 'asc' },
    });

    return PUBLIC_PLAN_IDS.map((planId) => {
      const record = records.find((r) => r.planId === planId);
      if (!record) {
        return { ...FALLBACK_PRICING[planId], versionNumber: null, source: 'fallback' as const };
      }
      return {
        planId: record.planId,
        displayName: record.displayName,
        description: record.description,
        monthlyPrice: Number(record.monthlyPrice),
        yearlyPrice: Number(record.yearlyPrice),
        monthlyStripePriceId: record.monthlyStripePriceId,
        yearlyStripePriceId: record.yearlyStripePriceId,
        gptModel: record.gptModel,
        aiGenerationsPerMonth: record.aiGenerationsPerMonth,
        maxSavedProgressions: record.maxSavedProgressions,
        maxSavedArrangements: record.maxSavedArrangements,
        maxPublicShares: record.maxPublicShares,
        canExportMidi: record.canExportMidi,
        canExportPdf: record.canExportPdf,
        canSharePublicly: record.canSharePublicly,
        canUsePremiumAiModel: record.canUsePremiumAiModel,
        versionNumber: record.versionNumber,
        source: 'db' as const,
      };
    });
  } catch (error) {
    console.error('Failed to load public active plans:', error);
    return PUBLIC_PLAN_IDS.map((planId) => ({
      ...FALLBACK_PRICING[planId],
      versionNumber: null,
      source: 'fallback' as const,
    }));
  }
}
