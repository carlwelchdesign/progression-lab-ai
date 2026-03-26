import type { NextRequest } from 'next/server';

import { getSessionFromRequest } from './auth';
import { prisma } from './prisma';

export type AdminUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'AUDITOR';
};

export async function getAdminUserFromRequest(request: NextRequest): Promise<AdminUser | null> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AUDITOR')) {
    return null;
  }

  return user;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) {
    return 'hidden';
  }

  const visibleName = name.length <= 2 ? name[0] : `${name.slice(0, 2)}***`;
  return `${visibleName}@${domain}`;
}
