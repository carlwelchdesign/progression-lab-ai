import { PublicKeyCredentialRequestOptionsJSON, PublicKeyCredentialCreationOptionsJSON, AuthenticatorTransportFuture, RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';

declare const WebAuthnCoreErrorCode: {
    readonly CONFIG_INVALID: "CONFIG_INVALID";
    readonly NO_ACTIVE_CREDENTIALS: "NO_ACTIVE_CREDENTIALS";
    readonly CHALLENGE_NOT_FOUND_OR_EXPIRED: "CHALLENGE_NOT_FOUND_OR_EXPIRED";
    readonly REGISTRATION_VERIFICATION_FAILED: "REGISTRATION_VERIFICATION_FAILED";
    readonly AUTHENTICATION_VERIFICATION_FAILED: "AUTHENTICATION_VERIFICATION_FAILED";
    readonly CREDENTIAL_ALREADY_BOUND_TO_ANOTHER_USER: "CREDENTIAL_ALREADY_BOUND_TO_ANOTHER_USER";
    readonly CREDENTIAL_NOT_FOUND_FOR_USER: "CREDENTIAL_NOT_FOUND_FOR_USER";
    readonly COUNTER_OUT_OF_RANGE: "COUNTER_OUT_OF_RANGE";
};
type WebAuthnCoreErrorCode = (typeof WebAuthnCoreErrorCode)[keyof typeof WebAuthnCoreErrorCode];
declare class WebAuthnCoreError extends Error {
    readonly code: WebAuthnCoreErrorCode;
    constructor(code: WebAuthnCoreErrorCode, message: string, options?: {
        cause?: unknown;
    });
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
type WebAuthnFlowType = string;
type WebAuthnUser = {
    id: string;
    email: string;
    name: string | null;
};
type WebAuthnConfig = {
    rpID: string;
    rpName: string;
    expectedOrigin: string;
};
type StoredWebAuthnCredential = {
    id: string;
    userId: string;
    credentialId: string;
    publicKeyBase64Url: string;
    counter: number;
    transports: AuthenticatorTransportFuture[];
    deviceType?: string | null;
    backedUp?: boolean | null;
    label?: string | null;
    createdAt?: Date;
    lastUsedAt?: Date | null;
    revokedAt?: Date | null;
};
type StoredWebAuthnChallenge = {
    id: string;
    userId: string;
    flowType: WebAuthnFlowType;
    challenge: string;
    metadata?: JsonValue;
    createdAt: Date;
    expiresAt: Date;
    consumedAt?: Date | null;
};
type RegistrationOptionsParams = {
    user: WebAuthnUser;
    flowType: WebAuthnFlowType;
    label?: string | null;
    metadata?: JsonValue;
    preferredAuthenticatorType?: 'securityKey' | 'localDevice' | 'remoteDevice';
};
type AuthenticationOptionsParams = {
    userId: string;
    flowType: WebAuthnFlowType;
    metadata?: JsonValue;
};
type CreateChallengeInput = {
    userId: string;
    flowType: WebAuthnFlowType;
    challenge: string;
    expiresAt: Date;
    metadata?: JsonValue;
};
type UpsertCredentialInput = {
    userId: string;
    credentialId: string;
    publicKeyBase64Url: string;
    counter: number;
    transports: AuthenticatorTransportFuture[];
    deviceType?: string | null;
    backedUp?: boolean | null;
    label?: string | null;
    revokedAt?: Date | null;
};
type UpdateCredentialUsageInput = {
    credentialRecordId: string;
    newCounter: number;
    deviceType?: string | null;
    backedUp?: boolean | null;
    lastUsedAt: Date;
};
interface WebAuthnConfigProvider {
    getConfig(): WebAuthnConfig;
}
interface ChallengeStore {
    invalidateOpenChallenges(userId: string, flowType: WebAuthnFlowType): Promise<void>;
    createChallenge(input: CreateChallengeInput): Promise<void>;
    pruneExpiredChallenges(userId?: string): Promise<void>;
    consumeLatestChallenge(userId: string, flowType: WebAuthnFlowType): Promise<StoredWebAuthnChallenge | null>;
}
interface CredentialStore {
    listActiveCredentials(userId: string): Promise<StoredWebAuthnCredential[]>;
    findCredentialByCredentialId(credentialId: string): Promise<StoredWebAuthnCredential | null>;
    findActiveCredentialForUser(userId: string, credentialId: string): Promise<StoredWebAuthnCredential | null>;
    upsertCredential(input: UpsertCredentialInput): Promise<StoredWebAuthnCredential>;
    updateCredentialUsage(input: UpdateCredentialUsageInput): Promise<StoredWebAuthnCredential>;
}
interface UserMfaStore {
    markMfaEnrolled(userId: string, at: Date): Promise<void>;
    markMfaVerified(userId: string, at: Date): Promise<void>;
}
type WebAuthnCoreDependencies = {
    configProvider: WebAuthnConfigProvider;
    challengeStore: ChallengeStore;
    credentialStore: CredentialStore;
    userMfaStore: UserMfaStore;
};
type WebAuthnCoreOptions = {
    challengeTtlMs?: number;
    registrationTimeoutMs?: number;
    authenticationTimeoutMs?: number;
};
type CreateRegistrationOptionsResult = {
    options: PublicKeyCredentialCreationOptionsJSON;
};
type CreateAuthenticationOptionsResult = {
    options: PublicKeyCredentialRequestOptionsJSON;
};
type VerifyRegistrationResult = {
    verified: true;
    credential: StoredWebAuthnCredential;
};
type VerifyAuthenticationResult = {
    verified: true;
    credential: StoredWebAuthnCredential;
};

declare class WebAuthnCoreService {
    private readonly deps;
    private readonly challengeTtlMs;
    private readonly registrationTimeoutMs;
    private readonly authenticationTimeoutMs;
    constructor(dependencies: WebAuthnCoreDependencies, options?: WebAuthnCoreOptions);
    createRegistrationOptions(params: RegistrationOptionsParams): Promise<CreateRegistrationOptionsResult>;
    createAuthenticationOptions(params: AuthenticationOptionsParams): Promise<CreateAuthenticationOptionsResult>;
    verifyRegistrationAndStoreCredential(params: {
        userId: string;
        flowType: string;
        response: RegistrationResponseJSON;
        label?: string | null;
    }): Promise<VerifyRegistrationResult>;
    verifyAuthenticationResponseForUser(params: {
        userId: string;
        flowType: string;
        response: AuthenticationResponseJSON;
    }): Promise<VerifyAuthenticationResult>;
}

declare function encodeBase64Url(value: Buffer | Uint8Array): string;
declare function decodeBase64Url(value: string): Uint8Array<ArrayBuffer>;

export { type AuthenticationOptionsParams, type ChallengeStore, type CreateAuthenticationOptionsResult, type CreateRegistrationOptionsResult, type CredentialStore, type JsonValue, type RegistrationOptionsParams, type StoredWebAuthnChallenge, type StoredWebAuthnCredential, type UpdateCredentialUsageInput, type UpsertCredentialInput, type UserMfaStore, type VerifyAuthenticationResult, type VerifyRegistrationResult, type WebAuthnConfig, type WebAuthnConfigProvider, type WebAuthnCoreDependencies, WebAuthnCoreError, WebAuthnCoreErrorCode, type WebAuthnCoreOptions, WebAuthnCoreService, type WebAuthnFlowType, type WebAuthnUser, decodeBase64Url, encodeBase64Url };
