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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import { fetchPublishedMarketingContent } from '../../../lib/marketingContentClient';
import { getSampleProgressionsByPersona, type UserPersona } from '../../../lib/sampleContent';
import { trackEvent } from '../../../lib/analytics';

type ViewMode = 'mine' | 'public';
type SortMode = 'trending' | 'recent' | 'oldest' | 'title' | 'chord_count';

type FilterFormData = {
  tagQuery: string[];
  keyQuery: string[];
};

type PublicProgressionsMarketingContent = {
  hero?: {
    title?: string;
    description?: string;
  };
  spotlight?: {
    title?: string;
    description?: string;
    maxItems?: number;
  };
  emptyState?: {
    description?: string;
    cta?: string;
  };
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

function getTrendingScore(progression: Progression): number {
  const now = Date.now();
  const updatedAt = new Date(progression.updatedAt).getTime();
  const ageHours = Math.max(0, (now - updatedAt) / (1000 * 60 * 60));
  const recencyBoost = Math.max(0, 96 - ageHours);
  const chordRichness = (progression.chords?.length ?? 0) * 4;
  const tagDepth = (progression.tags?.length ?? 0) * 2;
  const titleSignal = Math.min((progression.title?.trim().length ?? 0) / 10, 3);

  return recencyBoost + chordRichness + tagDepth + titleSignal;
}

export default function ProgressionsPageContent() {
  const { t, i18n } = useTranslation('common');
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
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [spotlightPersona, setSpotlightPersona] = useState<UserPersona>('beginner');
  const [canExportMidi, setCanExportMidi] = useState(false);
  const [canExportPdf, setCanExportPdf] = useState(false);
  const [marketingContent, setMarketingContent] =
    useState<PublicProgressionsMarketingContent | null>(null);
  const { showError, showSuccess } = useAppSnackbar();

  useEffect(() => {
    const loadMarketingContent = async () => {
      try {
        const item = await fetchPublishedMarketingContent('public_progressions', i18n.language);
        setMarketingContent((item?.content ?? null) as PublicProgressionsMarketingContent | null);
      } catch {
        setMarketingContent(null);
      }
    };

    void loadMarketingContent();
  }, [i18n.language]);

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
  const sortedDisplayedProgressions = useMemo(() => {
    const items = [...displayedProgressions];

    if (sortMode === 'trending') {
      items.sort((a, b) => getTrendingScore(b) - getTrendingScore(a));
      return items;
    }

    if (sortMode === 'title') {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      return items;
    }

    if (sortMode === 'chord_count') {
      items.sort((a, b) => (b.chords?.length ?? 0) - (a.chords?.length ?? 0));
      return items;
    }

    if (sortMode === 'oldest') {
      items.sort((a, b) => +new Date(a.updatedAt) - +new Date(b.updatedAt));
      return items;
    }

    items.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return items;
  }, [displayedProgressions, sortMode]);

  const spotlightSamples = useMemo(
    () => getSampleProgressionsByPersona(spotlightPersona),
    [spotlightPersona],
  );

  const hasActiveFilters = tagQuery.length > 0 || keyQuery.length > 0;
  const isPublicRefresh = viewMode === 'public' && loading && publicProgressions.length > 0;
  const showInitialLoadingSkeleton = loading && !isPublicRefresh;

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
    trackEvent('cms_cta_clicked', {
      surface: 'progressions',
      mode: viewMode,
      action: 'open_progression',
      progressionId: progression.id,
    });
    sessionStorage.setItem('loadedProgression', JSON.stringify(progression));
    router.push('/');
  };

  const handleSampleOpen = (sample: { name: string; chords: string }) => {
    trackEvent('sample_content_selected', {
      surface: 'public_progressions',
      persona: spotlightPersona,
      sampleName: sample.name,
    });
    sessionStorage.setItem('onboarding_seed_chords', sample.chords);
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
                : marketingContent?.hero?.title?.trim() || t('progressions.page.examplesTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {viewMode === 'mine'
                ? t('progressions.page.myProgressionsDescription')
                : marketingContent?.hero?.description?.trim() ||
                  t('progressions.page.examplesDescription')}
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

                trackEvent('cms_cta_clicked', {
                  surface: 'progressions',
                  action: 'switch_mode',
                  mode: 'mine',
                });
                setViewMode('mine');
              }}
            >
              {t('progressions.page.myProgressionsTitle')}
            </Button>
            <Button
              variant={viewMode === 'public' ? 'contained' : 'outlined'}
              onClick={() => {
                trackEvent('cms_cta_clicked', {
                  surface: 'progressions',
                  action: 'switch_mode',
                  mode: 'public',
                });
                setViewMode('public');
              }}
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

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {t('progressions.page.resultSummary', {
              defaultValue: '{{count}} progressions found',
              count: sortedDisplayedProgressions.length,
            })}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="progressions-sort-label">
              {t('progressions.filters.sortBy', { defaultValue: 'Sort by' })}
            </InputLabel>
            <Select
              labelId="progressions-sort-label"
              value={sortMode}
              label={t('progressions.filters.sortBy', { defaultValue: 'Sort by' })}
              onChange={(event) => {
                const nextSort = event.target.value as SortMode;
                setSortMode(nextSort);
                trackEvent('cms_section_viewed', {
                  surface: 'public_progressions',
                  section: 'sort_control',
                  sort: nextSort,
                });
              }}
            >
              <MenuItem value="trending">
                {t('progressions.filters.sortTrending', { defaultValue: 'Trending now' })}
              </MenuItem>
              <MenuItem value="recent">
                {t('progressions.filters.sortRecent', { defaultValue: 'Recently updated' })}
              </MenuItem>
              <MenuItem value="oldest">
                {t('progressions.filters.sortOldest', { defaultValue: 'Oldest updated' })}
              </MenuItem>
              <MenuItem value="title">
                {t('progressions.filters.sortTitle', { defaultValue: 'Title (A-Z)' })}
              </MenuItem>
              <MenuItem value="chord_count">
                {t('progressions.filters.sortChordCount', { defaultValue: 'Most chord-rich' })}
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {viewMode === 'public' && (
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">
                {marketingContent?.spotlight?.title?.trim() ||
                  t('progressions.page.spotlightTitle', {
                    defaultValue: 'Spotlight: curated starter progressions',
                  })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {marketingContent?.spotlight?.description?.trim() ||
                  t('progressions.page.spotlightDescription', {
                    defaultValue:
                      'Load a proven progression into the generator and iterate from a strong musical foundation.',
                  })}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {(['beginner', 'intermediate', 'professional'] as UserPersona[]).map((persona) => (
                  <Chip
                    key={persona}
                    clickable
                    color={spotlightPersona === persona ? 'primary' : 'default'}
                    label={t(persona)}
                    onClick={() => {
                      setSpotlightPersona(persona);
                      trackEvent('cms_section_viewed', {
                        surface: 'public_progressions',
                        section: 'spotlight_persona',
                        persona,
                      });
                    }}
                  />
                ))}
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                }}
              >
                {spotlightSamples
                  .slice(0, Math.max(1, marketingContent?.spotlight?.maxItems ?? 3))
                  .map((sample) => (
                    <Box
                      key={sample.name}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                      }}
                    >
                      <Typography variant="subtitle2">{sample.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {sample.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sample.chords}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSampleOpen(sample)}
                      >
                        {t('progressions.actions.loadSample', { defaultValue: 'Load sample' })}
                      </Button>
                    </Box>
                  ))}
              </Box>
            </Stack>
          </Box>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {isPublicRefresh ? (
          <Stack spacing={1} aria-live="polite" aria-busy>
            <Typography variant="body2" color="text.secondary">
              {t('progressions.loading.publicRefreshing', {
                defaultValue: 'Refreshing public progressions...',
              })}
            </Typography>
            <Skeleton variant="rounded" height={10} animation="wave" />
          </Stack>
        ) : null}

        {showInitialLoadingSkeleton ? (
          <Stack spacing={1.5} sx={{ py: 2 }} aria-live="polite" aria-busy>
            <Typography variant="body2" color="text.secondary">
              {viewMode === 'public'
                ? t('progressions.loading.publicInitial', {
                    defaultValue: 'Loading curated progressions and spotlight samples...',
                  })
                : t('progressions.loading.mine', {
                    defaultValue: 'Loading your saved progressions...',
                  })}
            </Typography>
            {viewMode === 'public' ? (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  }}
                >
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={`public-chip-${item}`} variant="rounded" height={32} />
                  ))}
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <Stack
                      key={`public-card-${item}`}
                      spacing={1}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}
                    >
                      <Skeleton variant="text" width="50%" height={28} />
                      <Skeleton variant="text" width="90%" />
                      <Skeleton variant="text" width="65%" />
                      <Skeleton variant="rounded" height={34} />
                    </Stack>
                  ))}
                </Box>
              </>
            ) : (
              <Stack spacing={1.25}>
                <Skeleton variant="rounded" height={64} />
                <Skeleton variant="rounded" height={64} />
                <Skeleton variant="rounded" height={64} />
              </Stack>
            )}
          </Stack>
        ) : null}

        {!loading && sortedDisplayedProgressions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {viewMode === 'mine'
                ? t('progressions.empty.mine')
                : marketingContent?.emptyState?.description?.trim() ||
                  t('progressions.empty.public')}
            </Typography>
            <Link href="/" passHref>
              <Button variant="contained">
                {viewMode === 'mine'
                  ? t('progressions.actions.createProgression')
                  : marketingContent?.emptyState?.cta?.trim() ||
                    t('progressions.actions.createProgression')}
              </Button>
            </Link>
          </Box>
        )}

        {sortedDisplayedProgressions.length > 0 && (!loading || isPublicRefresh) && (
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
            {sortedDisplayedProgressions.map((progression) => (
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
