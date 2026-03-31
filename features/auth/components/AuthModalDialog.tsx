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
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../components/providers/AuthProvider';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import TextField from '../../../components/ui/TextField';
import WebAuthnEnrollmentModal from './WebAuthnEnrollmentModal';
import { fetchPublishedMarketingContent } from '../../../lib/marketingContentClient';
import { trackEvent } from '../../../lib/analytics';

export type AuthMode = 'login' | 'register';
export type AuthDialogReason = 'my-progressions' | 'save-arrangement' | 'upgrade-plan' | 'generic';

type AuthFormData = {
  name: string;
  email: string;
  password: string;
};

type LoginResponseBody = {
  status?: 'AUTHENTICATED' | 'MFA_REQUIRED';
  options?: PublicKeyCredentialRequestOptionsJSON;
  message?: string;
};

type AuthFlowCopy = {
  modalTitle?: string;
  modalDescription?: string;
  loginButtonLabel?: string;
  registerButtonLabel?: string;
  benefitDescription?: string;
};

type AuthModalDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: AuthMode;
  reason?: AuthDialogReason;
};

const getReasonKey = (reason: AuthDialogReason | undefined): string => {
  if (reason === 'my-progressions' || reason === 'save-arrangement' || reason === 'upgrade-plan') {
    return reason;
  }
  return 'generic';
};

export default function AuthModalDialog({
  open,
  onClose,
  onSuccess,
  initialMode = 'login',
  reason,
}: AuthModalDialogProps) {
  const { t, i18n } = useTranslation('common');
  const { refresh } = useAuth();
  const { showError, showSuccess } = useAppSnackbar();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [apiError, setApiError] = useState('');
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [authCopy, setAuthCopy] = useState<AuthFlowCopy | null>(null);
  const reasonKey = getReasonKey(reason);

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
    const loadAuthCopy = async () => {
      try {
        const item = await fetchPublishedMarketingContent('auth_flow_copy', i18n.language);
        const reasonCopy = item?.content?.[reasonKey] as AuthFlowCopy | undefined;
        setAuthCopy(reasonCopy ?? null);
      } catch {
        setAuthCopy(null);
      }
    };

    void loadAuthCopy();
  }, [reasonKey, i18n.language]);

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
        throw new Error(body.message ?? t('auth.errors.authenticationFailed'));
      }

      if (mode === 'login') {
        const body = (await response.json()) as LoginResponseBody;

        if (body.status === 'MFA_REQUIRED') {
          if (!body.options) {
            throw new Error(t('auth.errors.mfaOptionsMissing'));
          }

          const assertionResponse = await startAuthentication({ optionsJSON: body.options });
          const verifyResponse = await fetch('/api/auth/webauthn/authenticate', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response: assertionResponse }),
          });

          if (!verifyResponse.ok) {
            const verifyBody = (await verifyResponse.json()) as { message?: string };
            throw new Error(verifyBody.message ?? t('auth.errors.mfaVerificationFailed'));
          }
        }
      }

      await refresh();
      showSuccess(
        mode === 'login'
          ? t('auth.messages.signedInSuccessfully')
          : t('auth.messages.accountCreatedSuccessfully'),
      );

      trackEvent('auth_completed', { mode, reason: reasonKey });

      // If registering, show optional enrollment modal; otherwise close immediately
      if (mode === 'register') {
        setShowEnrollmentModal(true);
      } else {
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      const message = (err as Error).message || t('auth.errors.authenticationFailed');
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
        <DialogTitle>{authCopy?.modalTitle || t('auth.dialog.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} component="form" sx={{ mt: 1 }} onSubmit={handleSubmit(onSubmit)}>
            <Box>
              <Typography color="text.secondary">
                {authCopy?.modalDescription || t('auth.dialog.description')}
              </Typography>
            </Box>

            {authCopy?.benefitDescription ? (
              <Alert severity="info">{authCopy.benefitDescription}</Alert>
            ) : null}

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

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={onClose} disabled={isSubmitting}>
                {t('auth.actions.cancel')}
              </Button>
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
                    ? authCopy?.loginButtonLabel || t('auth.actions.signIn')
                    : authCopy?.registerButtonLabel || t('auth.actions.createAccount')}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <WebAuthnEnrollmentModal open={showEnrollmentModal} onClose={handleEnrollmentClose} />
    </>
  );
}
