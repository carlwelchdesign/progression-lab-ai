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
  upgradeFlow: {
    signInHint: 'Create an account to start a paid plan and keep billing history in one place.',
    composerCta: 'Start Composer',
    studioCta: 'Start Studio',
    checkoutPendingLabel: 'Preparing checkout...',
    keepUsingSessionLabel: 'Continue with Session plan',
  },
};

const AUTH_FLOW_COPY_TEMPLATE = {
  generic: {
    modalTitle: 'Create your free account',
    modalDescription: 'Save progressions, revisit arrangements, and keep momentum across sessions.',
    loginButtonLabel: 'Sign in',
    registerButtonLabel: 'Create account',
    benefitDescription: 'Unlock save, export, and progression history.',
  },
  'my-progressions': {
    modalTitle: 'Access your progressions',
    modalDescription: 'Sign in to manage saved progressions and arrangements.',
    benefitDescription: 'Keep your best ideas organized and shareable.',
  },
  'save-arrangement': {
    modalTitle: 'Save this arrangement',
    modalDescription: 'Create an account to store this arrangement and continue refining it later.',
    benefitDescription: 'Stored arrangements are synced to your account.',
  },
  'upgrade-plan': {
    modalTitle: 'Upgrade your workflow',
    modalDescription:
      'Create your account first, then choose the plan that fits your writing cadence.',
    benefitDescription: 'Paid plans unlock more generations, exports, and sharing limits.',
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
  {
    key: 'auth_flow_copy',
    label: 'Auth Flow Copy',
    description: 'Intent-specific login/register messaging for save, upgrade, and access prompts.',
    contentKind: 'PAGE',
    schemaVersion: 1,
    defaultLocale: 'en',
    defaultContent: AUTH_FLOW_COPY_TEMPLATE,
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
  sourceLocale: string;
  definitions: MarketingContentDefinition[];
  supportedLocales: string[];
  active: MarketingContentVersionRecord | null;
  draft: MarketingContentVersionRecord | null;
  versions: MarketingContentVersionRecord[];
  sourceActiveVersionId: string | null;
  sourceActiveVersionNumber: number | null;
  staleVersionIds: string[];
  selectedDraftIsStale: boolean;
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
  sourceLocale = 'en',
): Promise<MarketingContentState> {
  const definition = getDefinition(contentKey);
  const versions = await getMarketingContentVersions(contentKey, locale);
  const sourceActiveVersion =
    sourceLocale === locale
      ? null
      : await prisma.marketingContentVersion.findFirst({
          where: {
            locale: sourceLocale,
            isActive: true,
            marketingContent: {
              key: contentKey,
            },
          },
          select: {
            id: true,
            versionNumber: true,
          },
          orderBy: [{ versionNumber: 'desc' }, { createdAt: 'desc' }],
        });
  const sourceActiveVersionId = sourceActiveVersion?.id ?? null;
  const staleVersionIds =
    sourceLocale === locale || !sourceActiveVersionId
      ? []
      : versions
          .filter(
            (item) =>
              item.translationOrigin === 'AI_ASSISTED' &&
              !!item.sourceVersionId &&
              item.sourceVersionId !== sourceActiveVersionId,
          )
          .map((item) => item.id);
  const draft = versions.find((item) => item.isDraft) ?? null;

  return {
    contentKey,
    locale,
    sourceLocale,
    definitions: getMarketingContentDefinitions(),
    supportedLocales: [...SUPPORTED_MARKETING_LOCALES],
    active: versions.find((item) => item.isActive) ?? null,
    draft,
    versions,
    sourceActiveVersionId,
    sourceActiveVersionNumber: sourceActiveVersion?.versionNumber ?? null,
    staleVersionIds,
    selectedDraftIsStale: !!(draft && staleVersionIds.includes(draft.id)),
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
  const include = {
    marketingContent: {
      select: {
        key: true,
        contentKind: true,
        schemaVersion: true,
      },
    },
  };

  if (params.sourceVersionId) {
    const source = await prisma.marketingContentVersion.findFirst({
      where: {
        id: params.sourceVersionId,
        locale: params.locale,
        marketingContent: {
          key: params.contentKey,
        },
      },
      include,
    });

    return source ? toMarketingContentVersionRecord(source as MarketingContentVersionRow) : null;
  }

  const activeSource = await prisma.marketingContentVersion.findFirst({
    where: {
      locale: params.locale,
      isActive: true,
      marketingContent: {
        key: params.contentKey,
      },
    },
    include,
    orderBy: [{ versionNumber: 'desc' }, { createdAt: 'desc' }],
  });

  if (activeSource) {
    return toMarketingContentVersionRecord(activeSource as MarketingContentVersionRow);
  }

  const publishedSource = await prisma.marketingContentVersion.findFirst({
    where: {
      locale: params.locale,
      isDraft: false,
      marketingContent: {
        key: params.contentKey,
      },
    },
    include,
    orderBy: [{ versionNumber: 'desc' }, { createdAt: 'desc' }],
  });

  if (publishedSource) {
    return toMarketingContentVersionRecord(publishedSource as MarketingContentVersionRow);
  }

  const fallbackSource = await prisma.marketingContentVersion.findFirst({
    where: {
      locale: params.locale,
      marketingContent: {
        key: params.contentKey,
      },
    },
    include,
    orderBy: [{ versionNumber: 'desc' }, { createdAt: 'desc' }],
  });

  return fallbackSource
    ? toMarketingContentVersionRecord(fallbackSource as MarketingContentVersionRow)
    : null;
}

export type PublishOrRollbackResponse = {
  item: MarketingContentVersionRecord;
  stale?: {
    isStale: boolean;
    sourceActiveVersionId: string | null;
    sourceActiveVersionNumber: number | null;
  };
};

export async function calculateStaleMetadataForVersion(params: {
  contentKey: string;
  locale: string;
  sourceLocale?: string;
}): Promise<PublishOrRollbackResponse['stale']> {
  const sourceLocale = params.sourceLocale ?? 'en';

  if (sourceLocale === params.locale) {
    return {
      isStale: false,
      sourceActiveVersionId: null,
      sourceActiveVersionNumber: null,
    };
  }

  const sourceActiveVersion = await prisma.marketingContentVersion.findFirst({
    where: {
      locale: sourceLocale,
      isActive: true,
      marketingContent: {
        key: params.contentKey,
      },
    },
    select: {
      id: true,
      versionNumber: true,
    },
    orderBy: [{ versionNumber: 'desc' }, { createdAt: 'desc' }],
  });

  return {
    isStale: false,
    sourceActiveVersionId: sourceActiveVersion?.id ?? null,
    sourceActiveVersionNumber: sourceActiveVersion?.versionNumber ?? null,
  };
}
