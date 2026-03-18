'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

import ProgressionCard from '../../components/ProgressionCard';
import TextField from '../../components/ui/TextField';
import {
  deleteProgression,
  getMyProgressions,
  getPublicProgressions,
} from '../../lib/api/progressions';
import type { Progression } from '../../lib/types';

type ViewMode = 'mine' | 'public';

type FilterFormData = {
  tagQuery: string;
  keyQuery: string;
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
  const [error, setError] = useState('');

  const { control, watch } = useForm<FilterFormData>({
    defaultValues: {
      tagQuery: '',
      keyQuery: '',
    },
  });

  const tagQuery = watch('tagQuery');
  const keyQuery = watch('keyQuery');

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
        const data = await getPublicProgressions({ tag: tagQuery, key: keyQuery });
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
    const normalizedTagQuery = tagQuery.trim().toLowerCase();
    const normalizedKeyQuery = keyQuery.trim().toLowerCase();

    return myProgressions.filter((progression) => {
      const matchesTag =
        normalizedTagQuery.length === 0 ||
        progression.tags.some((tag) => tag.toLowerCase().includes(normalizedTagQuery));

      const firstChordName = getFirstChordName(progression).trim().toLowerCase();
      const matchesKey =
        normalizedKeyQuery.length === 0 || firstChordName.startsWith(normalizedKeyQuery);

      return matchesTag && matchesKey;
    });
  }, [myProgressions, tagQuery, keyQuery]);

  const displayedProgressions = viewMode === 'mine' ? filteredMyProgressions : publicProgressions;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this progression?')) {
      return;
    }

    try {
      await deleteProgression(id);
      setMyProgressions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError((err as Error).message || 'Failed to delete progression');
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
            <Controller
              name="tagQuery"
              control={control}
              render={({ field }) => (
                <TextField label="Search tags" {...field} placeholder="house, cinematic, jazz..." />
              )}
            />
            <Controller
              name="keyQuery"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Search key (first chord)"
                  {...field}
                  placeholder="C, F#m, Bb..."
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
                md: 'repeat(2, minmax(0, 1fr))',
              },
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
              />
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
