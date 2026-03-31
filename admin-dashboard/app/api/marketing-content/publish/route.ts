import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_MARKETING_CONTENT_PUBLISHED,
  recordMarketingContentAuditLog,
} from '../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { checkCsrfToken } from '../../../../lib/csrf';
import { publishMarketingContentDraft } from '../../../../lib/marketingContent';

type PublishMarketingContentDraftRequest = {
  contentKey?: unknown;
  locale?: unknown;
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
        { message: 'Only ADMIN can publish marketing content drafts' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as PublishMarketingContentDraftRequest;
    const contentKey = typeof body.contentKey === 'string' ? body.contentKey.trim() : '';
    const locale = typeof body.locale === 'string' ? body.locale.trim() : '';

    if (!contentKey || !locale) {
      return NextResponse.json({ message: 'Invalid contentKey or locale' }, { status: 400 });
    }

    const published = await publishMarketingContentDraft({ contentKey, locale });
    if (!published) {
      return NextResponse.json({ message: 'No draft found to publish' }, { status: 404 });
    }

    try {
      await recordMarketingContentAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_MARKETING_CONTENT_PUBLISHED,
        contentKey,
        metadata: {
          locale,
          versionId: published.id,
          versionNumber: published.versionNumber,
        },
      });
    } catch (auditError) {
      console.error('Failed to record marketing content publish audit log:', auditError);
    }

    return NextResponse.json({ item: published });
  } catch (error) {
    console.error('Failed to publish marketing content draft:', error);
    return NextResponse.json(
      { message: 'Failed to publish marketing content draft' },
      { status: 500 },
    );
  }
}
