import {
  MfaEnrollmentState,
  Prisma,
  type WebAuthnCredential as PrismaWebAuthnCredential,
  WebAuthnFlowType,
} from '@prisma/client';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type CredentialDeviceType,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from '@simplewebauthn/server';

import { prisma } from './prisma';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const REGISTRATION_TIMEOUT_MS = 60_000;
const AUTHENTICATION_TIMEOUT_MS = 60_000;

export type WebAuthnUser = {
  id: string;
  email: string;
  name: string | null;
};

export type WebAuthnConfig = {
  rpID: string;
  rpName: string;
  expectedOrigin: string;
};

export type RegistrationOptionsParams = {
  user: WebAuthnUser;
  flowType: WebAuthnFlowType;
  label?: string | null;
  metadata?: Prisma.InputJsonValue;
  preferredAuthenticatorType?: 'securityKey' | 'localDevice' | 'remoteDevice';
};

export type AuthenticationOptionsParams = {
  userId: string;
  flowType: WebAuthnFlowType;
  metadata?: Prisma.InputJsonValue;
};

function encodeBase64Url(value: Buffer | Uint8Array): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const base64 = padding ? normalized + '='.repeat(4 - padding) : normalized;
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]?.trim();
  if (value) {
    return value;
  }

  throw new Error(`Missing required WebAuthn environment variable: ${name}`);
}

function buildChallengeMetadata(
  label?: string | null,
  metadata?: Prisma.InputJsonValue,
): Prisma.InputJsonValue | undefined {
  if (label == null && metadata == null) {
    return undefined;
  }

  const base: Prisma.JsonObject = {};

  if (label != null) {
    base.label = label;
  }

  if (metadata != null) {
    base.context = metadata;
  }

  return base;
}

function readChallengeLabel(metadata: Prisma.JsonValue | null): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const value = metadata.label;
  return typeof value === 'string' ? value : null;
}

function toVerificationCredential(
  credential: PrismaWebAuthnCredential,
): WebAuthnCredential {
  const counter = Number(credential.counter);

  if (!Number.isSafeInteger(counter)) {
    throw new Error('Stored WebAuthn counter exceeds safe integer range');
  }

  return {
    id: credential.credentialId,
    publicKey: decodeBase64Url(credential.publicKey),
    counter,
    transports: credential.transports as AuthenticatorTransportFuture[],
  };
}

