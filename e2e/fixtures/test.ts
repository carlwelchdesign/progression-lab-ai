import { expect, test as base, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

import { createSessionToken } from '../../lib/auth';
import HomePage from '../page-objects/home-page';
import ProgressionsPage from '../page-objects/progressions-page';
import { authenticatedUser, generatorResponse, publicProgressions } from './mock-data';
import type { ChordSuggestionResponse, Progression } from '../../lib/types';

const APP_ORIGIN = 'http://127.0.0.1:3000';
const AUTH_CACHE_KEY = 'auth_cache_v1';
const CSRF_TOKEN = 'a'.repeat(64);

function ensureAuthSecretLoaded() {
  if (process.env.AUTH_SECRET) {
    return;
  }

  try {
    const envLocal = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    const match = envLocal.match(/^AUTH_SECRET=(.*)$/m);
    if (!match) {
      return;
    }

    process.env.AUTH_SECRET = match[1].trim().replace(/^"|"$/g, '');
  } catch {
    // Keep default test secret fallback when .env.local is unavailable.
  }
}

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
    const user = authenticatedUser.user;
    ensureAuthSecretLoaded();
    const sessionToken = createSessionToken(user.id, user.email, user.role);

    await this.page.context().addCookies([
      {
        name: 'progressionlab_session',
        value: sessionToken,
        url: APP_ORIGIN,
        sameSite: 'Lax',
      },
      {
        name: 'csrf-token',
        value: CSRF_TOKEN,
        url: APP_ORIGIN,
        sameSite: 'Lax',
      },
    ]);

    await this.page.addInitScript(
      ({ cacheKey, cachedUser }) => {
        window.sessionStorage.setItem(cacheKey, JSON.stringify({ user: cachedUser }));
      },
      { cacheKey: AUTH_CACHE_KEY, cachedUser: user },
    );

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
      const searchParams = new URL(route.request().url()).searchParams;
      const requestKey = searchParams.get('contentKey');
      const requestLocale = searchParams.get('locale');

      if (requestKey === content.surface && requestLocale === content.locale) {
        // Return the shape the client expects: { item: PublicMarketingContentResult }
        await fulfillJson(route, {
          item: {
            contentKey: content.surface,
            requestedLocale: content.locale,
            resolvedLocale: content.locale,
            versionId: 'mock-version-id',
            versionNumber: 1,
            content: content.content,
            updatedAt: new Date().toISOString(),
          },
        });
      } else {
        // Return null item (no published content) — client handles this as "no CMS content"
        await fulfillJson(route, { item: null }, 404);
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
