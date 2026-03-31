import { NextRequest, NextResponse } from 'next/server';

import {
  AUDIT_ACTION_MARKETING_CONTENT_DRAFT_SAVED,
  recordMarketingContentAuditLog,
} from '../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../lib/adminAccess';
import { checkCsrfToken } from '../../../lib/csrf';
import {
  getMarketingContentBuilderState,
  MARKETING_CONTENT_DEFINITIONS,
  saveMarketingContentDraft,
  SUPPORTED_MARKETING_LOCALES,
  type SaveMarketingContentDraftParams,
} from '../../../lib/marketingContent';
import { validateMarketingContentShape } from '../../../lib/marketingContentValidation';

type SaveMarketingContentDraftRequest = {
  contentKey?: unknown;
  locale?: unknown;
  content?: unknown;
  notes?: unknown;
  sourceVersionId?: unknown;
  translationOrigin?: unknown;
  translationModel?: unknown;
};

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getValidatedContentKey(value: string | null): string {
  if (!value) {
    return MARKETING_CONTENT_DEFINITIONS[0]?.key ?? 'homepage';
  }

  const normalized = value.trim();
  return MARKETING_CONTENT_DEFINITIONS.some((item) => item.key === normalized)
    ? normalized
    : (MARKETING_CONTENT_DEFINITIONS[0]?.key ?? 'homepage');
}

function getValidatedLocale(value: string | null): string {
  if (!value) {
    return 'en';
  }

  const normalized = value.trim();
  return SUPPORTED_MARKETING_LOCALES.includes(
    normalized as (typeof SUPPORTED_MARKETING_LOCALES)[number],
  )
    ? normalized
    : 'en';
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const contentKey = getValidatedContentKey(request.nextUrl.searchParams.get('contentKey'));
    const locale = getValidatedLocale(request.nextUrl.searchParams.get('locale'));
    const sourceLocale = getValidatedLocale(request.nextUrl.searchParams.get('sourceLocale'));
    const state = await getMarketingContentBuilderState(contentKey, locale, sourceLocale);

    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to fetch marketing content versions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch marketing content versions' },
      { status: 500 },
    );
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
      return NextResponse.json(
        { message: 'Only ADMIN can save marketing content drafts' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as SaveMarketingContentDraftRequest;
    const contentKey =
      typeof body.contentKey === 'string' ? getValidatedContentKey(body.contentKey) : '';
    const locale = typeof body.locale === 'string' ? getValidatedLocale(body.locale) : 'en';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null;
    const sourceVersionId =
      typeof body.sourceVersionId === 'string' ? body.sourceVersionId.trim() || null : null;
    const translationOrigin =
      body.translationOrigin === 'AI_ASSISTED' || body.translationOrigin === 'HUMAN'
        ? body.translationOrigin
        : null;
    const translationModel =
      typeof body.translationModel === 'string' ? body.translationModel.trim() || null : null;

    if (!contentKey) {
      return NextResponse.json({ message: 'Invalid contentKey' }, { status: 400 });
    }

    if (!isJsonRecord(body.content)) {
      return NextResponse.json(
        { message: 'Marketing content must be a JSON object' },
        { status: 400 },
      );
    }

    const validation = validateMarketingContentShape(contentKey, body.content);
    if (!validation.valid) {
      return NextResponse.json(
        {
          message: 'Invalid marketing content shape',
          errors: validation.errors,
        },
        { status: 400 },
      );
    }

    const params: SaveMarketingContentDraftParams = {
      contentKey,
      locale,
      content: body.content,
      notes,
      actorUserId: adminUser.id,
      actorEmail: adminUser.email,
      sourceVersionId,
      translationOrigin,
      translationModel,
    };

    const draft = await saveMarketingContentDraft(params);

    try {
      await recordMarketingContentAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_MARKETING_CONTENT_DRAFT_SAVED,
        contentKey,
        metadata: {
          locale,
          versionNumber: draft.versionNumber,
          translationOrigin: draft.translationOrigin,
        },
      });
    } catch (auditError) {
      console.error('Failed to record marketing content draft audit log:', auditError);
    }

    return NextResponse.json({ item: draft });
  } catch (error) {
    console.error('Failed to save marketing content draft:', error);
    return NextResponse.json(
      { message: 'Failed to save marketing content draft' },
      { status: 500 },
    );
  }
}
