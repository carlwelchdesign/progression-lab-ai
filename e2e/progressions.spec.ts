import { expect } from '@playwright/test';

import { test } from './fixtures/test';

test.describe('public progressions', () => {
  test('loads public cards and opens auth modal when unauthenticated users request personal progressions', async ({
    api,
    progressionsPage,
    page,
  }) => {
    await api.mockLoggedOutUser();
    await api.mockPublicProgressions();

    await progressionsPage.gotoPublic();
    await progressionsPage.expectCardVisible('Skyline Drive');

    await progressionsPage.openMineView();

    await expect(page).toHaveURL(/\/progressions\?view=public/);
    await expect(page.getByRole('dialog', { name: 'Account' })).toBeVisible();
    await expect(
      page.getByText('Create an account to access your personal saved progressions.'),
    ).toBeVisible();
  });
});
