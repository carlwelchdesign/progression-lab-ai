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
});
