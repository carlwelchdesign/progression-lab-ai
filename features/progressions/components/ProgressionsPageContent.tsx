'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import ProgressionCard from './ProgressionCard';
import TextField from '../../../components/ui/TextField';
import {
  deleteProgression,
  getMyProgressions,
  getPublicProgressions,
} from '../api/progressionsApi';
import type { AudioInstrument } from '../../../domain/audio/audio';
import {
  getChordChipSx,
  getTagChipSx,
  PRESET_TAG_OPTIONS,
  sanitizeTags,
} from '../../../lib/tagMetadata';
import { CHORD_OPTIONS } from '../../../lib/formOptions';
import type { Progression } from '../../../lib/types';
import { useAuth } from '../../../components/providers/AuthProvider';
import { useAuthModal } from '../../../components/providers/AuthModalProvider';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';

type ViewMode = 'mine' | 'public';

type FilterFormData = {
  tagQuery: string[];
  keyQuery: string[];
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : (error as { name?: string })?.name === 'AbortError';
}

function getFirstChordName(progression: Progression): string {
  const firstChord = progression.chords?.[0] as { name?: string } | string | undefined;

  if (typeof firstChord === 'string') {
    return firstChord;
  }

  if (firstChord && typeof firstChord === 'object') {
    return firstChord.name ?? '';
  }

  return '';
}

