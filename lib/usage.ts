import { Prisma, UsageEventType } from '@prisma/client';

import { prisma } from './prisma';

export function getCurrentMonthWindow(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

export async function getCurrentMonthUsageCount(
  userId: string,
  eventType: UsageEventType,
  now: Date = new Date(),
): Promise<number> {
  const { start, end } = getCurrentMonthWindow(now);
  const usage = await prisma.usageEvent.aggregate({
    _sum: { quantity: true },
    where: {
      userId,
      eventType,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  return usage._sum.quantity ?? 0;
}

export async function recordUsageEvent(options: {
  userId: string;
  eventType: UsageEventType;
  quantity?: number;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.usageEvent.create({
    data: {
      userId: options.userId,
      eventType: options.eventType,
      quantity: options.quantity ?? 1,
      ...(options.metadata !== undefined && { metadata: options.metadata }),
    },
  });
}
