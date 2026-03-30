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
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';

import { createCsrfHeaders } from '../../../lib/csrfClient';

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

async function fetchCredentials(): Promise<Credential[]> {
  const response = await fetch('/api/auth/webauthn/credentials', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load security keys');
  }

  const data = (await response.json()) as { credentials: Credential[] };
  return data.credentials;
}

async function getRegistrationOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const response = await fetch('/api/auth/webauthn/register/options', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error('Failed to start security key registration');
  }

  const data = (await response.json()) as { options: PublicKeyCredentialCreationOptionsJSON };
  return data.options;
}

async function saveRegistration(response: RegistrationResponseJSON, label?: string): Promise<void> {
  const res = await fetch('/api/auth/webauthn/register/verify', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ response, label }),
  });

  if (!res.ok) {
    throw new Error('Security key enrollment failed');
  }
}

async function revokeCredential(credentialId: string): Promise<void> {
  const response = await fetch('/api/auth/webauthn/credentials', {
    method: 'DELETE',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ credentialId }),
  });

  if (!response.ok) {
    throw new Error('Failed to remove security key');
  }
}

export default function SecuritySettingsContent() {
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
      setLoadError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCredentials();
  }, [loadCredentials]);

  const handleAddKey = async () => {
    setEnrollError(null);
    setEnrollSuccess(false);
    setIsEnrolling(true);

    try {
      const options = await getRegistrationOptions();
      const regResponse = await startRegistration({ optionsJSON: options });
      await saveRegistration(regResponse, 'My security key');
      setEnrollSuccess(true);
      await loadCredentials();
    } catch (error) {
      const message = (error as Error).message ?? 'Security key enrollment failed';
      setEnrollError(
        message.includes('NotAllowedError') || message.includes('The operation')
          ? 'Security key interaction was cancelled or timed out.'
          : message,
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemove = async (credentialId: string) => {
    if (!window.confirm('Remove this security key?')) {
      return;
    }

    setRemovingId(credentialId);

    try {
      await revokeCredential(credentialId);
      await loadCredentials();
    } catch (error) {
      setEnrollError((error as Error).message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            Security Keys
          </Typography>
          <Typography color="text.secondary">
            Add hardware security keys (FIDO2 / WebAuthn) for stronger account protection.
          </Typography>
        </Box>

        {loadError ? <Alert severity="error">{loadError}</Alert> : null}
        {enrollError ? <Alert severity="error">{enrollError}</Alert> : null}
        {enrollSuccess ? (
          <Alert severity="success">Security key enrolled successfully.</Alert>
        ) : null}

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Enrolled keys</Typography>
              <Button
                variant="contained"
                startIcon={<SecurityIcon />}
                onClick={() => void handleAddKey()}
                disabled={isEnrolling}
              >
                {isEnrolling ? 'Follow browser prompt…' : 'Add security key'}
              </Button>
            </Stack>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : credentials.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No security keys enrolled.
              </Typography>
            ) : (
              <List disablePadding>
                {credentials.map((credential, index) => (
                  <Box key={credential.id}>
                    {index > 0 ? <Divider /> : null}
                    <ListItem
                      secondaryAction={
                        <Tooltip title="Remove key">
                          <IconButton
                            edge="end"
                            aria-label="remove security key"
                            onClick={() => void handleRemove(credential.id)}
                            disabled={removingId === credential.id}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={credential.label ?? 'Security key'}
                        secondary={
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                            {credential.backedUp ? (
                              <Chip label="Backed up" size="small" color="success" variant="outlined" />
                            ) : (
                              <Chip label="Single device" size="small" variant="outlined" />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Added{' '}
                              {new Date(credential.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                            {credential.lastUsedAt ? (
                              <Typography variant="caption" color="text.secondary">
                                · Last used{' '}
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
