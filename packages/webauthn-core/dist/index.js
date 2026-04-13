// src/errors.ts
var WebAuthnCoreErrorCode = {
  CONFIG_INVALID: "CONFIG_INVALID",
  NO_ACTIVE_CREDENTIALS: "NO_ACTIVE_CREDENTIALS",
  CHALLENGE_NOT_FOUND_OR_EXPIRED: "CHALLENGE_NOT_FOUND_OR_EXPIRED",
  REGISTRATION_VERIFICATION_FAILED: "REGISTRATION_VERIFICATION_FAILED",
  AUTHENTICATION_VERIFICATION_FAILED: "AUTHENTICATION_VERIFICATION_FAILED",
  CREDENTIAL_ALREADY_BOUND_TO_ANOTHER_USER: "CREDENTIAL_ALREADY_BOUND_TO_ANOTHER_USER",
  CREDENTIAL_NOT_FOUND_FOR_USER: "CREDENTIAL_NOT_FOUND_FOR_USER",
  COUNTER_OUT_OF_RANGE: "COUNTER_OUT_OF_RANGE"
};
var WebAuthnCoreError = class extends Error {
  code;
  constructor(code, message, options) {
    super(message);
    this.name = "WebAuthnCoreError";
    this.code = code;
    if (options?.cause !== void 0) {
      this.cause = options.cause;
    }
  }
};

// src/service.ts
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";

// src/base64url.ts
function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const base64 = padding ? normalized + "=".repeat(4 - padding) : normalized;
  const buffer = Buffer.from(base64, "base64");
  const bytes = new Uint8Array(new ArrayBuffer(buffer.length));
  bytes.set(buffer);
  return bytes;
}

