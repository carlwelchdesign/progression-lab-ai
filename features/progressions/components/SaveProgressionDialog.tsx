'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Button,
  CircularProgress,
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

import { createProgression } from '../api/progressionsApi';
import type { ChordItem, GeneratorSnapshot, PianoVoicing } from '../../../lib/types';

type SaveProgressionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  generatorSnapshot?: GeneratorSnapshot;
  chords?: ChordItem[];
  pianoVoicings?: PianoVoicing[];
  feel?: string;
  scale?: string;
  genre?: string;
};

type SaveProgressionFormData = {
  title: string;
  isPublic: boolean;
};

export default function SaveProgressionDialog({
  open,
  onClose,
  onSuccess,
  generatorSnapshot,
  chords,
  pianoVoicings,
  feel,
  scale,
  genre,
}: SaveProgressionDialogProps) {
  const { showError, showSuccess } = useAppSnackbar();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SaveProgressionFormData>({
    defaultValues: {
      title: '',
      isPublic: false,
    },
    mode: 'onChange',
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: SaveProgressionFormData) => {
    try {
      await createProgression({
        title: data.title.trim() || undefined,
        isPublic: isAdmin ? data.isPublic : false,
        ...(generatorSnapshot
          ? { generatorSnapshot }
          : { chords, pianoVoicings, feel, scale, genre }),
      });

      showSuccess('Progression saved!');
      onSuccess?.();
      onClose();
    } catch (err) {
      showError((err as Error).message || 'Failed to save progression');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save Progression</DialogTitle>
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
                placeholder="Late Night Groove"
                disabled={isSubmitting}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

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
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={isSubmitting}
                      />
                    }
                    label="Add to Examples"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Makes this progression visible to all users under Examples.
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
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
