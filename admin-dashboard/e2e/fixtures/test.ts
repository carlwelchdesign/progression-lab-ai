import { expect, test as base, type Page, type Route } from '@playwright/test';

import AdminDashboardPage from '../page-objects/admin-dashboard-page';

type MockUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'AUDITOR';
};

const adminUser: MockUser = {
  id: 'admin-user-1',
  email: 'admin@progressionlab.ai',
  role: 'ADMIN',
};

const now = '2026-03-30T00:00:00.000Z';

const progressionResponse = {
  items: [
    {
      id: 'prog-1',
      title: 'Midnight Progression',
      genre: 'Jazz',
      tags: ['noir'],
      isPublic: true,
      createdAt: now,
      updatedAt: now,
      owner: {
        id: 'owner-1',
        email: 'artist@progressionlab.ai',
        name: 'Artist One',
      },
    },
  ],
  total: 1,
};

const usersResponse = {
  items: [
    {
      id: 'user-1',
      email: 'subscriber@progressionlab.ai',
      name: 'Subscriber One',
      role: 'USER',
      resolvedPlan: 'COMPOSER',
      planOverride: null,
      subscriptionStatus: 'ACTIVE',
      billingInterval: 'MONTHLY',
      aiGenerationsUsed: 12,
      aiGenerationsLimit: 50,
      createdAt: now,
      updatedAt: now,
    },
  ],
  total: 1,
  summary: {
    totalUsers: 1,
    payingUsers: 1,
    compedUsers: 0,
    monthlyAiGenerations: 12,
  },
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

class AdminApiMocker {
  private loggedIn = false;

  constructor(private readonly page: Page) {}

  async installDefaultMocks() {
    await this.page.route('**/api/auth/me', async (route) => {
      if (!this.loggedIn) {
        await fulfillJson(route, { message: 'Unauthorized' }, 401);
        return;
      }

      await fulfillJson(route, { user: adminUser });
    });

    await this.page.route('**/api/auth/login', async (route) => {
      this.loggedIn = true;
      await fulfillJson(route, { user: adminUser });
    });

    await this.page.route('**/api/auth/logout', async (route) => {
      this.loggedIn = false;
      await fulfillJson(route, { ok: true });
    });

    await this.page.route('**/api/users**', async (route) => {
      if (!this.loggedIn) {
        await fulfillJson(route, { message: 'Unauthorized' }, 401);
        return;
      }

      await fulfillJson(route, usersResponse);
    });

    await this.page.route('**/api/progressions?**', async (route) => {
      if (!this.loggedIn) {
        await fulfillJson(route, { message: 'Unauthorized' }, 401);
        return;
      }

      await fulfillJson(route, progressionResponse);
    });
  }
}

type Fixtures = {
  api: AdminApiMocker;
  adminDashboardPage: AdminDashboardPage;
};

export const test = base.extend<Fixtures>({
  api: [
    async ({ page }, provideFixture) => {
      const api = new AdminApiMocker(page);
      await api.installDefaultMocks();
      await provideFixture(api);
    },
    { auto: true },
  ],
  adminDashboardPage: async ({ page }, provideFixture) => {
    await provideFixture(new AdminDashboardPage(page));
  },
});

export { expect };
