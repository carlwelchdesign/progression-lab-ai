import { expect, type Page } from '@playwright/test';

export default class SecuritySettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/account');
    await this.page.waitForLoadState('networkidle');
  }

  async openSecurityKeySection() {
    // Look for the Security Key section and click to expand if needed
    const section = this.page.getByRole('heading', { name: /Security Key|Hardware Security Key/i });
    await expect(section).toBeVisible();
    return section;
  }

  async startSecurityKeyEnrollment() {
    const addButton = this.page.getByRole('button', {
      name: /Add|Enroll|Register.*Security Key|Security Key/i,
    });
    await addButton.click();

    // Wait for modal or enrollment flow to start
    await this.page
      .waitForSelector('[data-testid*="security-key"], [aria-labelledby*="security-key"]', {
        timeout: 5000,
      })
      .catch(() => {
        // Modal might not have specific test id, so just wait for visible changes
        return this.page.waitForTimeout(500);
      });
  }

  async completeSecurityKeyRegistration(credentialName = 'My Security Key') {
    // Wait for the registration options request
    const registrationRequest = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/webauthn/register/options') && response.status() === 200,
    );

    // The UI should trigger the WebAuthn registration after getting options
    await registrationRequest;

    // Simulate the browser's WebAuthn credential creation
    // For E2E testing, we'll mock the platform authenticator
    const credentialName_ = credentialName;
    await this.page.evaluate(
      async ({ name }) => {
        // Mock platform authenticator for testing
        if ('credentials' in navigator && 'create' in navigator.credentials) {
          const mockCredential = {
            id: new ArrayBuffer(64),
            rawId: new ArrayBuffer(64),
            response: {
              clientDataJSON: new TextEncoder().encode(
                JSON.stringify({
                  type: 'webauthn.create',
                  challenge: 'mock-challenge',
                  origin: window.location.origin,
                  crossOrigin: false,
                }),
              ),
              attestationObject: new ArrayBuffer(256),
              getTransports: () => ['internal'],
            },
            type: 'public-key',
          };

          // Store for the verification endpoint to find
          window.sessionStorage.setItem(
            'mock-webauthn-credential',
            JSON.stringify({
              name,
              id: Array.from(new Uint8Array(mockCredential.id)),
            }),
          );
        }
      },
      { name: credentialName_ },
    );

    // Wait for the verification request
    const verifyRequest = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/webauthn/register/verify') && response.status() === 200,
    );

    // Click the confirm button if needed
    const confirmButton = this.page
      .getByRole('button', { name: /Confirm|Complete|Finish|Submit/i })
      .first();
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    await verifyRequest;

    // Wait for success notification
    const successMessage = this.page.getByText(/registered|enrolled|added/, { exact: false });
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  }

  async listSecurityKeys() {
    const credentialsList = this.page
      .locator('[data-testid*="security-key-list"], [role="list"]')
      .filter({
        has: this.page.locator('text=/YubiKey|Security Key/i'),
      });
    return credentialsList.locator('li, [role="listitem"]');
  }

  async removeSecurityKey(name: string) {
    const keyItem = this.page.locator(`text=${name}`).first();
    const deleteButton = keyItem
      .locator('..')
      .getByRole('button', { name: /Delete|Remove|Revoke/i });

    await deleteButton.click();

    // Confirm deletion if dialog appears
    const confirmDelete = this.page.getByRole('button', { name: /Confirm|Delete|Remove/i }).filter({
      has: this.page.locator('text=/sure|confirm/i'),
    });
    if (await confirmDelete.isVisible().catch(() => false)) {
      await confirmDelete.click();
    }

    // Wait for removal in UI
    await expect(keyItem).not.toBeVisible({ timeout: 5000 });
  }

  async authenticateWithSecurityKey() {
    // This would be tested during login flow, but included here for completeness
    // Simulate WebAuthn authentication
    await this.page.evaluate(async () => {
      if ('credentials' in navigator && 'get' in navigator.credentials) {
        // Mock authenticator response
        window.sessionStorage.setItem(
          'mock-webauthn-auth',
          JSON.stringify({
            response: 'authenticated',
          }),
        );
      }
    });
  }
}
