import { SubscriptionPlan } from '@prisma/client';
import { NextResponse } from 'next/server';

export function createPlanLimitResponse(options: {
  code: string;
  message: string;
  plan: SubscriptionPlan;
  limit?: number | null;
  used?: number;
}) {
  return NextResponse.json(
    {
      error: options.message,
      code: options.code,
      plan: options.plan,
      ...(options.limit !== undefined && { limit: options.limit }),
      ...(options.used !== undefined && { used: options.used }),
    },
    { status: 402 },
  );
}
