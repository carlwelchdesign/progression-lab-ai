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
  Stack,
} from '@mui/material';

import AppTextField from '../../../components/ui/TextField';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';

import { createProgression } from '../api/progressionsApi';
import type { GeneratorSnapshot } from '../../../lib/types';

type SaveProgressionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  generatorSnapshot: GeneratorSnapshot;
};

type SaveProgressionFormData = {
  title: string;
};

export default function SaveProgressionDialog({
  open,
  onClose,
  onSuccess,
  generatorSnapshot,
}: SaveProgressionDialogProps) {
  const { showError, showSuccess } = useAppSnackbar();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SaveProgressionFormData>({
    defaultValues: {
      title: '',
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
        generatorSnapshot,
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
