import { SubscriptionPlan } from '@prisma/client';

import { getAllTierConfigs } from '../subscriptionConfig';
import type { BoardroomFeatureAvailability, BoardroomFeatureCatalog } from './types';

const PLANS_TO_CONSIDER: SubscriptionPlan[] = [
  SubscriptionPlan.SESSION,
  SubscriptionPlan.COMPOSER,
  SubscriptionPlan.STUDIO,
];

function asPlanLabel(plan: SubscriptionPlan): string {
  return String(plan);
}

function computeAvailability(params: {
  plans: SubscriptionPlan[];
  isEnabledForPlan: (plan: SubscriptionPlan) => boolean;
}): BoardroomFeatureAvailability {
  const availablePlans = params.plans.filter((plan) => params.isEnabledForPlan(plan)).map(asPlanLabel);
  const unavailablePlans = params.plans
    .filter((plan) => !params.isEnabledForPlan(plan))
    .map(asPlanLabel);

  return {
    isAvailableToAll: unavailablePlans.length === 0,
    availablePlans,
    unavailablePlans,
  };
}

export async function getBoardroomFeatureCatalog(): Promise<BoardroomFeatureCatalog> {
  const tierConfigs = await getAllTierConfigs();

  return {
    generatedAtIso: new Date().toISOString(),
    plansConsidered: PLANS_TO_CONSIDER.map(asPlanLabel),
    capabilities: {
      canExportMidi: computeAvailability({
        plans: PLANS_TO_CONSIDER,
        isEnabledForPlan: (plan) => tierConfigs[plan].canExportMidi,
      }),
      canExportPdf: computeAvailability({
        plans: PLANS_TO_CONSIDER,
        isEnabledForPlan: (plan) => tierConfigs[plan].canExportPdf,
      }),
      canSharePublicly: computeAvailability({
        plans: PLANS_TO_CONSIDER,
        isEnabledForPlan: (plan) => tierConfigs[plan].canSharePublicly,
      }),
      canUseAdvancedVoicingControls: computeAvailability({
        plans: PLANS_TO_CONSIDER,
        isEnabledForPlan: (plan) => tierConfigs[plan].canUseAdvancedVoicingControls,
      }),
    },
  };
}