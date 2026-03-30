import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_TARGET_TYPE_TIER_CONFIG,
  getRecentTierConfigAuditLogs,
} from '../../../lib/adminAuditLog';
import { getAdminUserFromRequest, maskEmail } from '../../../lib/adminAccess';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function parseLimit(rawValue: string | null): number {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
    const logs = await getRecentTierConfigAuditLogs(limit);

    const items = logs.map((log) => {
      const metadata =
        log.metadata && typeof log.metadata === 'object'
          ? (log.metadata as { updatedFields?: unknown })
          : undefined;

      const updatedFields = Array.isArray(metadata?.updatedFields)
        ? metadata.updatedFields.filter((field): field is string => typeof field === 'string')
        : [];

      return {
        id: log.id,
        actorEmail: adminUser.role === 'AUDITOR' ? maskEmail(log.actorEmail) : log.actorEmail,
        actorRole: log.actorRole,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        updatedFields,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      targetType: AUDIT_TARGET_TYPE_TIER_CONFIG,
      items,
    });
  } catch (error) {
    console.error('Failed to fetch admin audit logs:', error);
    return NextResponse.json({ message: 'Failed to fetch admin audit logs' }, { status: 500 });
  }
}
