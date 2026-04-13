import { test, expect } from '@playwright/test';

test.describe('Seeded musician flow', () => {
  test('loads styles page', async ({ page }) => {
    await page.goto('/styles');
    await expect(page.getByText('Piano Lessons from the Legends')).toBeVisible();
  });
});
