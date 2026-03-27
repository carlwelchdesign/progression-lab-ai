'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';

import ProgressionCard from '../../../features/progressions/components/ProgressionCard';
import { getSharedProgression } from '../../../features/progressions/api/progressionsApi';
import { playProgression } from '../../../domain/audio/audio';
import type { AudioInstrument } from '../../../domain/audio/audio';
import type { Progression } from '../../../lib/types';
import {
  getProgressionAutoResetMs,
  usePlaybackToggle,
} from '../../../features/generator/hooks/usePlaybackToggle';
import PlaybackToggleButton from '../../../features/generator/components/PlaybackToggleButton';

export default function SharedProgressionPage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params?.shareId as string;

  const [progression, setProgression] = useState<Progression | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [instrument] = useState<AudioInstrument>('piano');
  const { playingId, initializingId, handlePlayToggle } = usePlaybackToggle();

  const loadProgression = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSharedProgression(shareId);
      setProgression(data);
    } catch (err) {
      setError((err as Error).message || 'Progression not found');
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    if (!shareId) return;

    loadProgression();
  }, [shareId, loadProgression]);

  const handleOpen = () => {
    // Store in sessionStorage and navigate to lab
    sessionStorage.setItem('loadedProgression', JSON.stringify(progression));
    router.push('/');
  };

  const handlePlay = async () => {
    const currentProgression = progression;
    if (!currentProgression) {
      return;
    }

    const voicings = currentProgression.pianoVoicings;
    if (!voicings?.length) {
      return;
    }

    await handlePlayToggle(
      `shared-page-${currentProgression.id}`,
      () =>
        playProgression(voicings, undefined, undefined, undefined, undefined, {
          instrument,
        }),
      getProgressionAutoResetMs(voicings.length, 100),
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Link href="/" passHref>
            <Button variant="text">← Back to Lab</Button>
          </Link>
          <Typography variant="h3" component="h1" sx={{ mt: 2 }}>
            Shared Progression
          </Typography>
        </Box>

        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error state */}
        {!loading && error && (
          <Alert severity="error">
            <Typography sx={{ mb: 1 }}>{error}</Typography>
            <Link href="/" passHref>
              <Button variant="contained" size="small">
                Back to Lab
              </Button>
            </Link>
          </Alert>
        )}

        {/* Progression display */}
        {!loading && progression && (
          <Stack spacing={3}>
            <ProgressionCard
              progression={progression}
              canEdit={false}
              canDelete={false}
              onOpen={handleOpen}
              instrument={instrument}
            />

            {progression.pianoVoicings && progression.pianoVoicings.length > 0 ? (
              <Box sx={{ width: '100%' }}>
                <PlaybackToggleButton
                  playTitle="Play progression"
                  stopTitle="Stop progression"
                  isPlaying={playingId === `shared-page-${progression.id}`}
                  isInitializing={initializingId === `shared-page-${progression.id}`}
                  onClick={() => {
                    void handlePlay();
                  }}
                />
              </Box>
            ) : null}

            <Button
              variant="contained"
              size="large"
              startIcon={<OpenInNewIcon />}
              onClick={handleOpen}
              fullWidth
              sx={{ py: 2 }}
            >
              Load into Lab
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
