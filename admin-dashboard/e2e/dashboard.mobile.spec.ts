import { expect } from '@playwright/test';

import { test } from './fixtures/test';

test.describe('admin dashboard mobile smoke', () => {
  test('renders login and dashboard content on mobile viewport', async ({
    adminDashboardPage,
    page,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoginVisible();

    await adminDashboardPage.signIn('admin@progressionlab.ai', 'password123');
    await adminDashboardPage.expectDashboardVisible();

    await expect(page.getByLabel('Search email or name')).toBeVisible();
    await expect(page.getByText('subscriber@progressionlab.ai')).toBeVisible();
  });
});
