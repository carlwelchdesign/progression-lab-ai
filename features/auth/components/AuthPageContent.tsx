'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
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
        throw new Error(body.message ?? t('auth.errors.authenticationFailed'));
      }

      // Refresh auth context with new user data
      await refresh();
      showSuccess(
        mode === 'login'
          ? t('auth.messages.signedInSuccessfully')
          : t('auth.messages.accountCreatedSuccessfully'),
      );
    } catch (err) {
      const message = (err as Error).message || t('auth.errors.authenticationFailed');
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
              {t('auth.dialog.title')}
            </Typography>
            <Typography color="text.secondary">{t('auth.dialog.description')}</Typography>
          </Box>

          {reason === 'my-progressions' ? (
            <Alert severity="info">{t('auth.reason.myProgressions')}</Alert>
          ) : reason === 'account' ? (
            <Alert severity="info">{t('auth.reason.account')}</Alert>
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
            <ToggleButton value="login">{t('auth.actions.login')}</ToggleButton>
            <ToggleButton value="register">{t('auth.actions.register')}</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'register' ? (
            <Controller
              name="name"
              control={control}
              rules={{
                required: t('auth.form.nameRequired'),
                minLength: {
                  value: 2,
                  message: t('auth.form.nameMinLength'),
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  label={t('auth.form.nameLabel')}
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
              required: t('auth.form.emailRequired'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('auth.form.emailInvalid'),
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label={t('auth.form.emailLabel')}
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
              required: t('auth.form.passwordRequired'),
              ...(mode === 'register' && {
                minLength: {
                  value: 8,
                  message: t('auth.form.passwordMinLength'),
                },
              }),
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label={t('auth.form.passwordLabel')}
                type="password"
                {...field}
                disabled={isSubmitting}
                error={!!error}
                helperText={
                  error?.message ||
                  (mode === 'register' ? t('auth.form.passwordMinLengthHint') : undefined)
                }
              />
            )}
          />
          {apiError ? <Alert severity="error">{apiError}</Alert> : null}

          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
          >
            {isSubmitting
              ? mode === 'login'
                ? t('auth.actions.signingIn')
                : t('auth.actions.creatingAccount')
              : mode === 'login'
                ? t('auth.actions.signIn')
                : t('auth.actions.createAccount')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
