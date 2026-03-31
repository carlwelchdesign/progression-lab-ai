import { UsageEventType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../../lib/auth';
import { getBillingStatusForUser } from '../../../../lib/billing';
import { getAccessContextForSession } from '../../../../lib/entitlements';
import { getCurrentMonthUsageCount } from '../../../../lib/usage';

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const accessContext = await getAccessContextForSession(session);
  if (!accessContext) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const [{ user }, aiGenerationsUsed] = await Promise.all([
    getBillingStatusForUser(session.userId),
    getCurrentMonthUsageCount(session.userId, UsageEventType.AI_GENERATION),
  ]);

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    plan: accessContext.plan,
    entitlements: accessContext.entitlements,
    planOverride: accessContext.planOverride,
    planOverrideExpiresAt: accessContext.planOverrideExpiresAt,
    subscriptionStatus: accessContext.subscriptionStatus,
    billing: {
      stripeCustomerId: user.stripeCustomerId,
      subscription: user.subscription,
    },
    usage: {
      aiGenerationsUsed,
      aiGenerationsLimit: accessContext.entitlements.aiGenerationsPerMonth,
    },
  });
}