// src/service.ts
var DEFAULT_CHALLENGE_TTL_MS = 5 * 60 * 1e3;
var DEFAULT_REGISTRATION_TIMEOUT_MS = 6e4;
var DEFAULT_AUTHENTICATION_TIMEOUT_MS = 6e4;
function buildChallengeMetadata(label, metadata) {
  if (label == null && metadata == null) {
    return void 0;
  }
  return {
    ...label != null ? { label } : {},
    ...metadata != null ? { context: metadata } : {}
  };
}
function readChallengeLabel(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = metadata.label;
  return typeof value === "string" ? value : null;
}
function toVerificationCredential(credential) {
  if (!Number.isSafeInteger(credential.counter) || credential.counter < 0) {
    throw new WebAuthnCoreError(
      WebAuthnCoreErrorCode.COUNTER_OUT_OF_RANGE,
      "Stored WebAuthn counter exceeds safe integer range"
    );
  }
  return {
    id: credential.credentialId,
    publicKey: decodeBase64Url(credential.publicKeyBase64Url),
    counter: credential.counter,
    transports: credential.transports
  };
}
var WebAuthnCoreService = class {
  deps;
  challengeTtlMs;
  registrationTimeoutMs;
  authenticationTimeoutMs;
  constructor(dependencies, options) {
    this.deps = dependencies;
    this.challengeTtlMs = options?.challengeTtlMs ?? DEFAULT_CHALLENGE_TTL_MS;
    this.registrationTimeoutMs = options?.registrationTimeoutMs ?? DEFAULT_REGISTRATION_TIMEOUT_MS;
    this.authenticationTimeoutMs = options?.authenticationTimeoutMs ?? DEFAULT_AUTHENTICATION_TIMEOUT_MS;
  }
  async createRegistrationOptions(params) {
    const config = this.deps.configProvider.getConfig();
    const credentials = await this.deps.credentialStore.listActiveCredentials(params.user.id);
    const options = await generateRegistrationOptions({
      rpID: config.rpID,
      rpName: config.rpName,
      userID: new TextEncoder().encode(params.user.id),
      userName: params.user.email,
      userDisplayName: params.user.name ?? params.user.email,
      timeout: this.registrationTimeoutMs,
      preferredAuthenticatorType: params.preferredAuthenticatorType,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required"
      },
      excludeCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports: credential.transports
      }))
    });
    await this.deps.challengeStore.invalidateOpenChallenges(params.user.id, params.flowType);
    await this.deps.challengeStore.createChallenge({
      userId: params.user.id,
      flowType: params.flowType,
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + this.challengeTtlMs),
      metadata: buildChallengeMetadata(params.label, params.metadata)
    });
    return { options };
  }
  async createAuthenticationOptions(params) {
    const config = this.deps.configProvider.getConfig();
    const credentials = await this.deps.credentialStore.listActiveCredentials(params.userId);
    if (credentials.length === 0) {
      throw new WebAuthnCoreError(
        WebAuthnCoreErrorCode.NO_ACTIVE_CREDENTIALS,
        "No active WebAuthn credentials found for user"
      );
    }
    const options = await generateAuthenticationOptions({
      rpID: config.rpID,
      timeout: this.authenticationTimeoutMs,
      userVerification: "required",
      allowCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports: credential.transports
      }))
    });
    await this.deps.challengeStore.invalidateOpenChallenges(params.userId, params.flowType);
    await this.deps.challengeStore.createChallenge({
      userId: params.userId,
      flowType: params.flowType,
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + this.challengeTtlMs),
      metadata: params.metadata
    });
    return { options };
  }
  async verifyRegistrationAndStoreCredential(params) {
    const config = this.deps.configProvider.getConfig();
    const challenge = await this.deps.challengeStore.consumeLatestChallenge(
      params.userId,
      params.flowType
    );
    if (!challenge) {
      throw new WebAuthnCoreError(
        WebAuthnCoreErrorCode.CHALLENGE_NOT_FOUND_OR_EXPIRED,
        "WebAuthn challenge not found or expired"
      );
    }
    const verification = await verifyRegistrationResponse({
      response: params.response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: config.expectedOrigin,
      expectedRPID: config.rpID,
      requireUserVerification: true
    });
    if (!verification.verified || !verification.registrationInfo) {
      throw new WebAuthnCoreError(
        WebAuthnCoreErrorCode.REGISTRATION_VERIFICATION_FAILED,
        "WebAuthn registration verification failed"
      );
    }
    const credentialId = verification.registrationInfo.credential.id;
    const existingCredential = await this.deps.credentialStore.findCredentialByCredentialId(credentialId);
    if (existingCredential && existingCredential.userId !== params.userId) {
      throw new WebAuthnCoreError(
        WebAuthnCoreErrorCode.CREDENTIAL_ALREADY_BOUND_TO_ANOTHER_USER,
        "WebAuthn credential already belongs to another user"
      );
    }
    const now = /* @__PURE__ */ new Date();
    const label = params.label ?? readChallengeLabel(challenge.metadata);
    const credential = await this.deps.credentialStore.upsertCredential({
      userId: params.userId,
      credentialId,
      publicKeyBase64Url: encodeBase64Url(verification.registrationInfo.credential.publicKey),
      counter: verification.registrationInfo.credential.counter,
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: verification.registrationInfo.credentialBackedUp,
      transports: params.response.response.transports ?? [],
      label,
      revokedAt: null
    });
    await this.deps.userMfaStore.markMfaEnrolled(params.userId, now);
    return { verified: true, credential };
  }
  async verifyAuthenticationResponseForUser(params) {
    const config = this.deps.configProvider.getConfig();
    const challenge = await this.deps.challengeStore.consumeLatestChallenge(
      params.userId,
      params.flowType
    );
    if (!challenge) {
      throw new WebAuthnCoreError(
        WebAuthnCoreErrorCode.CHALLENGE_NOT_FOUND_OR_EXPIRED,
        "WebAuthn challenge not found or expired"
      );
    }
    const credential = await this.deps.credentialStore.findActiveCredentialForUser(
      params.userId,
      params.response.id
    );
    if (!credential) {
      throw new WebAuthnCoreError(
        WebAuthnCoreErrorCode.CREDENTIAL_NOT_FOUND_FOR_USER,
        "WebAuthn credential not found for user"
      );
    }
    const verification = await verifyAuthenticationResponse({
      response: params.response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: config.expectedOrigin,
      expectedRPID: config.rpID,
      credential: toVerificationCredential(credential),
      requireUserVerification: true
    });
    if (!verification.verified) {
      throw new WebAuthnCoreError(
        WebAuthnCoreErrorCode.AUTHENTICATION_VERIFICATION_FAILED,
        "WebAuthn authentication verification failed"
      );
    }
    const now = /* @__PURE__ */ new Date();
    const updatedCredential = await this.deps.credentialStore.updateCredentialUsage({
      credentialRecordId: credential.id,
      newCounter: verification.authenticationInfo.newCounter,
      deviceType: verification.authenticationInfo.credentialDeviceType,
      backedUp: verification.authenticationInfo.credentialBackedUp,
      lastUsedAt: now
    });
    await this.deps.userMfaStore.markMfaVerified(params.userId, now);
    return { verified: true, credential: updatedCredential };
  }
};
export {
  WebAuthnCoreError,
  WebAuthnCoreErrorCode,
  WebAuthnCoreService,
  decodeBase64Url,
  encodeBase64Url
};
