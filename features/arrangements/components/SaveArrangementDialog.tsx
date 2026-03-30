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
} from '@mui/material';

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
  sourceChords,
}: SaveArrangementDialogProps) {
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

  const onSubmit = async (data: SaveArrangementFormData) => {
    const payload: CreateArrangementRequest = {
      title: data.title.trim() || undefined,
      timeline,
      playbackSnapshot,
      sourceChords,
      isPublic: isAdmin ? data.isPublic : false,
    };

    try {
      await createArrangement(payload);
      showSuccess('Arrangement saved!');
      onSuccess?.();
      onClose();
    } catch (error) {
      showError((error as Error).message || 'Failed to save arrangement');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save Arrangement</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }} component="form">
          <Controller
            name="title"
            control={control}
            rules={{
              maxLength: {
                value: 100,
                message: 'Title must be less than 100 characters',
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <AppTextField
                label="Title (optional)"
                {...field}
                placeholder="Pad Groove Draft"
                disabled={isSubmitting}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          <Typography variant="caption" color="text.secondary">
            {timeline.events.length} events across {timeline.loopLengthBars} bar
            {timeline.loopLengthBars > 1 ? 's' : ''} ({timeline.totalSteps} steps)
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
                    label="Add to Examples"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Makes this arrangement visible to all users under Examples.
                  </Typography>
                </Stack>
              )}
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting ? 'Saving...' : 'Save arrangement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
