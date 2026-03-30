import { expect, type Page } from '@playwright/test';

export default class AdminDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async expectLoginVisible() {
    await expect(this.page.getByRole('heading', { name: 'ProgressionLab Admin' })).toBeVisible();
    await expect(this.page.getByLabel('Email')).toBeVisible();
    await expect(this.page.getByLabel('Password')).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  }

  async signIn(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  async expectDashboardVisible() {
    await expect(this.page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(this.page.getByText('Subscribers and access')).toBeVisible();
    await expect(this.page.getByText('subscriber@progressionlab.ai')).toBeVisible();
  }

  async logout() {
    await this.page.getByRole('button', { name: 'Logout' }).click();
  }
}
