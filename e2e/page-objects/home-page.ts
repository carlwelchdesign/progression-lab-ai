import { expect, type Locator, type Page } from '@playwright/test';

export default class HomePage {
  readonly page: Page;
  readonly generateIdeasButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.generateIdeasButton = page.getByRole('button', { name: 'Generate Ideas' });
  }

  async goto() {
    await this.page.goto('/');
    await expect(
      this.page.getByRole('heading', { level: 1, name: 'ProgressionLab' }),
    ).toBeVisible();
  }

  async generateIdeas() {
    await this.generateIdeasButton.click();
  }

  async expectResultNavHidden() {
    await expect(this.page.getByRole('link', { name: 'Suggestions', exact: true })).toHaveCount(0);
    await expect(this.page.getByRole('link', { name: 'Progressions', exact: true })).toHaveCount(0);
    await expect(this.page.getByRole('link', { name: 'Structure', exact: true })).toHaveCount(0);
  }

  async expectResultNavVisible() {
    await expect(this.page.getByRole('link', { name: 'Suggestions', exact: true })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Progressions', exact: true })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Structure', exact: true })).toBeVisible();
  }

  async expectResultsRendered() {
    await expect(
      this.page.getByRole('heading', { level: 2, name: 'Next chord suggestions' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', { level: 2, name: 'Progression ideas' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', { level: 2, name: 'Structure suggestions' }),
    ).toBeVisible();
    await expect(this.page.getByRole('heading', { level: 3, name: 'Am7' })).toBeVisible();
    await expect(
      this.page.getByRole('heading', { level: 3, name: 'Lifted turnaround' }),
    ).toBeVisible();
  }
}
