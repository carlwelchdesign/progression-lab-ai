'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import ProgressionCard from '../../../features/progressions/components/ProgressionCard';
import { getSharedProgression } from '../../../features/progressions/api/progressionsApi';
import { playProgression } from '../../../domain/audio/audio';
import type { AudioInstrument } from '../../../domain/audio/audio';
import type { Progression } from '../../../lib/types';
import {
  getProgressionAutoResetMs,
  usePlaybackToggle,
} from '../../../features/generator/hooks/usePlaybackToggle';
import PlaybackToggleButton from '../../../features/generator/components/playback/PlaybackToggleButton';
import PageSuspenseFallback from '../../../components/ui/PageSuspenseFallback';

type SharedProgressionResource = {
  read: () => Progression;
};

const sharedProgressionResourceCache = new Map<string, SharedProgressionResource>();

function createSharedProgressionResource(shareId: string): SharedProgressionResource {
  let status: 'pending' | 'success' | 'error' = 'pending';
  let result: Progression | Error;

  const suspender = getSharedProgression(shareId).then(
    (data) => {
      status = 'success';
      result = data;
    },
    (err) => {
      status = 'error';
      result = err instanceof Error ? err : new Error('Progression not found');
    },
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      }
      if (status === 'error') {
        throw result;
      }
      return result as Progression;
    },
  };
}

function getSharedProgressionResource(shareId: string): SharedProgressionResource {
  const existing = sharedProgressionResourceCache.get(shareId);
  if (existing) {
    return existing;
  }

  const created = createSharedProgressionResource(shareId);
  sharedProgressionResourceCache.set(shareId, created);
  return created;
}

function SharedProgressionContent({ shareId }: { shareId: string }) {
  const { t } = useTranslation('common');
  const progression = getSharedProgressionResource(shareId).read();
  const router = useRouter();
  const instrument: AudioInstrument = 'piano';
  const { playingId, initializingId, handlePlayToggle } = usePlaybackToggle();

  const handleOpen = () => {
    sessionStorage.setItem('loadedProgression', JSON.stringify(progression));
    router.push('/');
  };

  const handlePlay = async () => {
    const voicings = progression.pianoVoicings;
    if (!voicings?.length) {
      return;
    }

    await handlePlayToggle(
      `shared-page-${progression.id}`,
      () =>
        playProgression(voicings, undefined, undefined, undefined, undefined, {
          instrument,
        }),
      getProgressionAutoResetMs(voicings.length, 100),
    );
  };

  return (
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
            playTitle={t('sharedProgression.actions.play')}
            stopTitle={t('sharedProgression.actions.stop')}
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
        {t('sharedProgression.actions.loadIntoLab')}
      </Button>
    </Stack>
  );
}

export default function SharedProgressionPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const shareId = params?.shareId as string;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box>
          <Link href="/" passHref>
            <Button variant="text">{t('sharedProgression.actions.backToLab')}</Button>
          </Link>
          <Typography variant="h3" component="h1" sx={{ mt: 2 }}>
            {t('sharedProgression.title')}
          </Typography>
        </Box>
        <Suspense
          fallback={
            <PageSuspenseFallback
              messageKey="sharedProgression.loading"
              maxWidth="lg"
              padded={false}
              variant="sharedProgression"
            />
          }
        >
          <SharedProgressionContent shareId={shareId} />
        </Suspense>
      </Stack>
    </Container>
  );
}
