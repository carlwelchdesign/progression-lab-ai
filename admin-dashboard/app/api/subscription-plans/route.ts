import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_PLAN_DRAFT_SAVED,
  recordPlanVersionAuditLog,
} from '../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../lib/adminAccess';
import { checkCsrfToken } from '../../../lib/csrf';
import {
  getPlanIds,
  getPlanVersionsState,
  savePlanDraft,
  type SavePlanDraftParams,
} from '../../../lib/planVersions';

type SavePlanDraftRequest = {
  planId?: unknown;
  displayName?: unknown;
  description?: unknown;
  monthlyPrice?: unknown;
  yearlyPrice?: unknown;
  monthlyStripePriceId?: unknown;
  yearlyStripePriceId?: unknown;
  gptModel?: unknown;
  aiGenerationsPerMonth?: unknown;
  maxSavedProgressions?: unknown;
  maxSavedArrangements?: unknown;
  maxPublicShares?: unknown;
  canExportMidi?: unknown;
  canExportPdf?: unknown;
  canSharePublicly?: unknown;
  canUsePremiumAiModel?: unknown;
};

function parseNullableInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : null;
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return !isNaN(num) && num >= 0 ? num : null;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const planIds = await getPlanIds();
    const planId = request.nextUrl.searchParams.get('planId') || planIds[0] || 'SESSION';
    const state = await getPlanVersionsState(planId);

    return NextResponse.json({
      planId,
      planIds,
      active: state.active,
      draft: state.draft,
      versions: state.versions,
    });
  } catch (error) {
    console.error('Failed to fetch plan versions:', error);
    return NextResponse.json({ message: 'Failed to fetch plan versions' }, { status: 500 });
  }
}

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
      return NextResponse.json({ message: 'Only ADMIN can save plan drafts' }, { status: 403 });
    }

    const body = (await request.json()) as SavePlanDraftRequest;

    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const monthlyPrice = parsePrice(body.monthlyPrice);
    const yearlyPrice = parsePrice(body.yearlyPrice);
    const gptModel = typeof body.gptModel === 'string' ? body.gptModel.trim() : '';
    const monthlyStripePriceId =
      typeof body.monthlyStripePriceId === 'string'
        ? body.monthlyStripePriceId.trim() || null
        : null;
    const yearlyStripePriceId =
      typeof body.yearlyStripePriceId === 'string' ? body.yearlyStripePriceId.trim() || null : null;
    const canExportMidi = body.canExportMidi === true;
    const canExportPdf = body.canExportPdf === true;
    const canSharePublicly = body.canSharePublicly !== false;
    const canUsePremiumAiModel = body.canUsePremiumAiModel === true;

    if (!planId) {
      return NextResponse.json({ message: 'Invalid planId' }, { status: 400 });
    }
    if (!displayName) {
      return NextResponse.json({ message: 'displayName cannot be empty' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ message: 'description cannot be empty' }, { status: 400 });
    }
    if (monthlyPrice === null) {
      return NextResponse.json({ message: 'Invalid monthlyPrice' }, { status: 400 });
    }
    if (yearlyPrice === null) {
      return NextResponse.json({ message: 'Invalid yearlyPrice' }, { status: 400 });
    }
    if (!gptModel) {
      return NextResponse.json({ message: 'gptModel cannot be empty' }, { status: 400 });
    }

    const params: SavePlanDraftParams = {
      planId,
      displayName,
      description,
      monthlyPrice,
      yearlyPrice,
      monthlyStripePriceId,
      yearlyStripePriceId,
      gptModel,
      aiGenerationsPerMonth: parseNullableInt(body.aiGenerationsPerMonth),
      maxSavedProgressions: parseNullableInt(body.maxSavedProgressions),
      maxSavedArrangements: parseNullableInt(body.maxSavedArrangements),
      maxPublicShares: parseNullableInt(body.maxPublicShares),
      canExportMidi,
      canExportPdf,
      canSharePublicly,
      canUsePremiumAiModel,
      editorEmail: adminUser.email,
    };

    const draft = await savePlanDraft(params);

    try {
      await recordPlanVersionAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_PLAN_DRAFT_SAVED,
        planId,
        metadata: {
          versionNumber: draft.versionNumber,
          displayName: draft.displayName,
        },
      });
    } catch (auditError) {
      console.error('Failed to record plan draft audit log:', auditError);
    }

    return NextResponse.json({ item: draft });
  } catch (error) {
    console.error('Failed to save plan draft:', error);
    return NextResponse.json({ message: 'Failed to save plan draft' }, { status: 500 });
  }
}
