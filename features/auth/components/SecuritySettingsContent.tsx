'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import { startRegistration } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { useTranslation } from 'react-i18next';

import { createCsrfHeaders, ensureCsrfCookie } from '../../../lib/csrfClient';
import { useAuth } from '../../../components/providers/AuthProvider';

type Credential = {
  id: string;
  credentialId: string;
  label: string | null;
  deviceType: string | null;
  backedUp: boolean | null;
  transports: string[];
  createdAt: string;
  lastUsedAt: string | null;
};

type ApiError = Error & {
  code?: string;
};

function toApiError(message: string, code?: string): ApiError {
  const error = new Error(message) as ApiError;
  error.code = code;
  return error;
}

function resolveSecurityErrorKey(error: ApiError, fallbackKey: string): string {
  if (error.code === 'UNAUTHORIZED') {
    return 'auth.security.errors.unauthorized';
  }

  if (error.code === 'WEBAUTHN_CREDENTIAL_ID_REQUIRED') {
    return 'auth.security.errors.credentialIdRequired';
  }

  if (error.code === 'WEBAUTHN_CREDENTIAL_NOT_FOUND') {
    return 'auth.security.errors.credentialNotFound';
  }

  if (error.code === 'WEBAUTHN_CREDENTIAL_REVOKE_FAILED') {
    return 'auth.security.errors.removeFailed';
  }

  if (error.code === 'WEBAUTHN_REGISTER_OPTIONS_FAILED') {
    return 'auth.security.errors.startRegistrationFailed';
  }

  if (error.code === 'WEBAUTHN_REGISTER_VERIFY_FAILED') {
    return 'auth.security.errors.enrollmentFailed';
  }

  if (error.message === 'Unauthorized') {
    return 'auth.security.errors.unauthorized';
  }

  if (error.message === 'credentialId is required') {
    return 'auth.security.errors.credentialIdRequired';
  }

  if (error.message === 'Credential not found') {
    return 'auth.security.errors.credentialNotFound';
  }

  return fallbackKey;
}

async function getResponseMessage(response: Response, fallback: string): Promise<ApiError> {
  try {
    const data = (await response.json()) as { message?: string; code?: string };
    return toApiError(data.message || fallback, data.code);
  } catch {
    // Ignore parse errors and return fallback.
    return toApiError(fallback);
  }
}

async function fetchCredentials(): Promise<Credential[]> {
  const response = await fetch('/api/auth/webauthn/credentials', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await getResponseMessage(response, 'Failed to load security keys');
  }

  const data = (await response.json()) as { credentials: Credential[] };
  return data.credentials;
}

async function getRegistrationOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
  await ensureCsrfCookie();

  const response = await fetch('/api/auth/webauthn/register/options', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw await getResponseMessage(response, 'Failed to start security key registration');
  }

  const data = (await response.json()) as { options: PublicKeyCredentialCreationOptionsJSON };
  return data.options;
}

async function saveRegistration(response: RegistrationResponseJSON, label?: string): Promise<void> {
  await ensureCsrfCookie();

  const res = await fetch('/api/auth/webauthn/register/verify', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ response, label }),
  });

  if (!res.ok) {
    throw await getResponseMessage(res, 'Security key enrollment failed');
  }
}

async function revokeCredential(credentialId: string): Promise<void> {
  await ensureCsrfCookie();

  const response = await fetch('/api/auth/webauthn/credentials', {
    method: 'DELETE',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ credentialId }),
  });

  if (!response.ok) {
    throw await getResponseMessage(response, 'Failed to remove security key');
  }
}

type SecuritySettingsContentProps = {
  suppressUnauthenticatedNotice?: boolean;
};

export default function SecuritySettingsContent({
  suppressUnauthenticatedNotice = false,
}: SecuritySettingsContentProps) {
  const { t } = useTranslation('common');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadCredentials = useCallback(async () => {
    setLoadError(null);

    try {
      const result = await fetchCredentials();
      setCredentials(result);
    } catch (error) {
      const securityError = error as ApiError;
      setLoadError(t(resolveSecurityErrorKey(securityError, 'auth.security.errors.loadFailed')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setIsLoading(false);
      setCredentials([]);
      return;
    }

    setIsLoading(true);
    void loadCredentials();
  }, [isAuthenticated, isAuthLoading, loadCredentials]);

  const handleAddKey = async () => {
    setEnrollError(null);
    setEnrollSuccess(false);
    setIsEnrolling(true);

    try {
      const options = await getRegistrationOptions();
      const regResponse = await startRegistration({ optionsJSON: options });
      await saveRegistration(regResponse, t('auth.security.defaultLabel'));
      setEnrollSuccess(true);
      await loadCredentials();
    } catch (error) {
      const securityError = error as ApiError;
      const message = securityError.message ?? t('auth.security.errors.enrollmentFailed');
      setEnrollError(
        message.includes('NotAllowedError') || message.includes('The operation')
          ? t('auth.security.errors.cancelledOrTimedOut')
          : t(resolveSecurityErrorKey(securityError, 'auth.security.errors.enrollmentFailed')),
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemove = async (credentialId: string) => {
    if (!window.confirm(t('auth.security.confirmRemove'))) {
      return;
    }

    setRemovingId(credentialId);

    try {
      await revokeCredential(credentialId);
      await loadCredentials();
    } catch (error) {
      const securityError = error as ApiError;
      setEnrollError(
        t(resolveSecurityErrorKey(securityError, 'auth.security.errors.removeFailed')),
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (isAuthLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated) {
    if (suppressUnauthenticatedNotice) {
      return null;
    }

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">{t('auth.security.errors.unauthorized')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            {t('auth.security.title')}
          </Typography>
          <Typography color="text.secondary">{t('auth.security.description')}</Typography>
        </Box>

        {loadError ? <Alert severity="error">{loadError}</Alert> : null}
        {enrollError ? <Alert severity="error">{enrollError}</Alert> : null}
        {enrollSuccess ? (
          <Alert severity="success">{t('auth.security.messages.enrolled')}</Alert>
        ) : null}

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">{t('auth.security.enrolledKeysTitle')}</Typography>
              <Button
                variant="contained"
                startIcon={<SecurityIcon />}
                onClick={() => void handleAddKey()}
                disabled={isEnrolling}
              >
                {isEnrolling
                  ? t('auth.security.actions.followBrowserPrompt')
                  : t('auth.security.actions.addSecurityKey')}
              </Button>
            </Stack>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : credentials.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                {t('auth.security.empty')}
              </Typography>
            ) : (
              <List disablePadding>
                {credentials.map((credential, index) => (
                  <Box key={credential.id}>
                    {index > 0 ? <Divider /> : null}
                    <ListItem
                      secondaryAction={
                        <Tooltip title={t('auth.security.actions.removeKey')}>
                          <IconButton
                            edge="end"
                            aria-label={t('auth.security.actions.removeKeyAriaLabel')}
                            onClick={() => void handleRemove(credential.id)}
                            disabled={removingId === credential.id}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={credential.label ?? t('auth.security.defaultLabel')}
                        secondary={
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                            {credential.backedUp ? (
                              <Chip
                                label={t('auth.security.backedUp')}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label={t('auth.security.singleDevice')}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {t('auth.security.meta.added')}{' '}
                              {new Date(credential.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                            {credential.lastUsedAt ? (
                              <Typography variant="caption" color="text.secondary">
                                · {t('auth.security.meta.lastUsed')}{' '}
                                {new Date(credential.lastUsedAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </Typography>
                            ) : null}
                          </Stack>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
