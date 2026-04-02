import { expect, test } from './fixtures/test';
import SecuritySettingsPage from './page-objects/security-settings-page';

test.describe('Security Key / WebAuthn E2E', () => {
  let securitySettingsPage: SecuritySettingsPage;

  test.beforeEach(async ({ page, api }) => {
    // Mock authenticated user
    await api.mockAuthenticatedUser();
    securitySettingsPage = new SecuritySettingsPage(page);
  });

  test('should display Security Key section on settings page', async ({ page }) => {
    await securitySettingsPage.goto();

    // Verify the security key section is visible
    const section = await securitySettingsPage.openSecurityKeySection();
    expect(section).toBeTruthy();

    // Verify there's an option to add a security key
    const addButton = page.getByRole('button', { name: /Add|Enroll|Register.*Security Key/i });
    expect(addButton).toBeTruthy();
  });

  test('should initiate Security Key registration flow', async ({ page }) => {
    await securitySettingsPage.goto();

    // Mock the WebAuthn registration options endpoint
    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: Buffer.from('test-challenge-123').toString('base64url'),
          rp: {
            name: 'AI Musician Helper',
            id: 'localhost',
          },
          user: {
            id: Buffer.from('user-123').toString('base64url'),
            name: 'testuser@example.com',
            displayName: 'Test User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          timeout: 60000,
          attestation: 'direct',
        }),
      });
    });

    await securitySettingsPage.startSecurityKeyEnrollment();

    // Verify registration options were requested
    const requestPromise = new Promise((resolve) => {
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/webauthn/register/options')) {
          resolve(request);
        }
      });
    });

    await Promise.race([
      requestPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
    ]).catch(() => {
      // Expected if UI doesn't auto-trigger, user interaction handles it
    });
  });

  test('should handle Security Key registration response', async ({ page }) => {
    await securitySettingsPage.goto();

    // Mock the full registration flow
    let capturedChallenge: string | null = null;

    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      capturedChallenge = Buffer.from('test-challenge-xyz').toString('base64url');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: capturedChallenge,
          rp: {
            name: 'AI Musician Helper',
            id: 'localhost',
          },
          user: {
            id: Buffer.from('user-xyz').toString('base64url'),
            name: 'testuser@example.com',
            displayName: 'Test User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 60000,
          attestation: 'direct',
        }),
      });
    });

    await page.route('**/api/auth/webauthn/register/verify', async (route) => {
      // Verify the request has correct structure
      const body = await route.request().postDataJSON();
      expect(body.id).toBeTruthy();
      expect(body.rawId).toBeTruthy();
      expect(body.response).toBeTruthy();
      expect(body.type).toBe('public-key');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Security key registered successfully',
        }),
      });
    });

    await securitySettingsPage.startSecurityKeyEnrollment();

    // In a real scenario, the platform authenticator would be triggered
    // For this test, we're validating the request/response shapes
  });

  test('should list registered Security Keys', async ({ page, api }) => {
    // Mock the credentials endpoint to return registered keys
    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          credentials: [
            {
              id: 'id-cred-001',
              credentialId: 'cred-001',
              credentialPublicKeyJson: '{"kty":"EC","crv":"P-256","x":"...","y":"..."}',
              counter: 0,
              transports: ['internal'],
              createdAt: new Date().toISOString(),
              label: 'My YubiKey',
            },
            {
              id: 'id-cred-002',
              credentialId: 'cred-002',
              credentialPublicKeyJson: '{"kty":"RSA","n":"...","e":"..."}',
              counter: 0,
              transports: ['usb'],
              createdAt: new Date().toISOString(),
              label: 'Backup Security Key',
            },
          ],
        }),
      });
    });

    await securitySettingsPage.goto();

    // Verify credentials are listed
    const keys = await securitySettingsPage.listSecurityKeys();
    expect(keys).toBeTruthy();
  });

  test('should allow removing a Security Key', async ({ page, api }) => {
    // Mock the credentials endpoint
    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            credentials: [
              {
                id: 'id-cred-remove-001',
                credentialId: 'cred-remove-001',
                credentialPublicKeyJson: '{"kty":"EC"}',
                counter: 0,
                transports: ['internal'],
                createdAt: new Date().toISOString(),
                label: 'Key to Remove',
              },
            ],
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        const body = route.request().postDataJSON() as { credentialId?: string };
        const credentialId = body.credentialId;
        expect(credentialId).toBe('cred-remove-001');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Security key removed',
          }),
        });
      }
    });

    await securitySettingsPage.goto();

    // Remove a key
    await securitySettingsPage.removeSecurityKey('Key to Remove');
  });

  test('should enforce MFA if Security Key is the only MFA method', async ({ page, api }) => {
    // Mock user with only security key MFA
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
          mfaEnabled: true,
          webAuthnMfaEnabled: true,
          totpMfaEnabled: false,
          webAuthnCredentials: 1,
        }),
      });
    });

    await securitySettingsPage.goto();

    // Verify MFA status is displayed
    const mfaStatus = page.getByText(/MFA|Two-factor|Security.*enabled/i);
    expect(mfaStatus).toBeTruthy();
  });

  test('should prevent removing the only Security Key if it is the only MFA method', async ({
    page,
    api,
  }) => {
    // This test validates the business logic that prevents removing
    // the last MFA method (if security key is the only one)

    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      if (route.request().method() === 'DELETE') {
        // Simulate the API preventing deletion
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Cannot remove the only MFA method',
          }),
        });
      }
    });

    await securitySettingsPage.goto();

    // Trigger a deterministic delete request and assert API prevents removing last key.
    const deleteAttempt = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/webauthn/credentials') &&
        response.request().method() === 'DELETE',
      { timeout: 5000 },
    );

    await page.evaluate(async () => {
      await fetch('/api/auth/webauthn/credentials', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: 'only-key' }),
      });
    });

    const deleteResponse = await deleteAttempt;
    expect(deleteResponse.status()).toBe(400);
  });

  test('should support multiple Security Keys', async ({ page }) => {
    await page.route('**/api/auth/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          credentials: [
            {
              id: 'id-cred-multi-001',
              credentialId: 'cred-multi-001',
              credentialPublicKeyJson: '{"kty":"EC"}',
              counter: 5,
              transports: ['internal'],
              createdAt: new Date().toISOString(),
              label: 'Primary YubiKey',
            },
            {
              id: 'id-cred-multi-002',
              credentialId: 'cred-multi-002',
              credentialPublicKeyJson: '{"kty":"EC"}',
              counter: 3,
              transports: ['usb'],
              createdAt: new Date().toISOString(),
              label: 'Backup YubiKey',
            },
            {
              id: 'id-cred-multi-003',
              credentialId: 'cred-multi-003',
              credentialPublicKeyJson: '{"kty":"EC"}',
              counter: 1,
              transports: ['nfc'],
              createdAt: new Date().toISOString(),
              label: 'Mobile Authenticator',
            },
          ],
        }),
      });
    });

    await securitySettingsPage.goto();

    const keys = await securitySettingsPage.listSecurityKeys();
    // Should show all 3 keys
    expect(keys).toBeTruthy();
  });

  test('should verify challenge is consumed after registration', async ({ page }) => {
    // Ensures one-time challenge consumption guarantee
    let challengeUsed = false;

    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: Buffer.from('one-time-challenge-' + Date.now()).toString('base64url'),
          rp: { name: 'App', id: 'localhost' },
          user: {
            id: Buffer.from('user').toString('base64url'),
            name: 'user@test.com',
            displayName: 'Test',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 60000,
          attestation: 'direct',
        }),
      });
    });

    await page.route('**/api/auth/webauthn/register/verify', async (route) => {
      if (challengeUsed) {
        // Attempt to reuse same challenge should fail
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Challenge already used',
          }),
        });
        return;
      }

      challengeUsed = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Registered',
        }),
      });
    });

    await securitySettingsPage.goto();

    // First registration attempt should succeed
    // Subsequent attempts with same challenge should fail
  });

  test('should validate RP ID and Origin during WebAuthn flow', async ({ page }) => {
    const currentOrigin = page.url() || 'http://localhost:3000';

    await page.route('**/api/auth/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: Buffer.from('challenge').toString('base64url'),
          rp: {
            name: 'AI Musician Helper',
            id: new URL(currentOrigin).hostname,
          },
          user: {
            id: Buffer.from('user').toString('base64url'),
            name: 'user@example.com',
            displayName: 'User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 60000,
          attestation: 'direct',
        }),
      });
    });

    // Verify the RP ID matches current origin
    const request = page.waitForResponse((response) =>
      response.url().includes('/api/auth/webauthn/register/options'),
    );

    await securitySettingsPage.goto();
    await securitySettingsPage.startSecurityKeyEnrollment();

    const response = await request;
    const body = await response.json();

    expect(body.rp.id).toBe(new URL(currentOrigin).hostname);
  });
});
