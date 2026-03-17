'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

import ProgressionCard from '../../components/ProgressionCard';
import SaveProgressionDialog from '../../components/SaveProgressionDialog';
import {
  deleteProgression,
  getMyProgressions,
} from '../../lib/api/progressions';
import type { Progression } from '../../lib/types';

export default function MyProgressionsPage() {
  const [progressions, setProgressions] = useState<Progression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadProgressions();
  }, []);

  const loadProgressions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyProgressions();
      setProgressions(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load progressions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this progression?')) {
      return;
    }

    try {
      await deleteProgression(id);
      setProgressions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError((err as Error).message || 'Failed to delete progression');
    }
  };

  const handleOpen = (progression: Progression) => {
    // Store in sessionStorage and navigate to lab
    sessionStorage.setItem('loadedProgression', JSON.stringify(progression));
    window.location.href = '/';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              My Progressions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View, edit, and share your saved chord progressions
            </Typography>
          </Box>
          <Link href="/" passHref>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create New
            </Button>
          </Link>
        </Box>

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
        {!loading && progressions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {`You haven't saved any progressions yet.`}
            </Typography>
            <Link href="/" passHref>
              <Button variant="contained">Create your first progression</Button>
            </Link>
          </Box>
        )}

        {/* Progressions grid */}
        {!loading && progressions.length > 0 && (
          <Stack spacing={2}>
            {progressions.map((progression) => (
              <ProgressionCard
                key={progression.id}
                progression={progression}
                onDelete={handleDelete}
                onOpen={handleOpen}
                canEdit={false}
                canDelete={true}
              />
            ))}
          </Stack>
        )}
      </Stack>

      {/* Save dialog - not used in this page but keeping for consistency */}
      <SaveProgressionDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSuccess={loadProgressions}
        chords={[]}
      />
    </Container>
  );
}
