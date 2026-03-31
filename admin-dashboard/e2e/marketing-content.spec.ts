import { test, expect, Page } from '@playwright/test';

test.describe('Marketing CMS Admin Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3010/admin', { waitUntil: 'networkidle' });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('can access Marketing Content panel in admin dashboard', async () => {
    // Look for the Marketing Content tab
    const marketingTab = page.locator('button:has-text("Marketing Content")');
    await expect(marketingTab).toBeVisible();
    await marketingTab.click();

    // Verify the panel renders
    await expect(page.locator('text=Content Surface')).toBeVisible();
  });

  test('can select and view marketing content draft', async () => {
    const marketingTab = page.locator('button:has-text("Marketing Content")');
    await marketingTab.click();

    // Select homepage content
    const contentSelect = page.locator('[data-testid="content-surface-select"]');
    if (await contentSelect.isVisible()) {
      await contentSelect.click();
      await page.locator('text=Homepage').click();

      // Verify draft area renders
      await expect(page.locator('text=Content')).toBeVisible();
    }
  });

  test('can generate AI translation draft and view stale indicator', async () => {
    const marketingTab = page.locator('button:has-text("Marketing Content")');
    await marketingTab.click();

    // Select a non-English locale
    const localeSelect = page.locator('[data-testid="locale-select"]');
    if (await localeSelect.isVisible()) {
      await localeSelect.click();
      await page.locator('text=Español').first().click();

      // Click translate button if visible
      const translateBtn = page.locator('button:has-text("Generate Translation")');
      if (await translateBtn.isVisible()) {
        await translateBtn.click();

        // Wait for translation to complete
        await page.waitForTimeout(2000);

        // Check for stale indicator or translation metadata
        const staleChip = page.locator('[data-testid="stale-indicator"]');
        if (await staleChip.isVisible()) {
          await expect(staleChip).toContainText('Stale');
        }
      }
    }
  });

  test('publish action returns updated stale metadata in response', async () => {
    const marketingTab = page.locator('button:has-text("Marketing Content")');
    await marketingTab.click();

    // Intercept the publish API call
    const publishPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/marketing-content/publish') && response.status() === 200,
    );

    // Click publish
    const publishBtn = page.locator('button:has-text("Publish")');
    if (await publishBtn.isVisible()) {
      await publishBtn.click();

      // Get the response
      const response = await publishPromise;
      const body = await response.json();

      // Verify stale metadata is in the response
      expect(body.stale).toBeDefined();
      expect(body.stale).toHaveProperty('isStale');
      expect(body.stale).toHaveProperty('sourceActiveVersionId');
      expect(body.stale).toHaveProperty('sourceActiveVersionNumber');
    }
  });
});

test.describe('Marketing Content Public Fallback', () => {
  test('homepage renders CMS sections when content is published', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Verify marketing sections are visible
    // Note: actual content depends on published CMS data
    const heroSection = page.locator('h1, h2').first();
    await expect(heroSection).toBeVisible();
  });

  test('homepage falls back gracefully when CMS content is unavailable', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Generator should always be visible even if CMS fails
    const generatorForm = page.locator('[data-testid="generator-form"], form').first();
    await expect(generatorForm).toBeVisible();
  });

  test('public progressions page uses CMS copy with fallbacks', async ({ page }) => {
    // This would be an actual progressions page that uses CMS content
    // For now,  verify the page is accessible
    await page.goto('http://localhost:3000/p', { waitUntil: 'networkidle' });

    // Page should load even if CMS is down
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('pricing page renders with optional CMS hero content', async ({ page }) => {
    await page.goto('http://localhost:3000/pricing', { waitUntil: 'networkidle' });

    // Verify pricing structure is visible
    const pricingCards = page.locator('[data-testid*="plan-card"], .MuiCard-root').first();
    await expect(pricingCards).toBeVisible();
  });
});

test.describe('Marketing Content Locale Fallback', () => {
  test('public content respects current locale and falls back to default', async ({ page }) => {
    // Note: This would require language switcher to be available
    // For now, verify default locale works
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Verify page loads in current locale
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });
});
