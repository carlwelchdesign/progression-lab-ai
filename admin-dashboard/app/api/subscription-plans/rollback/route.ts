import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_PLAN_ROLLED_BACK,
  recordPlanVersionAuditLog,
} from '../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { checkCsrfToken } from '../../../../lib/csrf';
import { rollbackPlanVersion } from '../../../../lib/planVersions';

type RollbackPlanVersionRequest = {
  planId?: unknown;
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
        { message: 'Only ADMIN can rollback plan versions' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as RollbackPlanVersionRequest;
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const versionId = typeof body.versionId === 'string' ? body.versionId.trim() : '';

    if (!planId || !versionId) {
      return NextResponse.json({ message: 'Invalid planId or versionId' }, { status: 400 });
    }

    const rolledBack = await rollbackPlanVersion({ planId, versionId });

    if (!rolledBack) {
      return NextResponse.json({ message: 'Version not found' }, { status: 404 });
    }

    try {
      await recordPlanVersionAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_PLAN_ROLLED_BACK,
        planId,
        metadata: {
          versionId: rolledBack.id,
          versionNumber: rolledBack.versionNumber,
          displayName: rolledBack.displayName,
        },
      });
    } catch (auditError) {
      console.error('Failed to record plan rollback audit log:', auditError);
    }

    return NextResponse.json({ item: rolledBack });
  } catch (error) {
    console.error('Failed to rollback plan version:', error);
    return NextResponse.json({ message: 'Failed to rollback plan version' }, { status: 500 });
  }
}
