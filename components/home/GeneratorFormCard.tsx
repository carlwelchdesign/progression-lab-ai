'use client';

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
} from 'react-hook-form';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  TextField as MuiTextField,
} from '@mui/material';

import Card from '../ui/Card';
import SelectField from '../ui/SelectField';
import TextField from '../ui/TextField';
import { CHORD_OPTIONS, GENRE_OPTIONS, MODE_OPTIONS, MOOD_OPTIONS } from '../../lib/formOptions';
import { getChordChipSx, getMoodChipSx } from '../../lib/tagMetadata';
import type { GeneratorFormData } from './types';

type GeneratorFormCardProps = {
  control: Control<GeneratorFormData>;
  handleSubmit: UseFormHandleSubmit<GeneratorFormData>;
  onSubmit: (formData: GeneratorFormData) => Promise<void> | void;
  mode: string;
  genre: string;
  isSubmitting: boolean;
  loading: boolean;
  errors: FieldErrors<GeneratorFormData>;
  errorMessage: string;
  onRandomize: () => void;
};

export default function GeneratorFormCard({
  control,
  handleSubmit,
  onSubmit,
  mode,
  genre,
  isSubmitting,
  loading,
  errors,
  errorMessage,
  onRandomize,
}: GeneratorFormCardProps) {
  return (
    <Card>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 2,
        }}
        id="generator-form"
      >
        <Controller
          name="seedChords"
          control={control}
          rules={{
            required: 'Seed chords are required',
            validate: (value) => {
              return value.trim().length > 0 || 'Please enter at least one chord';
            },
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            const chordArray = value
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean);
            return (
              <Autocomplete<string, true, false, true>
                multiple
                freeSolo
                options={CHORD_OPTIONS}
                value={chordArray}
                onChange={(_, newValue) => {
                  onChange(newValue.join(', '));
                }}
                disabled={isSubmitting || loading}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option}
                        size="small"
                        sx={getChordChipSx(option)}
                        {...tagProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <MuiTextField
                    {...params}
                    label="Seed chords"
                    placeholder={chordArray.length > 0 ? '' : 'Fmaj7, F#m7'}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            );
          }}
        />

        <Controller
          name="mood"
          control={control}
          rules={{
            required: 'Mood is required',
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            const moodArray = value
              .split(',')
              .map((m) => m.trim())
              .filter(Boolean);
            return (
              <Autocomplete<string, true, false, true>
                multiple
                freeSolo
                options={MOOD_OPTIONS}
                value={moodArray}
                onChange={(_, newValue) => {
                  onChange(newValue.join(', '));
                }}
                disabled={isSubmitting || loading}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option}
                        size="small"
                        sx={getMoodChipSx(option)}
                        {...tagProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <MuiTextField
                    {...params}
                    label="Mood"
                    placeholder={moodArray.length > 0 ? '' : 'dreamy, dark, hopeful'}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            );
          }}
        />

        <Controller
          name="mode"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Mode / scale"
              {...field}
              options={[
                { value: '', label: 'Select a mode or scale', disabled: true },
                ...MODE_OPTIONS,
              ]}
              disabled={isSubmitting || loading}
            />
          )}
        />

        {mode === 'custom' ? (
          <Controller
            name="customMode"
            control={control}
            rules={{
              required: 'Please enter a custom mode or scale',
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label="Custom mode / scale"
                {...field}
                placeholder="Hungarian minor, altered scale, etc."
                disabled={isSubmitting || loading}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        ) : null}

        <Controller
          name="genre"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Genre"
              {...field}
              options={[{ value: '', label: 'Select a genre', disabled: true }, ...GENRE_OPTIONS]}
              disabled={isSubmitting || loading}
            />
          )}
        />

        {genre === 'custom' ? (
          <Controller
            name="customGenre"
            control={control}
            rules={{
              required: 'Please enter a custom genre',
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label="Custom genre"
                {...field}
                placeholder="UK garage, synthwave, bossa nova, etc."
                disabled={isSubmitting || loading}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        ) : null}

        <Controller
          name="adventurousness"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Adventurousness"
              {...field}
              options={[
                { value: 'safe', label: 'Safe' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'surprising', label: 'Surprising' },
              ]}
              disabled={isSubmitting || loading}
            />
          )}
        />

      </Box>

      <Stack spacing={2} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            type="button"
            onClick={onRandomize}
            disabled={isSubmitting || loading}
            fullWidth
          >
            Randomize Inputs
          </Button>
          <Button
            variant="contained"
            type="submit"
            form="generator-form"
            disabled={isSubmitting || loading || Object.keys(errors).length > 0}
            fullWidth
          >
            {loading ? 'Generating...' : 'Generate Ideas'}
          </Button>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      </Stack>
    </Card>
  );
}
