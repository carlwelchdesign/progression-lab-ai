import { expect, type Page } from '@playwright/test';

export default class SecuritySettingsPage {
  constructor(private readonly page: Page) {}

  private async installWebAuthnMock() {
    await this.page.evaluate(() => {
      window.confirm = () => true;

      const encoder = new TextEncoder();
      const credential = {
        id: 'mock-credential-id',
        rawId: Uint8Array.from([1, 2, 3, 4]).buffer,
        response: {
          clientDataJSON: encoder.encode(
            JSON.stringify({
              type: 'webauthn.create',
              challenge: 'mock-challenge',
              origin: window.location.origin,
              crossOrigin: false,
            }),
          ).buffer,
          attestationObject: Uint8Array.from([5, 6, 7, 8]).buffer,
          getTransports: () => ['internal'],
        },
        type: 'public-key',
        authenticatorAttachment: 'cross-platform',
        getClientExtensionResults: () => ({}),
      };

      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: {
          ...navigator.credentials,
          create: async () => credential,
        },
      });
    });
  }

  async goto() {
    await this.page.goto('/account');
    await this.page.evaluate(() => {
      window.confirm = () => true;
    });
    await expect(
      this.page.getByRole('heading', { name: /Security Keys|Security Key|Hardware Security Key/i }),
    ).toBeVisible({ timeout: 15000 });
  }

  async openSecurityKeySection() {
    // Look for the Security Key section and click to expand if needed
    const section = this.page.getByRole('heading', {
      name: /Security Key|Security Keys|Hardware Security Key/i,
    });
    await expect(section).toBeVisible();
    return section;
  }

  async startSecurityKeyEnrollment() {
    await this.installWebAuthnMock();

    const addButton = this.page.getByRole('button', { name: /add security key/i });
    await expect(addButton).toBeVisible({ timeout: 10000 });
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
    return this.page.locator('li[role="listitem"], li.MuiListItem-root');
  }

  async removeSecurityKey(name: string) {
    const keyItem = this.page.locator(`text=${name}`).first();
    await expect(keyItem).toBeVisible({ timeout: 10000 });
    const deleteButton = keyItem
      .locator('xpath=ancestor::li[1]')
      .getByRole('button', { name: /remove security key|remove key|delete|remove/i });

    await deleteButton.click();

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
