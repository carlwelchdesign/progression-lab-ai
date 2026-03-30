'use client';

import { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';

import { createCsrfHeaders } from '../../../lib/csrfClient';

type WebAuthnEnrollmentModalProps = {
  open: boolean;
  onClose: () => void;
};

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

async function saveRegistration(regResponse: RegistrationResponseJSON): Promise<void> {
  const response = await fetch('/api/auth/webauthn/register/verify', {
    method: 'POST',
    credentials: 'include',
    headers: createCsrfHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      response: regResponse,
      label: 'My first security key',
    }),
  });

  if (!response.ok) {
    throw new Error('Security key enrollment failed');
  }
}

export default function WebAuthnEnrollmentModal({ open, onClose }: WebAuthnEnrollmentModalProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEnroll = useCallback(async () => {
    setError(null);
    setIsEnrolling(true);

    try {
      const options = await getRegistrationOptions();
      const regResponse = await startRegistration({ optionsJSON: options });
      await saveRegistration(regResponse);
      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const message = (err as Error).message ?? 'Security key enrollment failed';
      setError(
        message.includes('NotAllowedError') || message.includes('The operation')
          ? 'Security key interaction was cancelled or timed out.'
          : message,
      );
    } finally {
      setIsEnrolling(false);
    }
  }, [onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          <span>Add a Security Key</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {success ? (
            <Alert severity="success">
              Security key enrolled successfully! You can add more keys from your security settings later.
            </Alert>
          ) : (
            <>
              <Typography>
                Protect your account with a hardware security key (like a YubiKey). This is optional but
                highly recommended.
              </Typography>

              {error && <Alert severity="error">{error}</Alert>}

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SecurityIcon />}
                  onClick={() => void handleEnroll()}
                  disabled={isEnrolling}
                  fullWidth
                >
                  {isEnrolling ? 'Follow browser prompt…' : 'Add Security Key'}
                </Button>
                <Button onClick={onClose} disabled={isEnrolling} variant="outlined">
                  Skip
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
