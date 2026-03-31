import { Prisma, type MarketingContentKind, type MarketingTranslationOrigin } from '@prisma/client';

import { prisma } from './prisma';

const HOME_PAGE_TEMPLATE = {
  hero: {
    eyebrow: 'Write faster with better harmonic starting points',
    title: 'Build chord progressions that feel musical before the first export.',
    description:
      'ProgressionLab helps songwriters explore harmonic ideas, shape arrangements, and keep momentum without losing taste.',
    primaryCta: 'Start free',
    secondaryCta: 'See pricing',
  },
  proofStrip: {
    items: ['Fast iteration', 'Playable voicings', 'Shareable outputs'],
  },
  howItWorks: {
    title: 'How it works',
    steps: [
      'Describe the style, feel, and key center you want.',
      'Generate progressions and compare musical directions.',
      'Save, arrange, export, and share the best ideas.',
    ],
  },
  faq: [],
  seo: {
    title: 'ProgressionLab for songwriters',
    description: 'Generate chord progressions and turn them into usable songwriting drafts.',
  },
};

const PRICING_PAGE_TEMPLATE = {
  hero: {
    eyebrow: 'Choose the workflow that matches your writing pace',
    title: 'Pricing built for casual exploration and daily studio work.',
    description: 'Start free, then upgrade when you need more generations, storage, and exports.',
  },
  planSummaries: {
    session: 'A meaningful free tier for testing the workflow.',
    composer: 'The default paid tier for regular songwriting.',
    studio: 'Maximum headroom for daily power users.',
  },
  faq: [],
  trustCopy: {
    billing: 'Upgrade or cancel with clear billing terms.',
  },
};

const GLOBAL_MARKETING_CHROME_TEMPLATE = {
  nav: {
    primaryCta: 'Start free',
    secondaryCta: 'Pricing',
    pricingLabel: 'Pricing',
    progressionsLabel: 'Progressions',
  },
  footer: {
    description: 'AI-assisted songwriting tools for harmonic exploration and arrangement planning.',
    supportLabel: 'Support',
    legalLabel: 'Legal',
  },
  announcement: null,
};

const PUBLIC_PROGRESSIONS_TEMPLATE = {
  hero: {
    eyebrow: 'Hear what creators are making',
    title: 'Browse public progressions for ideas and proof of output quality.',
    description:
      'See what writers are building, then start your own progression when you are ready.',
  },
  emptyState: {
    title: 'No public progressions yet',
    description: 'Create and share a progression to populate this gallery.',
    cta: 'Start generating',
  },
  signInPrompt: {
    title: 'Save the ideas you want to keep',
    description: 'Create an account to save, organize, and share your favorite progressions.',
    cta: 'Create account',
  },
};

export type MarketingContentDefinition = {
  key: string;
  label: string;
  description: string;
  contentKind: MarketingContentKind;
  schemaVersion: number;
  defaultLocale: string;
  defaultContent: Record<string, unknown>;
};

export const SUPPORTED_MARKETING_LOCALES = [
  'en',
  'en-GB',
  'es',
  'es-ES',
  'es-GQ',
  'fr',
  'el',
  'de',
  'sv-SE',
  'da-DK',
  'nb-NO',
  'fi-FI',
  'is-IS',
  'it',
  'pt-BR',
  'pt-PT',
  'pt-AO',
  'pt-MZ',
  'nl',
  'pl',
  'tr',
  'ja',
  'ko',
  'zh-CN',
  'zh-TW',
  'hi',
  'ar',
  'ar-EG',
  'ar-MA',
  'he',
] as const;

export const MARKETING_CONTENT_DEFINITIONS: readonly MarketingContentDefinition[] = [
  {
    key: 'homepage',
    label: 'Homepage',
    description: 'Hero, proof, FAQ, and SEO content for the main landing experience.',
    contentKind: 'PAGE',
    schemaVersion: 1,
    defaultLocale: 'en',
    defaultContent: HOME_PAGE_TEMPLATE,
  },
  {
    key: 'pricing',
    label: 'Pricing Page',
    description: 'Narrative pricing copy, CTA framing, and pricing-specific FAQs.',
    contentKind: 'PAGE',
    schemaVersion: 1,
    defaultLocale: 'en',
    defaultContent: PRICING_PAGE_TEMPLATE,
  },
  {
    key: 'global_marketing_chrome',
    label: 'Global Marketing Chrome',
    description: 'Anonymous navigation, footer messaging, and global announcement content.',
    contentKind: 'GLOBAL_CHROME',
    schemaVersion: 1,
    defaultLocale: 'en',
    defaultContent: GLOBAL_MARKETING_CHROME_TEMPLATE,
  },
  {
    key: 'public_progressions',
    label: 'Public Progressions',
    description: 'Gallery framing, empty states, and CTA copy for shared progressions.',
    contentKind: 'DISCOVERY_SURFACE',
    schemaVersion: 1,
    defaultLocale: 'en',
    defaultContent: PUBLIC_PROGRESSIONS_TEMPLATE,
  },
] as const;

