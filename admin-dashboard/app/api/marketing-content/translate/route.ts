import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import {
  AUDIT_ACTION_MARKETING_CONTENT_TRANSLATION_GENERATED,
  recordMarketingContentAuditLog,
} from '../../../../lib/adminAuditLog';
import { getAdminUserFromRequest } from '../../../../lib/adminAccess';
import { checkCsrfToken } from '../../../../lib/csrf';
import {
  getMarketingContentSourceVersion,
  MARKETING_CONTENT_DEFINITIONS,
  saveMarketingContentDraft,
  SUPPORTED_MARKETING_LOCALES,
} from '../../../../lib/marketingContent';
import { validateMarketingContentShape } from '../../../../lib/marketingContentValidation';

type TranslateMarketingContentRequest = {
  contentKey?: unknown;
  sourceLocale?: unknown;
  targetLocale?: unknown;
  sourceVersionId?: unknown;
  model?: unknown;
};

const DEFAULT_TRANSLATION_MODEL = 'gpt-4o-mini';

function isSupportedLocale(locale: string): boolean {
  return SUPPORTED_MARKETING_LOCALES.includes(
    locale as (typeof SUPPORTED_MARKETING_LOCALES)[number],
  );
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeModel(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_TRANSLATION_MODEL;
  }

  const normalized = value.trim();
  return normalized || DEFAULT_TRANSLATION_MODEL;
}

async function translateJsonStrings(params: {
  content: Record<string, unknown>;
  sourceLocale: string;
  targetLocale: string;
  model: string;
}): Promise<Record<string, unknown>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = [
    `You are translating structured JSON marketing content from ${params.sourceLocale} to ${params.targetLocale}.`,
    'Rules:',
    '- Preserve JSON keys and structure exactly.',
    '- Translate only string values.',
    '- Keep URLs, product names, and placeholders exactly as-is (examples: {{name}}, {count}, %s, :param).',
    '- Preserve line breaks and sentence intent.',
    '- Return only valid JSON with no markdown wrappers.',
    '',
    JSON.stringify(params.content),
  ].join('\n');

  const response = await client.responses.create({
    model: params.model,
    input: prompt,
  });

  const output = response.output_text?.trim();
  if (!output) {
    throw new Error('Translation model returned empty output');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error('Translation model returned invalid JSON');
  }

  if (!isJsonRecord(parsed)) {
    throw new Error('Translated content must be a JSON object');
  }

  return parsed;
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
        { message: 'Only ADMIN can generate marketing content translations' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as TranslateMarketingContentRequest;
    const contentKey = typeof body.contentKey === 'string' ? body.contentKey.trim() : '';
    const sourceLocale = typeof body.sourceLocale === 'string' ? body.sourceLocale.trim() : '';
    const targetLocale = typeof body.targetLocale === 'string' ? body.targetLocale.trim() : '';
    const sourceVersionId =
      typeof body.sourceVersionId === 'string' ? body.sourceVersionId.trim() || null : null;
    const model = sanitizeModel(body.model);

    if (!MARKETING_CONTENT_DEFINITIONS.some((item) => item.key === contentKey)) {
      return NextResponse.json({ message: 'Invalid contentKey' }, { status: 400 });
    }

    if (!isSupportedLocale(sourceLocale) || !isSupportedLocale(targetLocale)) {
      return NextResponse.json(
        { message: 'Invalid sourceLocale or targetLocale' },
        { status: 400 },
      );
    }

    if (sourceLocale === targetLocale) {
      return NextResponse.json(
        { message: 'sourceLocale and targetLocale must be different' },
        { status: 400 },
      );
    }

    const sourceVersion = await getMarketingContentSourceVersion({
      contentKey,
      locale: sourceLocale,
      sourceVersionId,
    });

    if (!sourceVersion) {
      return NextResponse.json(
        { message: 'No source marketing content version found for translation' },
        { status: 404 },
      );
    }

    const translatedContent = await translateJsonStrings({
      content: sourceVersion.content,
      sourceLocale,
      targetLocale,
      model,
    });

    const validation = validateMarketingContentShape(contentKey, translatedContent);
    if (!validation.valid) {
      return NextResponse.json(
        {
          message: 'Translated content shape validation failed',
          errors: validation.errors,
        },
        { status: 400 },
      );
    }

    const draft = await saveMarketingContentDraft({
      contentKey,
      locale: targetLocale,
      content: translatedContent,
      notes: `AI translation draft from ${sourceLocale} v${sourceVersion.versionNumber}`,
      actorUserId: adminUser.id,
      actorEmail: adminUser.email,
      sourceVersionId: sourceVersion.id,
      translationOrigin: 'AI_ASSISTED',
      translationModel: model,
    });

    try {
      await recordMarketingContentAuditLog({
        actor: adminUser,
        action: AUDIT_ACTION_MARKETING_CONTENT_TRANSLATION_GENERATED,
        contentKey,
        metadata: {
          sourceLocale,
          targetLocale,
          sourceVersionId: sourceVersion.id,
          sourceVersionNumber: sourceVersion.versionNumber,
          generatedVersionId: draft.id,
          generatedVersionNumber: draft.versionNumber,
          model,
        },
      });
    } catch (auditError) {
      console.error('Failed to record marketing translation audit log:', auditError);
    }

    return NextResponse.json({ item: draft, sourceVersion });
  } catch (error) {
    console.error('Failed to generate marketing content translation:', error);
    return NextResponse.json(
      { message: 'Failed to generate marketing content translation' },
      { status: 500 },
    );
  }
}
