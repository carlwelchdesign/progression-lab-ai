import { test, expect } from '@playwright/test';

test.describe('Custom musician request flow', () => {
  test('shows styles page for request flow setup', async ({ page }) => {
    await page.goto('/styles');
    await expect(page.getByText('Piano Lessons from the Legends')).toBeVisible();
  });
});