export type MarketingContentVersionRecord = {
  id: string;
  marketingContentId: string;
  contentKey: string;
  contentKind: MarketingContentKind;
  schemaVersion: number;
  locale: string;
  versionNumber: number;
  content: Record<string, unknown>;
  notes: string | null;
  isDraft: boolean;
  isActive: boolean;
  editorUserId: string | null;
  editorEmail: string | null;
  publishedAt: string | null;
  sourceVersionId: string | null;
  translationOrigin: MarketingTranslationOrigin | null;
  translationModel: string | null;
  translationGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketingContentState = {
  contentKey: string;
  locale: string;
  definitions: MarketingContentDefinition[];
  supportedLocales: string[];
  active: MarketingContentVersionRecord | null;
  draft: MarketingContentVersionRecord | null;
  versions: MarketingContentVersionRecord[];
  defaultContent: Record<string, unknown>;
};

export type SaveMarketingContentDraftParams = {
  contentKey: string;
  locale: string;
  content: Record<string, unknown>;
  notes: string | null;
  actorUserId: string;
  actorEmail: string;
  translationOrigin?: MarketingTranslationOrigin | null;
  sourceVersionId?: string | null;
  translationModel?: string | null;
};

type MarketingContentVersionRow = {
  id: string;
  marketingContentId: string;
  locale: string;
  versionNumber: number;
  content: Prisma.JsonValue;
  notes: string | null;
  isDraft: boolean;
  isActive: boolean;
  editorUserId: string | null;
  editorEmail: string | null;
  publishedAt: Date | null;
  sourceVersionId: string | null;
  translationOrigin: MarketingTranslationOrigin | null;
  translationModel: string | null;
  translationGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  marketingContent: {
    key: string;
    contentKind: MarketingContentKind;
    schemaVersion: number;
  };
};

function getDefinition(contentKey: string): MarketingContentDefinition {
  const definition = MARKETING_CONTENT_DEFINITIONS.find((item) => item.key === contentKey);

  if (!definition) {
    throw new Error(`Unsupported marketing content key: ${contentKey}`);
  }

  return definition;
}

function toMarketingContentVersionRecord(
  item: MarketingContentVersionRow,
): MarketingContentVersionRecord {
  return {
    id: item.id,
    marketingContentId: item.marketingContentId,
    contentKey: item.marketingContent.key,
    contentKind: item.marketingContent.contentKind,
    schemaVersion: item.marketingContent.schemaVersion,
    locale: item.locale,
    versionNumber: item.versionNumber,
    content: (item.content ?? {}) as Record<string, unknown>,
    notes: item.notes,
    isDraft: item.isDraft,
    isActive: item.isActive,
    editorUserId: item.editorUserId,
    editorEmail: item.editorEmail,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    sourceVersionId: item.sourceVersionId,
    translationOrigin: item.translationOrigin,
    translationModel: item.translationModel,
    translationGeneratedAt: item.translationGeneratedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function getMarketingContentDefinitions(): MarketingContentDefinition[] {
  return MARKETING_CONTENT_DEFINITIONS.map((item) => ({
    ...item,
    defaultContent: structuredClone(item.defaultContent),
  }));
}

export async function getMarketingContentVersions(
  contentKey: string,
  locale: string,
): Promise<MarketingContentVersionRecord[]> {
  const rows = await prisma.marketingContentVersion.findMany({
    where: {
      locale,
      marketingContent: {
        key: contentKey,
      },
    },
    include: {
      marketingContent: {
        select: {
          key: true,
          contentKind: true,
          schemaVersion: true,
        },
      },
    },
    orderBy: [{ versionNumber: 'desc' }, { createdAt: 'desc' }],
  });

  return rows.map((item) => toMarketingContentVersionRecord(item as MarketingContentVersionRow));
}

export async function getMarketingContentBuilderState(
  contentKey: string,
  locale: string,
): Promise<MarketingContentState> {
  const definition = getDefinition(contentKey);
  const versions = await getMarketingContentVersions(contentKey, locale);

  return {
    contentKey,
    locale,
    definitions: getMarketingContentDefinitions(),
    supportedLocales: [...SUPPORTED_MARKETING_LOCALES],
    active: versions.find((item) => item.isActive) ?? null,
    draft: versions.find((item) => item.isDraft) ?? null,
    versions,
    defaultContent: structuredClone(definition.defaultContent),
  };
}

export async function saveMarketingContentDraft(
  params: SaveMarketingContentDraftParams,
): Promise<MarketingContentVersionRecord> {
  const definition = getDefinition(params.contentKey);

  return prisma.$transaction(async (tx) => {
    const marketingContent = await tx.marketingContent.upsert({
      where: { key: params.contentKey },
      update: {
        contentKind: definition.contentKind,
        schemaVersion: definition.schemaVersion,
        defaultLocale: definition.defaultLocale,
      },
      create: {
        key: params.contentKey,
        contentKind: definition.contentKind,
        schemaVersion: definition.schemaVersion,
        defaultLocale: definition.defaultLocale,
      },
    });

    const existingDraft = await tx.marketingContentVersion.findFirst({
      where: {
        marketingContentId: marketingContent.id,
        locale: params.locale,
        isDraft: true,
      },
      orderBy: {
        versionNumber: 'desc',
      },
      include: {
        marketingContent: {
          select: {
            key: true,
            contentKind: true,
            schemaVersion: true,
          },
        },
      },
    });

    if (existingDraft) {
      const updated = await tx.marketingContentVersion.update({
        where: { id: existingDraft.id },
        data: {
          content: params.content as Prisma.InputJsonValue,
          notes: params.notes,
          editorUserId: params.actorUserId,
          editorEmail: params.actorEmail,
          sourceVersionId: params.sourceVersionId ?? null,
          translationOrigin: params.translationOrigin ?? null,
          translationModel: params.translationModel ?? null,
          translationGeneratedAt: params.translationOrigin === 'AI_ASSISTED' ? new Date() : null,
        },
        include: {
          marketingContent: {
            select: {
              key: true,
              contentKind: true,
              schemaVersion: true,
            },
          },
        },
      });

      return toMarketingContentVersionRecord(updated as MarketingContentVersionRow);
    }

    const maxVersion = await tx.marketingContentVersion.aggregate({
      where: {
        marketingContentId: marketingContent.id,
        locale: params.locale,
      },
      _max: {
        versionNumber: true,
      },
    });

    const created = await tx.marketingContentVersion.create({
      data: {
        marketingContentId: marketingContent.id,
        locale: params.locale,
        versionNumber: (maxVersion._max.versionNumber ?? 0) + 1,
        content: params.content as Prisma.InputJsonValue,
        notes: params.notes,
        isDraft: true,
        isActive: false,
        editorUserId: params.actorUserId,
        editorEmail: params.actorEmail,
        sourceVersionId: params.sourceVersionId ?? null,
        translationOrigin: params.translationOrigin ?? null,
        translationModel: params.translationModel ?? null,
        translationGeneratedAt: params.translationOrigin === 'AI_ASSISTED' ? new Date() : null,
      },
      include: {
        marketingContent: {
          select: {
            key: true,
            contentKind: true,
            schemaVersion: true,
          },
        },
      },
    });

    return toMarketingContentVersionRecord(created as MarketingContentVersionRow);
  });
}

export async function publishMarketingContentDraft(params: {
  contentKey: string;
  locale: string;
}): Promise<MarketingContentVersionRecord | null> {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.marketingContentVersion.findFirst({
      where: {
        locale: params.locale,
        isDraft: true,
        marketingContent: {
          key: params.contentKey,
        },
      },
      include: {
        marketingContent: {
          select: {
            id: true,
            key: true,
            contentKind: true,
            schemaVersion: true,
          },
        },
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    if (!draft) {
      return null;
    }

    await tx.marketingContentVersion.updateMany({
      where: {
        marketingContentId: draft.marketingContent.id,
        locale: params.locale,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const published = await tx.marketingContentVersion.update({
      where: { id: draft.id },
      data: {
        isDraft: false,
        isActive: true,
        publishedAt: new Date(),
      },
      include: {
        marketingContent: {
          select: {
            key: true,
            contentKind: true,
            schemaVersion: true,
          },
        },
      },
    });

    return toMarketingContentVersionRecord(published as MarketingContentVersionRow);
  });
}

export async function rollbackMarketingContentVersion(params: {
  contentKey: string;
  locale: string;
  versionId: string;
}): Promise<MarketingContentVersionRecord | null> {
  return prisma.$transaction(async (tx) => {
    const target = await tx.marketingContentVersion.findFirst({
      where: {
        id: params.versionId,
        locale: params.locale,
        marketingContent: {
          key: params.contentKey,
        },
      },
      include: {
        marketingContent: {
          select: {
            id: true,
            key: true,
            contentKind: true,
            schemaVersion: true,
          },
        },
      },
    });

    if (!target) {
      return null;
    }

    await tx.marketingContentVersion.updateMany({
      where: {
        marketingContentId: target.marketingContent.id,
        locale: params.locale,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const rolledBack = await tx.marketingContentVersion.update({
      where: { id: target.id },
      data: {
        isDraft: false,
        isActive: true,
        publishedAt: target.publishedAt ?? new Date(),
      },
      include: {
        marketingContent: {
          select: {
            key: true,
            contentKind: true,
            schemaVersion: true,
          },
        },
      },
    });

    return toMarketingContentVersionRecord(rolledBack as MarketingContentVersionRow);
  });
}

export async function getMarketingContentSourceVersion(params: {
  contentKey: string;
  locale: string;
  sourceVersionId?: string | null;
}): Promise<MarketingContentVersionRecord | null> {
  const where = {
    locale: params.locale,
    marketingContent: {
      key: params.contentKey,
    },
    ...(params.sourceVersionId ? { id: params.sourceVersionId } : {}),
  };

  const source = await prisma.marketingContentVersion.findFirst({
    where,
    include: {
      marketingContent: {
        select: {
          key: true,
          contentKind: true,
          schemaVersion: true,
        },
      },
    },
    orderBy: [{ isDraft: 'desc' }, { isActive: 'desc' }, { versionNumber: 'desc' }],
  });

  return source ? toMarketingContentVersionRecord(source as MarketingContentVersionRow) : null;
}
