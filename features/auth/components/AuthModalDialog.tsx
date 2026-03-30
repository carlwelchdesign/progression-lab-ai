'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import { useAuth } from '../../../components/providers/AuthProvider';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import TextField from '../../../components/ui/TextField';
import WebAuthnEnrollmentModal from './WebAuthnEnrollmentModal';

export type AuthMode = 'login' | 'register';
export type AuthDialogReason = 'my-progressions' | 'save-arrangement' | 'generic';

type AuthFormData = {
  name: string;
  email: string;
  password: string;
};

type AuthModalDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: AuthMode;
  reason?: AuthDialogReason;
};

const getReasonMessage = (reason: AuthDialogReason | undefined): string | null => {
  if (reason === 'my-progressions') {
    return 'Create an account to access your personal saved progressions.';
  }

  if (reason === 'save-arrangement') {
    return 'Sign in or create an account to save this arrangement.';
  }

  return null;
};

export default function AuthModalDialog({
  open,
  onClose,
  onSuccess,
  initialMode = 'login',
  reason,
}: AuthModalDialogProps) {
  const { refresh } = useAuth();
  const { showError, showSuccess } = useAppSnackbar();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [apiError, setApiError] = useState('');
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const reasonMessage = getReasonMessage(reason);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<AuthFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(initialMode);
    setApiError('');
    reset();
  }, [initialMode, open, reset]);

  const onSubmit = async (data: AuthFormData) => {
    setApiError('');

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? 'Authentication failed');
      }

      await refresh();
      showSuccess(mode === 'login' ? 'Signed in successfully.' : 'Account created successfully.');

      // If registering, show optional enrollment modal; otherwise close immediately
      if (mode === 'register') {
        setShowEnrollmentModal(true);
      } else {
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      const message = (err as Error).message || 'Authentication failed';
      setApiError(message);
      showError(message);
    }
  };

  const handleEnrollmentClose = () => {
    setShowEnrollmentModal(false);
    onClose();
    onSuccess?.();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={isSubmitting || showEnrollmentModal ? undefined : onClose}
        maxWidth="sm"
        fullWidth
      >
      <DialogTitle>Account</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} component="form" sx={{ mt: 1 }} onSubmit={handleSubmit(onSubmit)}>
          <Box>
            <Typography color="text.secondary">
              Register or sign in without leaving your current work.
            </Typography>
          </Box>

          {reasonMessage ? <Alert severity="info">{reasonMessage}</Alert> : null}

          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_e, value: AuthMode | null) => {
              if (value) {
                setMode(value);
                setApiError('');
                reset();
              }
            }}
            size="small"
          >
            <ToggleButton value="login">Login</ToggleButton>
            <ToggleButton value="register">Register</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'register' ? (
            <Controller
              name="name"
              control={control}
              rules={{
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  label="Name"
                  {...field}
                  disabled={isSubmitting}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          ) : null}

          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label="Email"
                type="email"
                {...field}
                disabled={isSubmitting}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
              ...(mode === 'register' && {
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              }),
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label="Password"
                type="password"
                {...field}
                disabled={isSubmitting}
                error={!!error}
                helperText={
                  error?.message || (mode === 'register' ? 'Minimum 8 characters' : undefined)
                }
              />
            )}
          />

          {apiError ? <Alert severity="error">{apiError}</Alert> : null}

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              {isSubmitting
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
    <WebAuthnEnrollmentModal open={showEnrollmentModal} onClose={handleEnrollmentClose} />
    </>
  );
}
