import { expect } from '@playwright/test';

import { test } from './fixtures/test';

test.describe('generator flow', () => {
  test('reveals result navigation after successful generation', async ({ api, homePage, page }) => {
    await api.mockLoggedOutUser();
    await api.mockGeneratorSuccess();

    await homePage.goto();
    await homePage.expectResultNavHidden();

    const chordSuggestionsResponse = page.waitForResponse('**/api/chord-suggestions');
    await homePage.generateIdeas();
    await chordSuggestionsResponse;

    await homePage.expectResultsRendered();
    await homePage.expectResultNavVisible();
  });

  test.describe('mobile composer interactions', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    test('long-presses a pad and places it on the timeline', async ({ api, homePage, page }) => {
      await api.mockLoggedOutUser();
      await api.mockGeneratorSuccess();

      await homePage.goto();

      const chordSuggestionsResponse = page.waitForResponse('**/api/chord-suggestions');
      await homePage.generateIdeas();
      await chordSuggestionsResponse;

      await page.getByRole('button', { name: 'Pads' }).click();
      const composerDialog = page.getByRole('dialog', { name: /Composer/ });
      await expect(
        composerDialog.getByRole('heading', { name: 'Composer', exact: true }),
      ).toBeVisible();

      const padButton = composerDialog.getByRole('button', { name: 'Am7' }).first();
      await padButton.evaluate((element) => {
        element.dispatchEvent(
          new PointerEvent('pointerdown', {
            pointerType: 'touch',
            pointerId: 17,
            clientX: 96,
            clientY: 96,
            bubbles: true,
          }),
        );
      });

      await page.waitForTimeout(750);

      const lane = composerDialog.getByLabel('Chord timeline lane');
      await lane.click({ position: { x: 210, y: 40 } });

      await expect(composerDialog.getByText(/1 event/i)).toBeVisible();
    });
  });
});
