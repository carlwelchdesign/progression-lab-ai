import { expect, type Page } from '@playwright/test';

export default class ProgressionsPage {
  constructor(private readonly page: Page) {}

  async gotoPublic() {
    await this.page.goto('/progressions?view=public');
    await expect(
      this.page.getByRole('heading', { level: 1, name: 'Public Progressions' }),
    ).toBeVisible();
  }

  async expectCardVisible(title: string) {
    await expect(this.page.getByRole('heading', { level: 6, name: title })).toBeVisible();
  }

  async openMineView() {
    await this.page.getByRole('button', { name: 'My Progressions' }).click();
  }
}