export default function ProgressionsPageContent() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const isAdmin = user?.role === 'ADMIN';
  const initialViewParam = searchParams.get('view');
  const initialViewMode: ViewMode = initialViewParam === 'public' ? 'public' : 'mine';
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [myProgressions, setMyProgressions] = useState<Progression[]>([]);
  const [publicProgressions, setPublicProgressions] = useState<Progression[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProgressionId, setDeletingProgressionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [instrument] = useState<AudioInstrument>('piano');
  const [canExportMidi, setCanExportMidi] = useState(false);
  const [canExportPdf, setCanExportPdf] = useState(false);
  const { showError, showSuccess } = useAppSnackbar();

  useEffect(() => {
    if (!isAuthenticated) {
      setCanExportMidi(false);
      setCanExportPdf(false);
      return;
    }
    const controller = new AbortController();
    fetch('/api/billing/status', { credentials: 'include', signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const body = (await res.json()) as {
          entitlements?: { canExportMidi?: boolean; canExportPdf?: boolean };
        };
        setCanExportMidi(body.entitlements?.canExportMidi ?? false);
        setCanExportPdf(body.entitlements?.canExportPdf ?? false);
      })
      .catch(() => {
        /* silently ignore — export buttons will remain disabled */
      });
    return () => controller.abort();
  }, [isAuthenticated]);

  const { control, setValue, watch } = useForm<FilterFormData>({
    defaultValues: {
      tagQuery: [],
      keyQuery: [],
    },
  });

  const tagQuery = watch('tagQuery');
  const keyQuery = watch('keyQuery');

  const allTagOptions = useMemo(() => {
    const savedTags = myProgressions.flatMap((progression) => progression.tags);
    const publicTags = publicProgressions.flatMap((progression) => progression.tags);
    return sanitizeTags([...PRESET_TAG_OPTIONS, ...savedTags, ...publicTags]);
  }, [myProgressions, publicProgressions]);

  const keyOptions = useMemo(() => {
    const allProgressions = [...myProgressions, ...publicProgressions];
    const observedKeys = allProgressions
      .map((progression) => getFirstChordName(progression).trim())
      .filter(Boolean);

    return sanitizeTags([...CHORD_OPTIONS, ...observedKeys]);
  }, [myProgressions, publicProgressions]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMyProgressions([]);
      return;
    }

    const controller = new AbortController();

    const loadMyProgressions = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getMyProgressions(controller.signal);
        setMyProgressions(data);
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }

        const message = (err as Error).message || t('progressions.errors.loadMine');
        setError(message);
        showError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadMyProgressions();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, showError, t]);

  useEffect(() => {
    if (viewMode !== 'public') {
      return;
    }

    const controller = new AbortController();

    const loadPublicProgressions = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getPublicProgressions(
          { tags: tagQuery, keys: keyQuery },
          controller.signal,
        );
        setPublicProgressions(data);
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }

        const message = (err as Error).message || t('progressions.errors.loadPublic');
        setError(message);
        showError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPublicProgressions();

    return () => {
      controller.abort();
    };
  }, [viewMode, tagQuery, keyQuery, showError, t]);

  const filteredMyProgressions = useMemo(() => {
    const normalizedTagQueries = sanitizeTags(tagQuery)
      .map((tag) => tag.toLowerCase())
      .filter(Boolean);
    const normalizedKeyQueries = keyQuery.map((key) => key.trim().toLowerCase()).filter(Boolean);

    return myProgressions.filter((progression) => {
      const matchesTag =
        normalizedTagQueries.length === 0 ||
        normalizedTagQueries.some((query) =>
          progression.tags.some((tag) => tag.toLowerCase().includes(query)),
        );

      const firstChordName = getFirstChordName(progression).trim().toLowerCase();
      const matchesKey =
        normalizedKeyQueries.length === 0 ||
        normalizedKeyQueries.some((query) => firstChordName.startsWith(query));

      return matchesTag && matchesKey;
    });
  }, [myProgressions, tagQuery, keyQuery]);

  const displayedProgressions = viewMode === 'mine' ? filteredMyProgressions : publicProgressions;
  const hasActiveFilters = tagQuery.length > 0 || keyQuery.length > 0;

  const handleClearFilters = () => {
    setValue('tagQuery', []);
    setValue('keyQuery', []);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('progressions.confirm.delete'))) {
      return;
    }

    try {
      setDeletingProgressionId(id);
      await deleteProgression(id);

      // Optimistically remove from local state so the card disappears immediately.
      setMyProgressions((prev) => prev.filter((p) => p.id !== id));
      setPublicProgressions((prev) => prev.filter((p) => p.id !== id));

      // Re-sync the active list so UI state matches server state.
      if (viewMode === 'public') {
        const refreshedPublic = await getPublicProgressions({ tags: tagQuery, keys: keyQuery });
        setPublicProgressions(refreshedPublic);
      } else {
        const refreshedMine = await getMyProgressions();
        setMyProgressions(refreshedMine);
      }

      showSuccess(t('progressions.messages.deleted'));
    } catch (err) {
      const message = (err as Error).message || t('progressions.errors.delete');
      setError(message);
      showError(message);
    } finally {
      setDeletingProgressionId(null);
    }
  };

  const handleOpen = (progression: Progression) => {
    sessionStorage.setItem('loadedProgression', JSON.stringify(progression));
    router.push('/');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              {viewMode === 'mine'
                ? t('progressions.page.myProgressionsTitle')
                : t('progressions.page.examplesTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {viewMode === 'mine'
                ? t('progressions.page.myProgressionsDescription')
                : t('progressions.page.examplesDescription')}
            </Typography>
          </Box>
          <Link href="/" passHref>
            <Button variant="contained" startIcon={<AddIcon />}>
              {t('progressions.actions.createNew')}
            </Button>
          </Link>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Stack direction="row" spacing={1}>
            <Button
              variant={viewMode === 'mine' ? 'contained' : 'outlined'}
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal({
                    mode: 'register',
                    reason: 'my-progressions',
                    onSuccess: () => setViewMode('mine'),
                  });
                  return;
                }

                setViewMode('mine');
              }}
            >
              {t('progressions.page.myProgressionsTitle')}
            </Button>
            <Button
              variant={viewMode === 'public' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('public')}
            >
              {t('progressions.page.examplesTitle')}
            </Button>
            <Button variant="text" onClick={handleClearFilters} disabled={!hasActiveFilters}>
              {t('progressions.actions.clearFilters')}
            </Button>
          </Stack>

          <Box
            sx={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 1,
            }}
          >
            <Box sx={{ mb: { xs: 1, md: 0 } }}>
              <Controller
                name="tagQuery"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete<string, true, false, true>
                    multiple
                    freeSolo
                    options={allTagOptions}
                    value={value ?? []}
                    onChange={(_, newValue) => onChange(sanitizeTags(newValue))}
                    filterSelectedOptions
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            variant="filled"
                            sx={getTagChipSx(option)}
                            {...tagProps}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('progressions.filters.searchTagsLabel')}
                        InputLabelProps={{ shrink: true }}
                        placeholder={
                          value.length === 0 ? t('progressions.filters.searchTagsPlaceholder') : ''
                        }
                      />
                    )}
                  />
                )}
              />
            </Box>
            <Controller
              name="keyQuery"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete<string, true, false, true>
                  multiple
                  freeSolo
                  options={keyOptions}
                  value={value ?? []}
                  onChange={(_, newValue) =>
                    onChange(
                      sanitizeTags(
                        newValue.map((key) => key.trim()).filter((key) => key.length > 0),
                      ),
                    )
                  }
                  filterSelectedOptions
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option}
                          size="small"
                          variant="filled"
                          sx={getChordChipSx(option)}
                          {...tagProps}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('progressions.filters.searchKeyLabel')}
                      InputLabelProps={{ shrink: true }}
                      placeholder={
                        value.length === 0 ? t('progressions.filters.searchKeyPlaceholder') : ''
                      }
                    />
                  )}
                />
              )}
            />
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading && (
          <Stack spacing={1.25} sx={{ py: 2 }}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
          </Stack>
        )}

        {!loading && displayedProgressions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {viewMode === 'mine'
                ? t('progressions.empty.mine')
                : t('progressions.empty.public')}
            </Typography>
            <Link href="/" passHref>
              <Button variant="contained">{t('progressions.actions.createProgression')}</Button>
            </Link>
          </Box>
        )}

        {!loading && displayedProgressions.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md:
                  viewMode === 'public' ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
              },
              gridAutoRows: '1fr',
              alignItems: 'stretch',
              gap: 2,
            }}
          >
            {displayedProgressions.map((progression) => (
              <ProgressionCard
                key={progression.id}
                progression={progression}
                onDelete={viewMode === 'mine' || isAdmin ? handleDelete : undefined}
                onOpen={handleOpen}
                canEdit={false}
                canDelete={viewMode === 'mine' || isAdmin}
                canExportMidi={viewMode === 'mine' && canExportMidi}
                canExportPdf={viewMode === 'mine' && canExportPdf}
                isDeleting={deletingProgressionId === progression.id}
                instrument={instrument}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
