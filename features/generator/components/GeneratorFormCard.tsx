'use client';

import { useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';

import Card from '../../../components/ui/Card';
import GroupedAutocompleteField from '../../../components/ui/GroupedAutocompleteField';
import {
  ADVENTUROUSNESS_OPTIONS,
  CHORD_OPTIONS,
  GENRE_INPUT_OPTIONS,
  MODE_INPUT_OPTIONS,
  MOOD_OPTIONS,
  STYLE_REFERENCE_OPTIONS,
} from '../../../lib/formOptions';
import {
  ADVENTUROUSNESS_CATEGORY_KEY_BY_VALUE,
  ADVENTUROUSNESS_LABEL_KEY_BY_VALUE,
  GENRE_CATEGORY_KEY_BY_VALUE,
  GENRE_LABEL_KEY_BY_VALUE,
  MODE_CATEGORY_KEY_BY_VALUE,
  MODE_LABEL_KEY_BY_VALUE,
  STYLE_REFERENCE_CATEGORY_KEY_BY_VALUE,
} from '../../../lib/i18n/generatorOptionTranslations';
import { getChordChipSx, getMoodChipSx } from '../../../lib/tagMetadata';
import type { GeneratorFormData } from '../types';

function buildTranslatedGroupMap(
  groupKeyByValue: Record<string, string>,
  translate: (key: string) => string,
) {
  return Object.fromEntries(
    Object.entries(groupKeyByValue).map(([value, key]) => [value, translate(key)]),
  );
}

/**
 * Props for the main generator form card.
 */
type GeneratorFormCardProps = {
  control: Control<GeneratorFormData>;
  handleSubmit: UseFormHandleSubmit<GeneratorFormData>;
  onSubmit: (formData: GeneratorFormData) => Promise<void> | void;
  isSubmitting: boolean;
  loading: boolean;
  errors: FieldErrors<GeneratorFormData>;
  errorMessage: string;
  onRandomize: () => void;
};

/**
 * Form card used to collect seed chords, mood, mode, genre, and tempo.
 */
export default function GeneratorFormCard({
  control,
  handleSubmit,
  onSubmit,
  isSubmitting,
  loading,
  errors,
  errorMessage,
  onRandomize,
}: GeneratorFormCardProps) {
  const { t } = useTranslation();

  const modeGroupByName = useMemo(
    () => buildTranslatedGroupMap(MODE_CATEGORY_KEY_BY_VALUE, t),
    [t],
  );
  const genreGroupByName = useMemo(
    () => buildTranslatedGroupMap(GENRE_CATEGORY_KEY_BY_VALUE, t),
    [t],
  );
  const adventurousnessGroupByName = useMemo(
    () => buildTranslatedGroupMap(ADVENTUROUSNESS_CATEGORY_KEY_BY_VALUE, t),
    [t],
  );
  const styleReferenceGroupByName = useMemo(
    () => buildTranslatedGroupMap(STYLE_REFERENCE_CATEGORY_KEY_BY_VALUE, t),
    [t],
  );

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
            required: t('generator.form.seedChords.required'),
            validate: (value) => {
              return value.trim().length > 0 || t('generator.form.seedChords.atLeastOne');
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
                    label={t('generator.form.seedChords.label')}
                    placeholder={
                      chordArray.length > 0 ? '' : t('generator.form.seedChords.placeholder')
                    }
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
            required: t('generator.form.mood.required'),
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
                    label={t('generator.form.mood.label')}
                    placeholder={moodArray.length > 0 ? '' : t('generator.form.mood.placeholder')}
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
          rules={{
            required: t('generator.form.mode.required'),
            validate: (value) => value.trim().length > 0 || t('generator.form.mode.required'),
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <GroupedAutocompleteField
              label={t('generator.form.mode.label')}
              value={value}
              onChange={onChange}
              options={MODE_INPUT_OPTIONS}
              groupByName={modeGroupByName}
              getOptionLabel={(option) => t(MODE_LABEL_KEY_BY_VALUE[option] ?? option)}
              freeSolo
              disabled={isSubmitting || loading}
              placeholder={t('generator.form.mode.placeholder')}
              helperText={error?.message}
              error={!!error}
            />
          )}
        />

        <Controller
          name="genre"
          control={control}
          rules={{
            required: t('generator.form.genre.required'),
            validate: (value) => value.trim().length > 0 || t('generator.form.genre.required'),
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <GroupedAutocompleteField
              label={t('generator.form.genre.label')}
              value={value}
              onChange={onChange}
              options={GENRE_INPUT_OPTIONS}
              groupByName={genreGroupByName}
              getOptionLabel={(option) => t(GENRE_LABEL_KEY_BY_VALUE[option] ?? option)}
              freeSolo
              disabled={isSubmitting || loading}
              placeholder={t('generator.form.genre.placeholder')}
              helperText={error?.message}
              error={!!error}
            />
          )}
        />

        <Controller
          name="styleReference"
          control={control}
          render={({ field: { value, onChange } }) => (
            <GroupedAutocompleteField
              label={t('generator.form.styleReference.label')}
              value={value}
              onChange={onChange}
              freeSolo
              options={STYLE_REFERENCE_OPTIONS}
              groupByName={styleReferenceGroupByName}
              disabled={isSubmitting || loading}
              placeholder={t('generator.form.styleReference.placeholder')}
              helperText={t('generator.form.styleReference.helperText')}
            />
          )}
        />

        <Controller
          name="adventurousness"
          control={control}
          render={({ field: { value, onChange } }) => (
            <GroupedAutocompleteField
              label={t('generator.form.adventurousness.label')}
              value={value}
              onChange={onChange}
              options={ADVENTUROUSNESS_OPTIONS.map((option) => option)}
              groupByName={adventurousnessGroupByName}
              getOptionLabel={(option) => t(ADVENTUROUSNESS_LABEL_KEY_BY_VALUE[option] ?? option)}
              disabled={isSubmitting || loading}
              placeholder={t('generator.form.adventurousness.placeholder')}
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
            {t('generator.form.actions.randomizeInputs')}
          </Button>
          <Button
            variant="contained"
            type="submit"
            form="generator-form"
            disabled={isSubmitting || loading || Object.keys(errors).length > 0}
            fullWidth
          >
            {loading
              ? t('generator.form.actions.generating')
              : t('generator.form.actions.generateIdeas')}
          </Button>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      </Stack>
    </Card>
  );
}
