import { SubscriptionStatus, type SubscriptionPlan, type UsageEventType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest, maskEmail } from '../../../lib/adminAccess';
import { prisma } from '../../../lib/prisma';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const AI_GENERATION_EVENT_TYPE = 'AI_GENERATION' as UsageEventType;

const PLAN_LIMITS: Record<SubscriptionPlan, number | null> = {
  SESSION: 10,
  COMPOSER: 50,
  STUDIO: 200,
  COMP: 200,
};

function normalizePositiveInt(rawValue: string | null, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function isSubscriptionEntitled(status: SubscriptionStatus | null | undefined): boolean {
  return (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.TRIALING ||
    status === SubscriptionStatus.PAST_DUE
  );
}

function resolvePlan(options: {
  planOverride: SubscriptionPlan | null;
  subscriptionPlan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
}): SubscriptionPlan {
  if (options.planOverride) {
    return options.planOverride;
  }

  if (options.subscriptionPlan && isSubscriptionEntitled(options.subscriptionStatus)) {
    return options.subscriptionPlan;
  }

  return 'SESSION';
}

function getCurrentMonthWindow(now: Date = new Date()) {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const page = normalizePositiveInt(request.nextUrl.searchParams.get('page'), 1);
    const pageSize = Math.min(
      normalizePositiveInt(request.nextUrl.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const { start, end } = getCurrentMonthWindow();

    const [total, payingUsers, compedUsers, monthlyAiGenerations, rows] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          subscription: {
            is: {
              status: {
                in: [
                  SubscriptionStatus.ACTIVE,
                  SubscriptionStatus.TRIALING,
                  SubscriptionStatus.PAST_DUE,
                ],
              },
              plan: {
                in: ['COMPOSER', 'STUDIO'],
              },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          planOverride: 'COMP',
        },
      }),
      prisma.usageEvent.aggregate({
        _sum: {
          quantity: true,
        },
        where: {
          eventType: AI_GENERATION_EVENT_TYPE,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          planOverride: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              billingInterval: true,
            },
          },
          usageEvents: {
            where: {
              eventType: AI_GENERATION_EVENT_TYPE,
              createdAt: {
                gte: start,
                lt: end,
              },
            },
            select: {
              quantity: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      pageSize,
      summary: {
        totalUsers: total,
        payingUsers,
        compedUsers,
        monthlyAiGenerations: monthlyAiGenerations._sum.quantity ?? 0,
      },
      items: rows.map((row) => {
        const resolvedPlan = resolvePlan({
          planOverride: row.planOverride,
          subscriptionPlan: row.subscription?.plan ?? null,
          subscriptionStatus: row.subscription?.status ?? null,
        });

        return {
          id: row.id,
          email: adminUser.role === 'ADMIN' ? row.email : maskEmail(row.email),
          name: row.name,
          role: row.role,
          resolvedPlan,
          planOverride: row.planOverride,
          subscriptionStatus: row.subscription?.status ?? null,
          billingInterval: row.subscription?.billingInterval ?? null,
          aiGenerationsUsed: row.usageEvents.reduce((sum, event) => sum + event.quantity, 0),
          aiGenerationsLimit: PLAN_LIMITS[resolvedPlan],
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error('Failed to list users:', error);
    return NextResponse.json({ message: 'Failed to list users' }, { status: 500 });
  }
}
