import { normalizeAppLocale } from './i18n/locales';
import { prisma } from './prisma';

export const PUBLIC_MARKETING_CONTENT_KEYS = [
  'homepage',
  'pricing',
  'global_marketing_chrome',
  'public_progressions',
] as const;

export type PublicMarketingContentKey = (typeof PUBLIC_MARKETING_CONTENT_KEYS)[number];

export type PublicMarketingContentResult = {
  contentKey: PublicMarketingContentKey;
  requestedLocale: string;
  resolvedLocale: string;
  versionId: string;
  versionNumber: number;
  content: Record<string, unknown>;
  updatedAt: string;
};

function isPublicMarketingContentKey(value: string): value is PublicMarketingContentKey {
  return PUBLIC_MARKETING_CONTENT_KEYS.includes(value as PublicMarketingContentKey);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function resolvePublicMarketingContentKey(value: string): PublicMarketingContentKey | null {
  return isPublicMarketingContentKey(value) ? value : null;
}

export async function getPublishedMarketingContent(params: {
  contentKey: PublicMarketingContentKey;
  locale: string;
}): Promise<PublicMarketingContentResult | null> {
  const normalizedLocale = normalizeAppLocale(params.locale || 'en');
  const baseLanguage = normalizedLocale.split('-')[0] ?? 'en';

  const marketingContent = await prisma.marketingContent.findUnique({
    where: { key: params.contentKey },
    select: {
      id: true,
      defaultLocale: true,
    },
  });

  if (!marketingContent) {
    return null;
  }

  const localePriority = unique([
    normalizedLocale,
    baseLanguage,
    marketingContent.defaultLocale,
    'en',
  ]);

  const versions = await prisma.marketingContentVersion.findMany({
    where: {
      marketingContentId: marketingContent.id,
      isActive: true,
      locale: {
        in: localePriority,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (versions.length === 0) {
    return null;
  }

  const preferredVersion =
    localePriority
      .map((locale) => versions.find((item) => item.locale === locale))
      .find((item) => Boolean(item)) ?? versions[0];

  if (!preferredVersion) {
    return null;
  }

  return {
    contentKey: params.contentKey,
    requestedLocale: params.locale,
    resolvedLocale: preferredVersion.locale,
    versionId: preferredVersion.id,
    versionNumber: preferredVersion.versionNumber,
    content: (preferredVersion.content ?? {}) as Record<string, unknown>,
    updatedAt: preferredVersion.updatedAt.toISOString(),
  };
}
