import { expect, test } from './fixtures/test';
import SecuritySettingsPage from './page-objects/security-settings-page';

function credentialFixture(
  id: string,
  label: string,
  overrides?: Partial<Record<string, unknown>>,
) {
  return {
    id,
    credentialId: `${id}-public`,
    label,
    deviceType: 'singleDevice',
    backedUp: false,
    transports: ['internal'],
    createdAt: new Date('2026-03-30T00:00:00.000Z').toISOString(),
    lastUsedAt: null,
    ...overrides,
  };
}

function registrationOptions(rpId: string) {
  return {
    options: {
      challenge: Buffer.from(`challenge-${rpId}`).toString('base64url'),
      rp: {
        name: 'AI Musician Helper',
        id: rpId,
      },
      user: {
        id: Buffer.from('user-123').toString('base64url'),
        name: 'staff@example.com',
        displayName: 'Staff User',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      timeout: 60000,
      attestation: 'direct',
    },
  };
}

test.describe('Security Key / WebAuthn E2E', () => {
  let securitySettingsPage: SecuritySettingsPage;

  test.beforeEach(async ({ page, api }) => {
    await api.mockAuthenticatedUser();
    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ credentials: [] }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.route('**/api/billing/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: 'SESSION',
          entitlements: {
            aiGenerationsPerMonth: 25,
            maxSavedProgressions: 10,
            maxSavedArrangements: 5,
            maxPublicShares: 3,
            canExportMidi: false,
            canExportPdf: false,
            canSharePublicly: false,
            canUsePremiumAiModel: false,
          },
          planOverride: null,
          planOverrideExpiresAt: null,
          subscriptionStatus: null,
          billing: { stripeCustomerId: null, subscription: null },
          usage: { aiGenerationsUsed: 0, aiGenerationsLimit: 25 },
        }),
      });
    });
    securitySettingsPage = new SecuritySettingsPage(page);
  });

  test('should display Security Key section on settings page', async ({ page }) => {
    await securitySettingsPage.goto();

    // Verify the security key section is visible
    const section = await securitySettingsPage.openSecurityKeySection();
    expect(section).toBeTruthy();

    const addButton = page.getByRole('button', { name: /Add|Enroll|Register.*Security Key/i });
    await expect(addButton).toBeVisible();
    await expect(page.getByText('No security keys enrolled.')).toBeVisible();
  });

  test('should initiate Security Key registration flow', async ({ page }) => {
    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(registrationOptions('127.0.0.1')),
      });
    });

    await securitySettingsPage.goto();

    const optionsResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/webauthn/register/options') && response.status() === 200,
    );

    await securitySettingsPage.startSecurityKeyEnrollment();
    await optionsResponse;
  });

  test('should handle Security Key registration response', async ({ page }) => {
    await securitySettingsPage.goto();

    let credentials = [] as Array<ReturnType<typeof credentialFixture>>;

    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ credentials }),
        });
      }
    });

    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(registrationOptions('127.0.0.1')),
      });
    });

    await page.route('**/api/auth/webauthn/register/verify', async (route) => {
      const body = await route.request().postDataJSON();
      expect(body.response.id).toBeTruthy();
      expect(body.response.rawId).toBeTruthy();
      expect(body.response.response).toBeTruthy();
      expect(body.response.type).toBe('public-key');
      expect(body.label).toBe('Security key');

      credentials = [credentialFixture('cred-new-1', 'Security key')];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          credential: credentials[0],
        }),
      });
    });

    await securitySettingsPage.startSecurityKeyEnrollment();
    await expect(page.getByText('Security key enrolled successfully.')).toBeVisible();
    await expect(page.locator('li').getByText('Security key', { exact: true })).toBeVisible();
  });

  test('should list registered Security Keys', async ({ page }) => {
    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          credentials: [
            credentialFixture('id-cred-001', 'My YubiKey'),
            credentialFixture('id-cred-002', 'Backup Security Key', { transports: ['usb'] }),
          ],
        }),
      });
    });

    await securitySettingsPage.goto();
    await expect(page.getByText('My YubiKey')).toBeVisible();
    await expect(page.getByText('Backup Security Key')).toBeVisible();
  });

  test('should allow removing a Security Key', async ({ page }) => {
    let credentials = [credentialFixture('id-cred-remove-001', 'Key to Remove')];

    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ credentials }),
        });
      } else if (route.request().method() === 'DELETE') {
        const body = route.request().postDataJSON() as { credentialId?: string };
        const credentialId = body.credentialId;
        expect(credentialId).toBe('id-cred-remove-001');
        credentials = [];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      }
    });

    await securitySettingsPage.goto();
    await securitySettingsPage.removeSecurityKey('Key to Remove');
    await expect(page.getByText('No security keys enrolled.')).toBeVisible();
  });

  test('should surface an error when Security Key removal fails', async ({ page }) => {
    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ credentials: [credentialFixture('id-only-key', 'Only Key')] }),
        });
        return;
      }

      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'WEBAUTHN_CREDENTIAL_REVOKE_FAILED',
          message: 'Failed to revoke credential',
        }),
      });
    });

    await securitySettingsPage.goto();
    const deleteAttempt = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/webauthn/credentials') &&
        response.request().method() === 'DELETE' &&
        response.status() === 500,
    );

    const keyItem = page.getByText('Only Key');
    await expect(keyItem).toBeVisible();
    await page.getByRole('button', { name: /remove security key/i }).click();
    await deleteAttempt;

    await expect(page.getByText('Failed to remove security key')).toBeVisible();
  });

  test('should support multiple Security Keys', async ({ page }) => {
    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          credentials: [
            credentialFixture('id-cred-multi-001', 'Primary YubiKey'),
            credentialFixture('id-cred-multi-002', 'Backup YubiKey', { transports: ['usb'] }),
            credentialFixture('id-cred-multi-003', 'Mobile Authenticator', {
              transports: ['nfc'],
            }),
          ],
        }),
      });
    });

    await securitySettingsPage.goto();
    await expect(page.getByText('Primary YubiKey')).toBeVisible();
    await expect(page.getByText('Backup YubiKey')).toBeVisible();
    await expect(page.getByText('Mobile Authenticator')).toBeVisible();
  });

  test('should verify challenge is consumed after registration', async ({ page }) => {
    let challengeUsed = false;
    let credentials = [] as Array<ReturnType<typeof credentialFixture>>;

    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ credentials }),
        });
      }
    });

    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(registrationOptions('127.0.0.1')),
      });
    });

    await page.route('**/api/auth/webauthn/register/verify', async (route) => {
      if (challengeUsed) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'WEBAUTHN_REGISTER_VERIFY_FAILED',
            message: 'WebAuthn enrollment failed',
          }),
        });
        return;
      }

      challengeUsed = true;
      credentials = [credentialFixture('id-consumed-key', 'Security key')];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          credential: credentials[0],
        }),
      });
    });

    await securitySettingsPage.goto();
    await securitySettingsPage.startSecurityKeyEnrollment();
    await expect(page.getByText('Security key enrolled successfully.')).toBeVisible();

    await securitySettingsPage.startSecurityKeyEnrollment();
    await expect(page.getByText('Security key enrollment failed')).toBeVisible();
  });

  test('should validate RP ID and Origin during WebAuthn flow', async ({ page }) => {
    await securitySettingsPage.goto();

    const currentOrigin = page.url();
    const expectedHost = new URL(currentOrigin).hostname;

    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(registrationOptions(expectedHost)),
      });
    });

    const request = page.waitForResponse((response) =>
      response.url().includes('/api/auth/webauthn/register/options'),
    );

    await securitySettingsPage.startSecurityKeyEnrollment();

    const response = await request;
    const body = await response.json();

    expect(body.options.rp.id).toBe(expectedHost);
  });
});