async function invalidateOpenChallenges(userId: string, flowType: WebAuthnFlowType): Promise<void> {
  await prisma.webAuthnChallenge.updateMany({
    where: {
      userId,
      flowType,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });
}

export function getWebAuthnConfig(): WebAuthnConfig {
  return {
    rpID: getRequiredEnvVar('WEBAUTHN_RP_ID'),
    rpName: getRequiredEnvVar('WEBAUTHN_RP_NAME'),
    expectedOrigin:
      process.env.ADMIN_WEBAUTHN_ORIGIN?.trim() || getRequiredEnvVar('WEBAUTHN_ORIGIN'),
  };
}

export async function pruneExpiredChallenges(userId?: string): Promise<void> {
  await prisma.webAuthnChallenge.deleteMany({
    where: {
      userId,
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function listActiveCredentials(userId: string): Promise<PrismaWebAuthnCredential[]> {
  return prisma.webAuthnCredential.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export async function createRegistrationOptions(
  params: RegistrationOptionsParams,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const config = getWebAuthnConfig();
  const credentials = await listActiveCredentials(params.user.id);

  const options = await generateRegistrationOptions({
    rpID: config.rpID,
    rpName: config.rpName,
    userID: new TextEncoder().encode(params.user.id),
    userName: params.user.email,
    userDisplayName: params.user.name ?? params.user.email,
    timeout: REGISTRATION_TIMEOUT_MS,
    preferredAuthenticatorType: params.preferredAuthenticatorType,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
    excludeCredentials: credentials.map((credential) => ({
      id: credential.credentialId,
      transports: credential.transports as AuthenticatorTransportFuture[],
    })),
  });

  await invalidateOpenChallenges(params.user.id, params.flowType);
  await prisma.webAuthnChallenge.create({
    data: {
      userId: params.user.id,
      flowType: params.flowType,
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      metadata: buildChallengeMetadata(params.label, params.metadata),
    },
  });

  return options;
}

export async function createAuthenticationOptions(
  params: AuthenticationOptionsParams,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const config = getWebAuthnConfig();
  const credentials = await listActiveCredentials(params.userId);

  if (credentials.length === 0) {
    throw new Error('No active WebAuthn credentials found for user');
  }

  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    timeout: AUTHENTICATION_TIMEOUT_MS,
    userVerification: 'required',
    allowCredentials: credentials.map((credential) => ({
      id: credential.credentialId,
      transports: credential.transports as AuthenticatorTransportFuture[],
    })),
  });

  await invalidateOpenChallenges(params.userId, params.flowType);
  await prisma.webAuthnChallenge.create({
    data: {
      userId: params.userId,
      flowType: params.flowType,
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      metadata: params.metadata,
    },
  });

  return options;
}

export async function consumeChallenge(userId: string, flowType: WebAuthnFlowType) {
  await pruneExpiredChallenges(userId);

  const challenge = await prisma.webAuthnChallenge.findFirst({
    where: {
      userId,
      flowType,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!challenge) {
    throw new Error('WebAuthn challenge not found or expired');
  }

  const result = await prisma.webAuthnChallenge.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new Error('WebAuthn challenge has already been used');
  }

  return challenge;
}

export async function verifyRegistrationAndStoreCredential(params: {
  userId: string;
  flowType: WebAuthnFlowType;
  response: RegistrationResponseJSON;
  label?: string | null;
}) {
  const config = getWebAuthnConfig();
  const challenge = await consumeChallenge(params.userId, params.flowType);
  const verification = await verifyRegistrationResponse({
    response: params.response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: config.expectedOrigin,
    expectedRPID: config.rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('WebAuthn registration verification failed');
  }

  const credentialId = verification.registrationInfo.credential.id;
  const existingCredential = await prisma.webAuthnCredential.findUnique({
    where: {
      credentialId,
    },
  });

  if (existingCredential && existingCredential.userId !== params.userId) {
    throw new Error('WebAuthn credential already belongs to another user');
  }

  const now = new Date();
  const label = params.label ?? readChallengeLabel(challenge.metadata);

  const credential = await prisma.webAuthnCredential.upsert({
    where: {
      credentialId,
    },
    update: {
      publicKey: encodeBase64Url(verification.registrationInfo.credential.publicKey),
      counter: BigInt(verification.registrationInfo.credential.counter),
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: verification.registrationInfo.credentialBackedUp,
      transports: params.response.response.transports ?? [],
      label,
      revokedAt: null,
    },
    create: {
      userId: params.userId,
      credentialId,
      publicKey: encodeBase64Url(verification.registrationInfo.credential.publicKey),
      counter: BigInt(verification.registrationInfo.credential.counter),
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: verification.registrationInfo.credentialBackedUp,
      transports: params.response.response.transports ?? [],
      label,
    },
  });

  await prisma.user.update({
    where: {
      id: params.userId,
    },
    data: {
      mfaEnrollmentState: MfaEnrollmentState.ACTIVE,
      mfaEnabledAt: now,
      mfaBypassUntil: null,
    },
  });

  return { verification, credential };
}

export async function verifyAuthenticationResponseForUser(params: {
  userId: string;
  flowType: WebAuthnFlowType;
  response: AuthenticationResponseJSON;
}) {
  const config = getWebAuthnConfig();
  const challenge = await consumeChallenge(params.userId, params.flowType);
  const credential = await prisma.webAuthnCredential.findFirst({
    where: {
      userId: params.userId,
      credentialId: params.response.id,
      revokedAt: null,
    },
  });

  if (!credential) {
    throw new Error('WebAuthn credential not found for user');
  }

  const verification = await verifyAuthenticationResponse({
    response: params.response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: config.expectedOrigin,
    expectedRPID: config.rpID,
    credential: toVerificationCredential(credential),
    requireUserVerification: true,
  });

  if (!verification.verified) {
    throw new Error('WebAuthn authentication verification failed');
  }

  const now = new Date();

  const updatedCredential = await prisma.webAuthnCredential.update({
    where: {
      id: credential.id,
    },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      deviceType: verification.authenticationInfo.credentialDeviceType,
      backedUp: verification.authenticationInfo.credentialBackedUp,
      lastUsedAt: now,
    },
  });

  await prisma.user.update({
    where: {
      id: params.userId,
    },
    data: {
      mfaEnrollmentState: MfaEnrollmentState.ACTIVE,
      mfaEnabledAt: now,
      lastMfaVerifiedAt: now,
      mfaBypassUntil: null,
    },
  });

  return { verification, credential: updatedCredential };
}

export function getCredentialDeviceTypeLabel(deviceType: CredentialDeviceType): string {
  return deviceType === 'singleDevice' ? 'single-device' : 'multi-device';
}
