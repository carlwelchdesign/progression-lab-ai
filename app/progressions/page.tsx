'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

import ProgressionCard from '../../components/ProgressionCard';
import TextField from '../../components/ui/TextField';
import {
  deleteProgression,
  getMyProgressions,
  getPublicProgressions,
} from '../../lib/api/progressions';
import {
  getChordChipSx,
  getTagChipSx,
  PRESET_TAG_OPTIONS,
  sanitizeTags,
} from '../../lib/tagMetadata';
import { CHORD_OPTIONS } from '../../lib/formOptions';
import type { Progression } from '../../lib/types';

type ViewMode = 'mine' | 'public';

type FilterFormData = {
  tagQuery: string[];
  keyQuery: string[];
};

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

export default function MyProgressionsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('mine');
  const [myProgressions, setMyProgressions] = useState<Progression[]>([]);
  const [publicProgressions, setPublicProgressions] = useState<Progression[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProgressionId, setDeletingProgressionId] = useState<string | null>(null);
  const [error, setError] = useState('');

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
    const loadMyProgressions = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getMyProgressions();
        setMyProgressions(data);
      } catch (err) {
        const message = (err as Error).message || 'Failed to load progressions';
        if (message.toLowerCase().includes('unauthorized')) {
          router.replace('/auth');
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadMyProgressions();
  }, [router]);

  useEffect(() => {
    if (viewMode !== 'public') {
      return;
    }

    const loadPublicProgressions = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getPublicProgressions({ tags: tagQuery, keys: keyQuery });
        setPublicProgressions(data);
      } catch (err) {
        setError((err as Error).message || 'Failed to load public progressions');
      } finally {
        setLoading(false);
      }
    };

    loadPublicProgressions();
  }, [viewMode, tagQuery, keyQuery]);

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
    if (!window.confirm('Are you sure you want to delete this progression?')) {
      return;
    }

    try {
      setDeletingProgressionId(id);
      await deleteProgression(id);
      setMyProgressions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError((err as Error).message || 'Failed to delete progression');
    } finally {
      setDeletingProgressionId(null);
    }
  };

  const handleOpen = (progression: Progression) => {
    // Store in sessionStorage and navigate to lab
    sessionStorage.setItem('loadedProgression', JSON.stringify(progression));
    router.push('/');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              {viewMode === 'mine' ? 'My Progressions' : 'Public Progressions'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {viewMode === 'mine'
                ? 'View, edit, and share your saved chord progressions'
                : 'Explore community-shared chord progressions'}
            </Typography>
          </Box>
          <Link href="/" passHref>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create New
            </Button>
          </Link>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Stack direction="row" spacing={1}>
            <Button
              variant={viewMode === 'mine' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('mine')}
            >
              My Progressions
            </Button>
            <Button
              variant={viewMode === 'public' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('public')}
            >
              Public
            </Button>
            <Button variant="text" onClick={handleClearFilters} disabled={!hasActiveFilters}>
              Clear Filters
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
                        label="Search tags"
                        InputLabelProps={{ shrink: true }}
                        placeholder={value.length === 0 ? 'house, cinematic, jazz...' : ''}
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
                      label="Search key/Chord(s)"
                      InputLabelProps={{ shrink: true }}
                      placeholder={value.length === 0 ? 'C, F#m, Bb...' : ''}
                    />
                  )}
                />
              )}
            />
          </Box>
        </Stack>

        {/* Error alert */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty state */}
        {!loading && displayedProgressions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {viewMode === 'mine'
                ? "You haven't saved any progressions yet."
                : 'No public progressions match your filters yet.'}
            </Typography>
            <Link href="/" passHref>
              <Button variant="contained">Create a progression</Button>
            </Link>
          </Box>
        )}

        {/* Progressions grid */}
        {!loading && displayedProgressions.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: viewMode === 'public' ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
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
                onDelete={viewMode === 'mine' ? handleDelete : undefined}
                onOpen={handleOpen}
                canEdit={false}
                canDelete={viewMode === 'mine'}
                isDeleting={deletingProgressionId === progression.id}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
