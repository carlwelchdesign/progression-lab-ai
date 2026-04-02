import { WebAuthnCoreService } from '@carlwelchdesign/webauthn-core';

import {
  webAuthnChallengeStore,
  webAuthnConfigProvider,
  webAuthnCredentialStore,
  webAuthnUserMfaStore,
} from './webauthnAdapters';

export const webAuthnService = new WebAuthnCoreService(
  {
    configProvider: webAuthnConfigProvider,
    challengeStore: webAuthnChallengeStore,
    credentialStore: webAuthnCredentialStore,
    userMfaStore: webAuthnUserMfaStore,
  },
  {
    challengeTtlMs: 5 * 60 * 1000,
    registrationTimeoutMs: 60_000,
    authenticationTimeoutMs: 60_000,
  },
);
