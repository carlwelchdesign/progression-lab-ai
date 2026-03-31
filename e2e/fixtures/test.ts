import { expect, test as base, type Page, type Route } from '@playwright/test';

import HomePage from '../page-objects/home-page';
import ProgressionsPage from '../page-objects/progressions-page';
import { authenticatedUser, generatorResponse, publicProgressions } from './mock-data';
import type { ChordSuggestionResponse, Progression } from '../../lib/types';

interface PublishedMarketingContent {
  surface: string;
  locale: string;
  content: Record<string, unknown>;
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

class ApiMocker {
  constructor(private readonly page: Page) {}

  async mockLoggedOutUser() {
    await this.page.route('**/api/auth/me', async (route) => {
      await fulfillJson(route, { message: 'Unauthorized' }, 401);
    });
  }

  async mockAuthenticatedUser() {
    await this.page.route('**/api/auth/me', async (route) => {
      await fulfillJson(route, authenticatedUser);
    });
  }

  async expectLogoutWithCsrf(token: string) {
    await this.page.route('**/api/auth/logout', async (route) => {
      await expect(route.request().headers()['x-csrf-token']).toBe(token);
      await fulfillJson(route, { ok: true });
    });
  }

  async mockGeneratorSuccess(response: ChordSuggestionResponse = generatorResponse) {
    await this.page.route('**/api/chord-suggestions', async (route) => {
      await fulfillJson(route, response);
    });
  }

  async mockPublicProgressions(response: Progression[] = publicProgressions) {
    await this.page.route('**/api/shared**', async (route) => {
      await fulfillJson(route, response);
    });
  }

  async mockAdminUser() {
    await this.page.route('**/api/auth/me', async (route) => {
      await fulfillJson(route, {
        ...authenticatedUser,
        role: 'admin',
      });
    });
  }

  async mockPublishedMarketingContent(content: PublishedMarketingContent) {
    await this.page.route('**/api/marketing-content/public**', async (route) => {
      // Match the query params for surface and locale
      const searchParams = new URL(route.request().url()).searchParams;
      const requestSurface = searchParams.get('surface');
      const requestLocale = searchParams.get('locale');

      if (requestSurface === content.surface && requestLocale === content.locale) {
        await fulfillJson(route, content);
      } else {
        await fulfillJson(route, { error: 'Not found' }, 404);
      }
    });
  }
}

type Fixtures = {
  api: ApiMocker;
  homePage: HomePage;
  progressionsPage: ProgressionsPage;
};

export const test = base.extend<Fixtures>({
  api: async ({ page }, provideFixture) => {
    await provideFixture(new ApiMocker(page));
  },
  homePage: async ({ page }, provideFixture) => {
    await provideFixture(new HomePage(page));
  },
  progressionsPage: async ({ page }, provideFixture) => {
    await provideFixture(new ProgressionsPage(page));
  },
});

export { expect };
