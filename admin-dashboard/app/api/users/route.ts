import {
  Prisma,
  SubscriptionStatus,
  type SubscriptionPlan,
  type UsageEventType,
} from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminUserFromRequest, maskEmail } from '../../../lib/adminAccess';
import { prisma } from '../../../lib/prisma';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const ENTITLED_SUBSCRIPTION_STATUSES = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
] as const;
const USER_ROLE_VALUES = ['ADMIN', 'AUDITOR', 'USER'] as const;
const RESOLVED_PLAN_VALUES = ['SESSION', 'COMPOSER', 'STUDIO', 'COMP'] as const;
const SUBSCRIPTION_STATUS_VALUES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'UNPAID',
  'NONE',
] as const;
const OVERRIDE_STATE_VALUES = ['OVERRIDDEN', 'NONE'] as const;

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
  return status ? ENTITLED_SUBSCRIPTION_STATUSES.includes(status) : false;
}

function parseFilterValue<T extends string>(rawValue: string | null, allowedValues: readonly T[]) {
  return rawValue && allowedValues.includes(rawValue as T) ? (rawValue as T) : 'ALL';
}

function buildResolvedPlanWhere(plan: SubscriptionPlan): Prisma.UserWhereInput {
  if (plan === 'SESSION') {
    return {
      OR: [
        { planOverride: 'SESSION' },
        {
          planOverride: null,
          subscription: {
            is: {
              plan: 'SESSION',
              status: {
                in: ENTITLED_SUBSCRIPTION_STATUSES,
              },
            },
          },
        },
        {
          planOverride: null,
          OR: [
            { subscription: { is: null } },
            {
              subscription: {
                is: {
                  status: {
                    notIn: ENTITLED_SUBSCRIPTION_STATUSES,
                  },
                },
              },
            },
          ],
        },
      ],
    };
  }

  return {
    OR: [
      { planOverride: plan },
      {
        planOverride: null,
        subscription: {
          is: {
            plan,
            status: {
              in: ENTITLED_SUBSCRIPTION_STATUSES,
            },
          },
        },
      },
    ],
  };
}

function buildUsersWhere(searchParams: URLSearchParams): Prisma.UserWhereInput {
  const query = searchParams.get('query')?.trim() ?? '';
  const role = parseFilterValue(searchParams.get('role'), USER_ROLE_VALUES);
  const resolvedPlan = parseFilterValue(searchParams.get('resolvedPlan'), RESOLVED_PLAN_VALUES);
  const subscriptionStatus = parseFilterValue(
    searchParams.get('subscriptionStatus'),
    SUBSCRIPTION_STATUS_VALUES,
  );
  const overrideState = parseFilterValue(searchParams.get('overrideState'), OVERRIDE_STATE_VALUES);

  const andFilters: Prisma.UserWhereInput[] = [];

  if (query) {
    andFilters.push({
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    });
  }

  if (role !== 'ALL') {
    andFilters.push({ role });
  }

  if (resolvedPlan !== 'ALL') {
    andFilters.push(buildResolvedPlanWhere(resolvedPlan));
  }

  if (subscriptionStatus === 'NONE') {
    andFilters.push({ subscription: { is: null } });
  } else if (subscriptionStatus !== 'ALL') {
    andFilters.push({
      subscription: {
        is: {
          status: subscriptionStatus,
        },
      },
    });
  }

  if (overrideState === 'OVERRIDDEN') {
    andFilters.push({ planOverride: { not: null } });
  } else if (overrideState === 'NONE') {
    andFilters.push({ planOverride: null });
  }

  return andFilters.length > 0 ? { AND: andFilters } : {};
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
    const usersWhere = buildUsersWhere(request.nextUrl.searchParams);
    const { start, end } = getCurrentMonthWindow();

    const [total, filteredTotal, payingUsers, compedUsers, monthlyAiGenerations, rows] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: usersWhere }),
        prisma.user.count({
          where: {
            subscription: {
              is: {
                status: {
                  in: ENTITLED_SUBSCRIPTION_STATUSES,
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
          where: usersWhere,
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
      total: filteredTotal,
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
