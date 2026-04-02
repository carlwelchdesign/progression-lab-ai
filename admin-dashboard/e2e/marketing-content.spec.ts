import type { Page, Route } from '@playwright/test';

import { expect, test } from './fixtures/test';

const now = '2026-03-30T00:00:00.000Z';

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installMarketingMocks(page: Page) {
  const definitions = [
    {
      key: 'homepage',
      label: 'Homepage',
      description: 'Homepage content',
      contentKind: 'PAGE',
      schemaVersion: 1,
      defaultLocale: 'en',
      defaultContent: {
        hero: { title: 'Default Homepage Title' },
      },
    },
    {
      key: 'pricing',
      label: 'Pricing',
      description: 'Pricing page content',
      contentKind: 'PAGE',
      schemaVersion: 1,
      defaultLocale: 'en',
      defaultContent: {
        hero: { title: 'Default Pricing Title' },
      },
    },
  ];

  const activeEn = {
    id: 'mkt-home-en-v3',
    marketingContentId: 'mkt-home-en',
    contentKey: 'homepage',
    contentKind: 'PAGE',
    schemaVersion: 1,
    locale: 'en',
    versionNumber: 3,
    content: {
      hero: {
        title: 'Compose faster',
        description: 'Build polished progressions quickly.',
      },
    },
    notes: 'Published version',
    isDraft: false,
    isActive: true,
    editorUserId: 'admin-user-1',
    editorEmail: 'admin@progressionlab.ai',
    publishedAt: now,
    sourceVersionId: null,
    translationOrigin: null,
    translationModel: null,
    translationGeneratedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const draftEn = {
    ...activeEn,
    id: 'mkt-home-en-v4-draft',
    versionNumber: 4,
    content: {
      hero: {
        title: 'Compose even faster',
        description: 'Draft update for homepage.',
      },
    },
    notes: 'Draft update',
    isDraft: true,
    isActive: false,
    publishedAt: null,
    updatedAt: '2026-03-31T00:00:00.000Z',
  };

  const draftEs = {
    ...activeEn,
    id: 'mkt-home-es-v5-draft',
    locale: 'es',
    versionNumber: 5,
    content: {
      hero: {
        title: 'Componer mas rapido',
        description: 'Borrador de traduccion.',
      },
    },
    notes: 'AI translation draft',
    isDraft: true,
    isActive: false,
    publishedAt: null,
    sourceVersionId: activeEn.id,
    translationOrigin: 'AI_ASSISTED',
    translationModel: 'gpt-test',
    translationGeneratedAt: now,
  };

  await page.route('**/api/marketing-content?**', async (route) => {
    const url = new URL(route.request().url());
    const contentKey = url.searchParams.get('contentKey') || 'homepage';
    const locale = url.searchParams.get('locale') || 'en';
    const sourceLocale = url.searchParams.get('sourceLocale') || 'en';

    const response = {
      contentKey,
      locale,
      sourceLocale,
      definitions,
      supportedLocales: ['en', 'es'],
      active: locale === 'en' ? activeEn : null,
      draft: locale === 'en' ? draftEn : draftEs,
      versions: locale === 'en' ? [draftEn, activeEn] : [draftEs, activeEn],
      sourceActiveVersionId: activeEn.id,
      sourceActiveVersionNumber: activeEn.versionNumber,
      staleVersionIds: locale === 'es' ? [draftEs.id] : [],
      selectedDraftIsStale: locale === 'es',
      defaultContent:
        definitions.find((definition) => definition.key === contentKey)?.defaultContent ?? {},
    };

    await fulfillJson(route, response);
  });

  await page.route('**/api/marketing-content/publish', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as {
      contentKey?: string;
      locale?: string;
    };

    await fulfillJson(route, {
      item: {
        ...activeEn,
        id: 'mkt-home-en-v4',
        versionNumber: 4,
        contentKey: body.contentKey ?? 'homepage',
        locale: body.locale ?? 'en',
      },
      stale: {
        isStale: false,
        sourceActiveVersionId: activeEn.id,
        sourceActiveVersionNumber: activeEn.versionNumber,
      },
    });
  });

  await page.route('**/api/marketing-content/translate', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as {
      contentKey?: string;
      targetLocale?: string;
      sourceVersionId?: string | null;
    };

    await fulfillJson(route, {
      item: {
        ...draftEs,
        contentKey: body.contentKey ?? 'homepage',
        locale: body.targetLocale ?? 'es',
        sourceVersionId: body.sourceVersionId ?? activeEn.id,
      },
      sourceVersion: {
        id: activeEn.id,
        versionNumber: activeEn.versionNumber,
      },
    });
  });
}

test.describe('Marketing CMS Admin Flow', () => {
  const localeSelect = (page: Page) => page.getByRole('combobox', { name: /^Locale\b/i });

  test.beforeEach(async ({ page, adminDashboardPage }) => {
    await installMarketingMocks(page);

    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoginVisible();
    await adminDashboardPage.signIn('admin@progressionlab.ai', 'password123');
    await adminDashboardPage.expectDashboardVisible();

    await page.getByRole('tab', { name: 'Marketing Content' }).click();
    await expect(page.getByRole('heading', { name: 'Marketing Content' })).toBeVisible();
  });

  test('can access Marketing Content panel in admin dashboard', async ({ page }) => {
    await expect(page.getByLabel('Content surface')).toBeVisible();
    await expect(localeSelect(page)).toBeVisible();
    await expect(page.getByLabel('Content JSON')).toBeVisible();
  });

  test('can select and view marketing content draft', async ({ page }) => {
    await page.getByLabel('Content surface').click();
    await page.getByRole('option', { name: 'Pricing' }).click();

    await expect(page.getByText('Pricing page content')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Live Content Preview' })).toBeVisible();
  });

  test('can generate AI translation draft and view stale indicator', async ({ page }) => {
    await localeSelect(page).click();
    await page.getByRole('option', { name: 'es' }).click();

    await expect(
      page.getByText('This draft is stale. The active en source version has changed'),
    ).toBeVisible();

    const translatePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/marketing-content/translate') && response.status() === 200,
    );

    await page.getByRole('button', { name: 'Generate AI Translation Draft' }).click();
    await translatePromise;
  });

  test('publish action returns updated stale metadata in response', async ({ page }) => {
    const publishPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/marketing-content/publish') && response.status() === 200,
    );

    await page.getByRole('button', { name: 'Publish Draft' }).click();

    const response = await publishPromise;
    const body = (await response.json()) as {
      stale?: {
        isStale: boolean;
        sourceActiveVersionId: string | null;
        sourceActiveVersionNumber: number | null;
      };
    };

    expect(body.stale).toBeDefined();
    expect(body.stale?.isStale).toBe(false);
    expect(body.stale?.sourceActiveVersionId).toBe('mkt-home-en-v3');
    expect(body.stale?.sourceActiveVersionNumber).toBe(3);
  });
});
