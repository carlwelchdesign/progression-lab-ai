'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useAuth } from '../../../components/providers/AuthProvider';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import TextField from '../../../components/ui/TextField';

type AuthMode = 'login' | 'register';

type AuthFormData = {
  name: string;
  email: string;
  password: string;
};

export default function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const reason = searchParams.get('reason');
  const { refresh } = useAuth();
  const { showError, showSuccess } = useAppSnackbar();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [apiError, setApiError] = useState('');
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

  const onSubmit = async (data: AuthFormData) => {
    setApiError('');

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
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

      // Refresh auth context with new user data
      await refresh();
      showSuccess(mode === 'login' ? 'Signed in successfully.' : 'Account created successfully.');
      router.push('/progressions');
    } catch (err) {
      const message = (err as Error).message || 'Authentication failed';
      setApiError(message);
      showError(message);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Account
            </Typography>
            <Typography color="text.secondary">
              Register or sign in to access your saved progressions.
            </Typography>
          </Box>

          {reason === 'my-progressions' ? (
            <Alert severity="info">
              Create an account to access your personal saved progressions.
            </Alert>
          ) : null}

          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_e, value: AuthMode | null) => {
              if (value) {
                setMode(value);
                setApiError('');
                reset(); // Reset form when switching modes
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

          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
