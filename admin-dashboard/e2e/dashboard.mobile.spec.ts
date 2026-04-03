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

  test('navigates sections through the mobile drawer menu', async ({
    adminDashboardPage,
    page,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.signIn('admin@progressionlab.ai', 'password123');
    await adminDashboardPage.expectDashboardVisible();

    await expect(adminDashboardPage.mobileNavTrigger()).toBeVisible();
    await expect(adminDashboardPage.mobileNavTrigger()).toBeEnabled();

    await adminDashboardPage.openMobileNavigation();
    await adminDashboardPage.selectMobileSection('Progressions');

    await expect(page.getByLabel('Search title, owner, or genre')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Sections' })).not.toBeVisible();

    await adminDashboardPage.openMobileNavigation();
    await adminDashboardPage.selectMobileSection('Audit Log');

    await expect(page.getByRole('heading', { name: 'Tier Configuration Audit Log' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Sections' })).not.toBeVisible();
  });
});
