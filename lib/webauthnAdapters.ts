import { MfaEnrollmentState, Prisma } from '@prisma/client';
import type { WebAuthnCredential as PrismaWebAuthnCredential } from '@prisma/client';
import type {
  ChallengeStore,
  CredentialStore,
  JsonValue,
  StoredWebAuthnChallenge,
  StoredWebAuthnCredential,
  UpdateCredentialUsageInput,
  UpsertCredentialInput,
  UserMfaStore,
  WebAuthnConfigProvider,
  WebAuthnFlowType,
} from '@carlwelchdesign/webauthn-core';

import { prisma } from './prisma';

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  throw new Error(`Missing required WebAuthn environment variable: ${name}`);
}

function toPrismaFlowType(flowType: WebAuthnFlowType) {
  return flowType as import('@prisma/client').WebAuthnFlowType;
}

function toStoredCredential(c: PrismaWebAuthnCredential): StoredWebAuthnCredential {
  return {
    id: c.id,
    userId: c.userId,
    credentialId: c.credentialId,
    publicKeyBase64Url: c.publicKey,
    counter: Number(c.counter),
    transports: c.transports as import('@simplewebauthn/server').AuthenticatorTransportFuture[],
    deviceType: c.deviceType,
    backedUp: c.backedUp,
    label: c.label,
    createdAt: c.createdAt,
    lastUsedAt: c.lastUsedAt,
    revokedAt: c.revokedAt,
  };
}

export const webAuthnConfigProvider: WebAuthnConfigProvider = {
  getConfig() {
    return {
      rpID: getRequiredEnvVar('WEBAUTHN_RP_ID'),
      rpName: getRequiredEnvVar('WEBAUTHN_RP_NAME'),
      expectedOrigin: getRequiredEnvVar('WEBAUTHN_ORIGIN'),
    };
  },
};

export const webAuthnChallengeStore: ChallengeStore = {
  async invalidateOpenChallenges(userId, flowType) {
    await prisma.webAuthnChallenge.updateMany({
      where: { userId, flowType: toPrismaFlowType(flowType), consumedAt: null },
      data: { consumedAt: new Date() },
    });
  },

  async createChallenge(input) {
    await prisma.webAuthnChallenge.create({
      data: {
        userId: input.userId,
        flowType: toPrismaFlowType(input.flowType),
        challenge: input.challenge,
        expiresAt: input.expiresAt,
        metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  },

  async pruneExpiredChallenges(userId) {
    await prisma.webAuthnChallenge.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  },

  async consumeLatestChallenge(userId, flowType): Promise<StoredWebAuthnChallenge | null> {
    await prisma.webAuthnChallenge.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    const challenge = await prisma.webAuthnChallenge.findFirst({
      where: {
        userId,
        flowType: toPrismaFlowType(flowType),
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) return null;

    const result = await prisma.webAuthnChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    if (result.count !== 1) return null;

    return {
      id: challenge.id,
      userId: challenge.userId,
      flowType: challenge.flowType as WebAuthnFlowType,
      challenge: challenge.challenge,
      metadata: challenge.metadata as JsonValue,
      createdAt: challenge.createdAt,
      expiresAt: challenge.expiresAt,
      consumedAt: challenge.consumedAt,
    };
  },
};

export const webAuthnCredentialStore: CredentialStore = {
  async listActiveCredentials(userId) {
    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return credentials.map(toStoredCredential);
  },

  async findCredentialByCredentialId(credentialId) {
    const c = await prisma.webAuthnCredential.findUnique({ where: { credentialId } });
    return c ? toStoredCredential(c) : null;
  },

  async findActiveCredentialForUser(userId, credentialId) {
    const c = await prisma.webAuthnCredential.findFirst({
      where: { userId, credentialId, revokedAt: null },
    });
    return c ? toStoredCredential(c) : null;
  },

  async upsertCredential(input: UpsertCredentialInput) {
    const c = await prisma.webAuthnCredential.upsert({
      where: { credentialId: input.credentialId },
      update: {
        publicKey: input.publicKeyBase64Url,
        counter: BigInt(input.counter),
        deviceType: input.deviceType,
        backedUp: input.backedUp,
        transports: input.transports,
        label: input.label,
        revokedAt: input.revokedAt,
      },
      create: {
        userId: input.userId,
        credentialId: input.credentialId,
        publicKey: input.publicKeyBase64Url,
        counter: BigInt(input.counter),
        deviceType: input.deviceType,
        backedUp: input.backedUp,
        transports: input.transports,
        label: input.label,
      },
    });
    return toStoredCredential(c);
  },

  async updateCredentialUsage(input: UpdateCredentialUsageInput) {
    const c = await prisma.webAuthnCredential.update({
      where: { id: input.credentialRecordId },
      data: {
        counter: BigInt(input.newCounter),
        deviceType: input.deviceType,
        backedUp: input.backedUp,
        lastUsedAt: input.lastUsedAt,
      },
    });
    return toStoredCredential(c);
  },
};

export const webAuthnUserMfaStore: UserMfaStore = {
  async markMfaEnrolled(userId, at) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnrollmentState: MfaEnrollmentState.ACTIVE,
        mfaEnabledAt: at,
        mfaBypassUntil: null,
      },
    });
  },

  async markMfaVerified(userId, at) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnrollmentState: MfaEnrollmentState.ACTIVE,
        mfaEnabledAt: at,
        lastMfaVerifiedAt: at,
        mfaBypassUntil: null,
      },
    });
  },
};
