'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

import AppTextField from '../../../components/ui/TextField';

import { createProgression } from '../api/progressionsApi';
import { getTagChipSx, PRESET_TAG_OPTIONS, sanitizeTags } from '../../../lib/tagMetadata';
import type { ChordItem, PianoVoicing } from '../../../lib/types';

type SaveProgressionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  chords: ChordItem[];
  pianoVoicings?: PianoVoicing[];
  feel?: string;
  scale?: string;
  genre?: string;
};

type SaveProgressionFormData = {
  title: string;
  notes: string;
  tags: string[];
  isPublic: boolean;
};

export default function SaveProgressionDialog({
  open,
  onClose,
  onSuccess,
  chords,
  pianoVoicings,
  feel: defaultFeel,
  scale: defaultScale,
  genre: defaultGenre,
}: SaveProgressionDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SaveProgressionFormData>({
    defaultValues: {
      title: '',
      notes: '',
      tags: [],
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
    if (!data.title.trim()) {
      return;
    }

    try {
      await createProgression({
        title: data.title.trim(),
        chords,
        pianoVoicings,
        feel: defaultFeel,
        scale: defaultScale,
        genre: defaultGenre,
        notes: data.notes.trim() || undefined,
        tags: sanitizeTags(data.tags),
        isPublic: data.isPublic,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      // Error is handled by the form submission
      console.error('Failed to save progression:', err);
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
              required: 'Title is required',
              minLength: {
                value: 2,
                message: 'Title must be at least 2 characters',
              },
              maxLength: {
                value: 100,
                message: 'Title must be less than 100 characters',
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <AppTextField
                label="Title"
                {...field}
                placeholder="Late Night Groove"
                disabled={isSubmitting}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <AppTextField
                label="Notes"
                {...field}
                placeholder="Try with syncopated bass..."
                multiline
                rows={3}
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="tags"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Autocomplete<string, true, false, true>
                multiple
                freeSolo
                options={PRESET_TAG_OPTIONS}
                value={value}
                onChange={(_, newValue) => {
                  onChange(sanitizeTags(newValue));
                }}
                filterSelectedOptions
                disabled={isSubmitting}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option}
                        size="small"
                        variant="outlined"
                        sx={getTagChipSx(option)}
                        {...tagProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Select or type tags"
                    helperText="Choose from preset genre/feeling tags or add your own"
                    fullWidth
                  />
                )}
              />
            )}
          />

          <Controller
            name="isPublic"
            control={control}
            render={({ field: { value, onChange } }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Make public & shareable"
              />
            )}
          />

          {errors.title && <Alert severity="error">{errors.title.message}</Alert>}
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
