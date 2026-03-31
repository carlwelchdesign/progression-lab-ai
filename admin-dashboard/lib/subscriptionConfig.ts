import { SubscriptionPlan } from '@prisma/client';
import { prisma } from './prisma';

export type SubscriptionTierConfig = {
  plan: SubscriptionPlan;
  gptModel: string;
  aiGenerationsPerMonth: number | null;
  maxSavedProgressions: number | null;
  maxSavedArrangements: number | null;
  maxPublicShares: number | null;
  canExportMidi: boolean;
  canExportPdf: boolean;
  canSharePublicly: boolean;
  canUseAdvancedVoicingControls: boolean;
};

// Hardcoded fallback for backward compatibility
const FALLBACK_TIER_CONFIGS: Record<SubscriptionPlan, SubscriptionTierConfig> = {
  [SubscriptionPlan.SESSION]: {
    plan: SubscriptionPlan.SESSION,
    gptModel: 'gpt-3.5-turbo',
    aiGenerationsPerMonth: 10,
    maxSavedProgressions: 10,
    maxSavedArrangements: 5,
    maxPublicShares: 2,
    canExportMidi: false,
    canExportPdf: false,
    canSharePublicly: true,
    canUseAdvancedVoicingControls: false,
  },
  [SubscriptionPlan.COMPOSER]: {
    plan: SubscriptionPlan.COMPOSER,
    gptModel: 'gpt-3.5-turbo',
    aiGenerationsPerMonth: 50,
    maxSavedProgressions: 50,
    maxSavedArrangements: 25,
    maxPublicShares: 10,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: true,
    canUseAdvancedVoicingControls: true,
  },
  [SubscriptionPlan.STUDIO]: {
    plan: SubscriptionPlan.STUDIO,
    gptModel: 'gpt-4o',
    aiGenerationsPerMonth: 200,
    maxSavedProgressions: null,
    maxSavedArrangements: null,
    maxPublicShares: null,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: true,
    canUseAdvancedVoicingControls: true,
  },
  [SubscriptionPlan.COMP]: {
    plan: SubscriptionPlan.COMP,
    gptModel: 'gpt-4o',
    aiGenerationsPerMonth: 200,
    maxSavedProgressions: null,
    maxSavedArrangements: null,
    maxPublicShares: null,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: true,
    canUseAdvancedVoicingControls: true,
  },
  [SubscriptionPlan.INVITE]: {
    plan: SubscriptionPlan.INVITE,
    gptModel: 'gpt-3.5-turbo',
    aiGenerationsPerMonth: 25,
    maxSavedProgressions: 50,
    maxSavedArrangements: 50,
    maxPublicShares: 0,
    canExportMidi: true,
    canExportPdf: true,
    canSharePublicly: false,
    canUseAdvancedVoicingControls: true,
  },
};

let cachedConfigs: Record<SubscriptionPlan, SubscriptionTierConfig> | null = null;

/**
 * Fetch all subscription tier configurations from the database
 */
export async function getAllTierConfigs(): Promise<
  Record<SubscriptionPlan, SubscriptionTierConfig>
> {
  if (cachedConfigs) {
    return cachedConfigs;
  }

  try {
    const configs = await prisma.subscriptionTierConfig.findMany();
    const configMap = {} as Record<SubscriptionPlan, SubscriptionTierConfig>;

    // Map configs by plan, with fallback to hardcoded defaults
    for (const plan of Object.values(SubscriptionPlan)) {
      if (typeof plan !== 'string') continue; // Skip symbol keys
      const dbConfig = configs.find((c) => c.plan === plan);
      configMap[plan as SubscriptionPlan] = dbConfig
        ? {
            plan: dbConfig.plan as SubscriptionPlan,
            gptModel: dbConfig.gptModel,
            aiGenerationsPerMonth: dbConfig.aiGenerationsPerMonth,
            maxSavedProgressions: dbConfig.maxSavedProgressions,
            maxSavedArrangements: dbConfig.maxSavedArrangements,
            maxPublicShares: dbConfig.maxPublicShares,
            canExportMidi: dbConfig.canExportMidi,
            canExportPdf: dbConfig.canExportPdf,
            canSharePublicly: dbConfig.canSharePublicly,
            canUseAdvancedVoicingControls:
              dbConfig.canUseAdvancedVoicingControls ??
              FALLBACK_TIER_CONFIGS[plan as SubscriptionPlan].canUseAdvancedVoicingControls,
          }
        : FALLBACK_TIER_CONFIGS[plan as SubscriptionPlan];
    }

    cachedConfigs = configMap;
    return configMap;
  } catch (error) {
    console.error('Failed to fetch subscription tier configs:', error);
    return FALLBACK_TIER_CONFIGS;
  }
}

/**
 * Get configuration for a specific subscription tier
 */
export async function getTierConfig(plan: SubscriptionPlan): Promise<SubscriptionTierConfig> {
  const allConfigs = await getAllTierConfigs();
  return allConfigs[plan];
}

/**
 * Update a subscription tier configuration
 */
export async function updateTierConfig(
  plan: SubscriptionPlan,
  updates: Partial<Omit<SubscriptionTierConfig, 'plan'>>,
): Promise<SubscriptionTierConfig> {
  const updated = await prisma.subscriptionTierConfig.upsert({
    where: { plan },
    update: updates,
    create: {
      plan,
      gptModel: updates.gptModel || FALLBACK_TIER_CONFIGS[plan].gptModel,
      aiGenerationsPerMonth:
        updates.aiGenerationsPerMonth ?? FALLBACK_TIER_CONFIGS[plan].aiGenerationsPerMonth,
      maxSavedProgressions:
        updates.maxSavedProgressions ?? FALLBACK_TIER_CONFIGS[plan].maxSavedProgressions,
      maxSavedArrangements:
        updates.maxSavedArrangements ?? FALLBACK_TIER_CONFIGS[plan].maxSavedArrangements,
      maxPublicShares: updates.maxPublicShares ?? FALLBACK_TIER_CONFIGS[plan].maxPublicShares,
      canExportMidi: updates.canExportMidi ?? FALLBACK_TIER_CONFIGS[plan].canExportMidi,
      canExportPdf: updates.canExportPdf ?? FALLBACK_TIER_CONFIGS[plan].canExportPdf,
      canSharePublicly: updates.canSharePublicly ?? FALLBACK_TIER_CONFIGS[plan].canSharePublicly,
      canUseAdvancedVoicingControls:
        updates.canUseAdvancedVoicingControls ??
        FALLBACK_TIER_CONFIGS[plan].canUseAdvancedVoicingControls,
    },
  });

  // Invalidate cache
  invalidateCache();

  return {
    plan: updated.plan as SubscriptionPlan,
    gptModel: updated.gptModel,
    aiGenerationsPerMonth: updated.aiGenerationsPerMonth,
    maxSavedProgressions: updated.maxSavedProgressions,
    maxSavedArrangements: updated.maxSavedArrangements,
    maxPublicShares: updated.maxPublicShares,
    canExportMidi: updated.canExportMidi,
    canExportPdf: updated.canExportPdf,
    canSharePublicly: updated.canSharePublicly,
    canUseAdvancedVoicingControls: updated.canUseAdvancedVoicingControls,
  };
}

/**
 * Invalidate the in-memory cache to force a database refresh on next read
 */
export function invalidateCache(): void {
  cachedConfigs = null;
}
