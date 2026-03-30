import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_PLAN_PUBLISHED,
  recordPlanVersionAuditLog,
} from '../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { checkCsrfToken } from '../../../../lib/csrf';
import { publishPlanDraft } from '../../../../lib/planVersions';

type PublishPlanDraftRequest = {
  planId?: unknown;
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
      return NextResponse.json({ message: 'Only ADMIN can publish plan drafts' }, { status: 403 });
    }

    const body = (await request.json()) as PublishPlanDraftRequest;
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';

    if (!planId) {
      return NextResponse.json({ message: 'Invalid planId' }, { status: 400 });
    }

    const published = await publishPlanDraft({ planId });
    if (!published) {
      return NextResponse.json({ message: 'No draft found to publish' }, { status: 404 });
    }

    try {
      await recordPlanVersionAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_PLAN_PUBLISHED,
        planId,
        metadata: {
          versionId: published.id,
          versionNumber: published.versionNumber,
          displayName: published.displayName,
        },
      });
    } catch (auditError) {
      console.error('Failed to record plan publish audit log:', auditError);
    }

    return NextResponse.json({ item: published });
  } catch (error) {
    console.error('Failed to publish plan draft:', error);
    return NextResponse.json({ message: 'Failed to publish plan draft' }, { status: 500 });
  }
}
