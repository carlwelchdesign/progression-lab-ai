import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_MARKETING_CONTENT_ROLLED_BACK,
  recordMarketingContentAuditLog,
} from '../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { checkCsrfToken } from '../../../../lib/csrf';
import {
  calculateStaleMetadataForVersion,
  rollbackMarketingContentVersion,
} from '../../../../lib/marketingContent';

type RollbackMarketingContentVersionRequest = {
  contentKey?: unknown;
  locale?: unknown;
  versionId?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const csrfError = checkCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can rollback marketing content versions' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as RollbackMarketingContentVersionRequest;
    const contentKey = typeof body.contentKey === 'string' ? body.contentKey.trim() : '';
    const locale = typeof body.locale === 'string' ? body.locale.trim() : '';
    const versionId = typeof body.versionId === 'string' ? body.versionId.trim() : '';

    if (!contentKey || !locale || !versionId) {
      return NextResponse.json(
        { message: 'Invalid contentKey, locale, or versionId' },
        { status: 400 },
      );
    }

    const rolledBack = await rollbackMarketingContentVersion({ contentKey, locale, versionId });

    if (!rolledBack) {
      return NextResponse.json({ message: 'Version not found' }, { status: 404 });
    }

    const staleMetadata = await calculateStaleMetadataForVersion({
      contentKey,
      locale,
    });

    try {
      await recordMarketingContentAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_MARKETING_CONTENT_ROLLED_BACK,
        contentKey,
        metadata: {
          locale,
          versionId: rolledBack.id,
          versionNumber: rolledBack.versionNumber,
        },
      });
    } catch (auditError) {
      console.error('Failed to record marketing content rollback audit log:', auditError);
    }

    return NextResponse.json({ item: rolledBack, stale: staleMetadata });
  } catch (error) {
    console.error('Failed to rollback marketing content version:', error);
    return NextResponse.json(
      { message: 'Failed to rollback marketing content version' },
      { status: 500 },
    );
  }
}
