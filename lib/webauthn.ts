import { WebAuthnFlowType } from '@prisma/client';
import type {
  AuthenticationResponseJSON,
  CredentialDeviceType,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import {
  webAuthnChallengeStore,
  webAuthnConfigProvider,
  webAuthnCredentialStore,
} from './webauthnAdapters';
import { webAuthnService } from './webauthnService';

export type {
  WebAuthnUser,
  WebAuthnConfig,
  RegistrationOptionsParams,
  AuthenticationOptionsParams,
  StoredWebAuthnCredential as WebAuthnCredential,
} from '@carlwelchdesign/webauthn-core';

export function getWebAuthnConfig() {
  return webAuthnConfigProvider.getConfig();
}

export async function pruneExpiredChallenges(userId?: string): Promise<void> {
  await webAuthnChallengeStore.pruneExpiredChallenges(userId);
}

export async function listActiveCredentials(userId: string) {
  return webAuthnCredentialStore.listActiveCredentials(userId);
}

export async function createRegistrationOptions(
  params: Parameters<typeof webAuthnService.createRegistrationOptions>[0],
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const { options } = await webAuthnService.createRegistrationOptions(params);
  return options;
}

export async function createAuthenticationOptions(
  params: Parameters<typeof webAuthnService.createAuthenticationOptions>[0],
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { options } = await webAuthnService.createAuthenticationOptions(params);
  return options;
}

export async function verifyRegistrationAndStoreCredential(params: {
  userId: string;
  flowType: WebAuthnFlowType;
  response: RegistrationResponseJSON;
  label?: string | null;
}) {
  return webAuthnService.verifyRegistrationAndStoreCredential(params);
}

export async function verifyAuthenticationResponseForUser(params: {
  userId: string;
  flowType: WebAuthnFlowType;
  response: AuthenticationResponseJSON;
}) {
  return webAuthnService.verifyAuthenticationResponseForUser(params);
}

export function getCredentialDeviceTypeLabel(deviceType: CredentialDeviceType): string {
  return deviceType === 'singleDevice' ? 'single-device' : 'multi-device';
}
