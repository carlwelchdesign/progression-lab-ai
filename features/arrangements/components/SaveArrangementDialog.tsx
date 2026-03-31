'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from 'react-i18next';

import AppTextField from '../../../components/ui/TextField';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import { useAuth } from '../../../components/providers/AuthProvider';
import { getRandomTitleSuggestion } from '../../../lib/titlePhrases';
import type {
  ArrangementPlaybackSnapshot,
  ArrangementTimeline,
  CreateArrangementRequest,
} from '../../../lib/types';
import { createArrangement } from '../api/arrangementsApi';

type SaveArrangementDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  timeline: ArrangementTimeline;
  playbackSnapshot: ArrangementPlaybackSnapshot;
  vocalTakeCount?: number;
  sourceChords?: Array<{
    key: string;
    chord: string;
    source: string;
    leftHand: string[];
    rightHand: string[];
  }>;
};

type SaveArrangementFormData = {
  title: string;
  isPublic: boolean;
};

export default function SaveArrangementDialog({
  open,
  onClose,
  onSuccess,
  timeline,
  playbackSnapshot,
  vocalTakeCount,
  sourceChords,
}: SaveArrangementDialogProps) {
  const { t } = useTranslation('common');
  const { showError, showSuccess } = useAppSnackbar();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<SaveArrangementFormData>({
    defaultValues: {
      title: '',
      isPublic: false,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      setValue('title', getRandomTitleSuggestion());
    } else {
      reset();
    }
  }, [open, reset, setValue]);

  const handleRefreshTitle = () => {
    setValue('title', getRandomTitleSuggestion());
  };

  const onSubmit = async (data: SaveArrangementFormData) => {
    const payload: CreateArrangementRequest = {
      title: data.title.trim() || undefined,
      timeline,
      playbackSnapshot,
      vocalTakeCount,
      sourceChords,
      isPublic: isAdmin ? data.isPublic : false,
    };

    try {
      await createArrangement(payload);
      showSuccess(t('arrangements.saveDialog.messages.saved'));
      onSuccess?.();
      onClose();
    } catch (error) {
      showError((error as Error).message || t('arrangements.saveDialog.messages.saveFailed'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('arrangements.saveDialog.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }} component="form">
          <Controller
            name="title"
            control={control}
            rules={{
              maxLength: {
                value: 100,
                message: t('arrangements.saveDialog.form.titleMaxLength'),
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <AppTextField
                label={t('arrangements.saveDialog.form.titleLabel')}
                {...field}
                placeholder={t('arrangements.saveDialog.form.titlePlaceholder')}
                disabled={isSubmitting}
                error={!!error}
                helperText={error?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleRefreshTitle}
                          disabled={isSubmitting}
                          edge="end"
                          size="small"
                          aria-label={t('arrangements.saveDialog.form.regenerateTitleAriaLabel')}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />

          <Typography variant="caption" color="text.secondary">
            {t('arrangements.saveDialog.form.timelineSummary', {
              eventCount: timeline.events.length,
              barCount: timeline.loopLengthBars,
              stepCount: timeline.totalSteps,
            })}
          </Typography>

          {isAdmin ? (
            <Controller
              name="isPublic"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Stack spacing={0.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(event) => onChange(event.target.checked)}
                        disabled={isSubmitting}
                      />
                    }
                    label={t('arrangements.saveDialog.form.addToExamplesLabel')}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t('arrangements.saveDialog.form.addToExamplesHelperText')}
                  </Typography>
                </Stack>
              )}
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('arrangements.saveDialog.actions.cancel')}
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting
            ? t('arrangements.saveDialog.actions.saving')
            : t('arrangements.saveDialog.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
