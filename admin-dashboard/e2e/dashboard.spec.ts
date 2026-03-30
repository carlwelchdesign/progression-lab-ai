import { test } from './fixtures/test';

test.describe('admin dashboard smoke', () => {
  test('logs in and renders core dashboard sections', async ({ adminDashboardPage }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoginVisible();

    await adminDashboardPage.signIn('admin@progressionlab.ai', 'password123');
    await adminDashboardPage.expectDashboardVisible();
  });

  test('supports logout back to login view', async ({ adminDashboardPage }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.signIn('admin@progressionlab.ai', 'password123');
    await adminDashboardPage.expectDashboardVisible();

    await adminDashboardPage.logout();
    await adminDashboardPage.expectLoginVisible();
  });
});
