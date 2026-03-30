'use client';

import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import type { AdminLoginStatus } from './types';

type LoginCardProps = {
  authError: string | null;
  email: string;
  password: string;
  isSubmitting: boolean;
  loginStatus: AdminLoginStatus | null;
  mfaOptions: unknown;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onWebAuthnAuthentication: (response: AuthenticationResponseJSON) => void;
  onWebAuthnEnrollment: (response: RegistrationResponseJSON, label?: string | null) => void;
};

export default function LoginCard({
  authError,
  email,
  password,
  isSubmitting,
  loginStatus,
  mfaOptions,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onWebAuthnAuthentication,
  onWebAuthnEnrollment,
}: LoginCardProps) {
  const [webAuthnError, setWebAuthnError] = useState<string | null>(null);
  const [isWebAuthnPending, setIsWebAuthnPending] = useState(false);

  const handleAuthenticate = async () => {
    setWebAuthnError(null);
    setIsWebAuthnPending(true);

    try {
      const authResponse = await startAuthentication({
        optionsJSON: mfaOptions as PublicKeyCredentialRequestOptionsJSON,
      });
      onWebAuthnAuthentication(authResponse);
    } catch (error) {
      const message = (error as Error).message ?? 'Security key interaction failed';
      setWebAuthnError(
        message.includes('NotAllowedError') || message.includes('The operation')
          ? 'Security key interaction was cancelled or timed out.'
          : message,
      );
    } finally {
      setIsWebAuthnPending(false);
    }
  };

  const handleEnroll = async () => {
    setWebAuthnError(null);
    setIsWebAuthnPending(true);

    try {
      const regResponse = await startRegistration({
        optionsJSON: mfaOptions as PublicKeyCredentialCreationOptionsJSON,
      });
      onWebAuthnEnrollment(regResponse, 'Admin security key');
    } catch (error) {
      const message = (error as Error).message ?? 'Security key interaction failed';
      setWebAuthnError(
        message.includes('NotAllowedError') || message.includes('The operation')
          ? 'Security key interaction was cancelled or timed out.'
          : message,
      );
    } finally {
      setIsWebAuthnPending(false);
    }
  };

  const displayError = authError ?? webAuthnError;
  const isBusy = isSubmitting || isWebAuthnPending;

  if (loginStatus === 'MFA_REQUIRED') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" component="h1">
                  Security Key Required
                </Typography>
                <Typography color="text.secondary">
                  Touch your security key or approve the prompt to continue.
                </Typography>
              </Box>

              {displayError ? <Alert severity="error">{displayError}</Alert> : null}

              <Button
                variant="contained"
                onClick={() => void handleAuthenticate()}
                disabled={isBusy}
              >
                {isBusy ? 'Waiting for security key…' : 'Use security key'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loginStatus === 'ENROLLMENT_REQUIRED') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" component="h1">
                  Register Security Key
                </Typography>
                <Typography color="text.secondary">
                  No security key is registered for your admin account. Enroll one now to
                  continue — it will be required on every future login.
                </Typography>
              </Box>

              {displayError ? <Alert severity="error">{displayError}</Alert> : null}

              <Button
                variant="contained"
                onClick={() => void handleEnroll()}
                disabled={isBusy}
              >
                {isBusy ? 'Registering security key…' : 'Register security key'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3} component="form" onSubmit={onSubmit}>
            <Box>
              <Typography variant="h4" component="h1">
                ProgressionLab Admin
              </Typography>
              <Typography color="text.secondary">
                Sign in with an ADMIN or AUDITOR account.
              </Typography>
            </Box>

            {displayError ? <Alert severity="error">{displayError}</Alert> : null}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              required
            />

            <Button type="submit" variant="contained" disabled={isBusy}>
              {isBusy ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
