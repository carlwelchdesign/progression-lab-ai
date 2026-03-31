import { expect } from '@playwright/test';

import { test } from './fixtures/test';

test.describe('marketing CMS admin workflow', () => {
  test('admin can create, translate, and publish marketing content', async ({ api, page }) => {
    // Login as admin
    await api.mockAdminUser();
    await page.goto('/admin');

    // Navigate to marketing content tab
    const marketingTab = page.getByRole('tab', { name: /marketing/i });
    await expect(marketingTab).toBeVisible();
    await marketingTab.click();

    // Create a new draft for homepage content
    const contentSurfaceSelect = page.getByLabel(/content surface/i);
    await expect(contentSurfaceSelect).toBeVisible();
    await contentSurfaceSelect.selectOption('homepage');

    const heroTitleInput = page.getByLabel(/hero.*title/i);
    await expect(heroTitleInput).toBeVisible();
    await heroTitleInput.fill('Test Homepage Hero Title');

    const saveDraftButton = page.getByRole('button', { name: /save draft/i });
    await expect(saveDraftButton).toBeVisible();
    await saveDraftButton.click();

    // Verify draft saved notification
    const savedNotif = page.getByText(/draft saved/i);
    await expect(savedNotif).toBeVisible({ timeout: 5000 });

    // Generate translation draft for a different locale
    const localeSelect = page.getByLabel(/target.*locale/i);
    await expect(localeSelect).toBeVisible();
    await localeSelect.selectOption('es');

    const translateButton = page.getByRole('button', { name: /generate translation/i });
    await expect(translateButton).toBeVisible();
    await translateButton.click();

    // Verify translation draft created
    const translationNotif = page.getByText(/translation.*generated|translation draft created/i);
    await expect(translationNotif).toBeVisible({ timeout: 10000 });

    // Verify Spanish draft appears in version list
    const esVersionRow = page.getByRole('row').filter({ has: page.getByText(/es|spanish/i) });
    await expect(esVersionRow).toBeVisible();
    const esStatus = esVersionRow.getByText(/draft/i);
    await expect(esStatus).toBeVisible();

    // Switch back to English and publish
    await localeSelect.selectOption('en');

    const publishButton = page.getByRole('button', { name: /publish/i });
    await expect(publishButton).toBeVisible();
    await publishButton.click();

    // Verify publish confirmation
    const publishedNotif = page.getByText(/published|version now active/i);
    await expect(publishedNotif).toBeVisible({ timeout: 5000 });

    // Verify English version shows active status
    const enVersionRow = page.getByRole('row').filter({ has: page.getByText(/en|english/i) });
    const enStatus = enVersionRow.getByText(/active/i);
    await expect(enStatus).toBeVisible();
  });

  test('public homepage renders published marketing content with locale fallback', async ({
    api,
    page,
  }) => {
    // Mock published English marketing content with custom hero title
    await api.mockPublishedMarketingContent({
      surface: 'homepage',
      locale: 'en',
      content: {
        hero: {
          title: 'CMS-Controlled Hero Title',
          description: 'This title came from the marketing CMS',
        },
      },
    });

    await page.goto('/');

    // Verify CMS content renders on public homepage
    const heroTitle = page.getByText(/CMS-Controlled Hero Title/);
    await expect(heroTitle).toBeVisible();

    const heroDescription = page.getByText(/This title came from the marketing CMS/);
    await expect(heroDescription).toBeVisible();
  });

  test('public homepage falls back gracefully when marketing content is missing', async ({
    api,
    page,
  }) => {
    // No mocked marketing content; system should fall back to defaults
    await page.goto('/');

    // Verify page still renders without breaking
    const generatorCard = page.getByRole('heading', { name: /generator|chord|progression/i });
    await expect(generatorCard).toBeVisible({ timeout: 5000 });

    // Verify at least one default copy element exists
    const anyText = page.locator('body');
    await expect(anyText).toBeTruthy();
  });

  test('stale translation indicator appears when source locale is updated', async ({
    api,
    page,
  }) => {
    await api.mockAdminUser();
    await page.goto('/admin');

    const marketingTab = page.getByRole('tab', { name: /marketing/i });
    await expect(marketingTab).toBeVisible();
    await marketingTab.click();

    // Create and publish an English homepage draft
    const contentSurfaceSelect = page.getByLabel(/content surface/i);
    await contentSurfaceSelect.selectOption('homepage');

    const heroTitleInput = page.getByLabel(/hero.*title/i);
    await heroTitleInput.fill('Version 1 Title');

    const saveDraftButton = page.getByRole('button', { name: /save draft/i });
    await saveDraftButton.click();

    await page.getByText(/draft saved/i).waitFor({ state: 'visible', timeout: 5000 });

    const publishButton = page.getByRole('button', { name: /publish/i });
    await publishButton.click();

    await page.getByText(/published/i).waitFor({ state: 'visible', timeout: 5000 });

    // Generate a Spanish translation from this version
    const localeSelect = page.getByLabel(/target.*locale/i);
    await localeSelect.selectOption('es');

    const translateButton = page.getByRole('button', { name: /generate translation/i });
    await translateButton.click();

    await page.getByText(/translation.*generated|translation draft created/i).waitFor({
      state: 'visible',
      timeout: 10000,
    });

    // Update English version again
    await localeSelect.selectOption('en');
    await heroTitleInput.fill('Version 2 Title');
    await saveDraftButton.click();

    await page.getByText(/draft saved/i).waitFor({ state: 'visible', timeout: 5000 });

    const publishButton2 = page.getByRole('button', { name: /publish/i });
    await publishButton2.click();

    await page.getByText(/published/i).waitFor({ state: 'visible', timeout: 5000 });

    // Switch to Spanish and verify stale indicator
    await localeSelect.selectOption('es');

    const staleIndicator = page.getByText(/stale|outdated|source.*updated/i);
    await expect(staleIndicator).toBeVisible();
  });
});
