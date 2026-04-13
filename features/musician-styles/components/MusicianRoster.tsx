'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MusicianCard from './MusicianCard';
import type { MusicianProfileSummary } from '../types';

export default function MusicianRoster() {
  const router = useRouter();
  const [musicians, setMusicians] = useState<MusicianProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/musician-styles', { credentials: 'include' });
        if (res.ok) setMusicians((await res.json()) as MusicianProfileSummary[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <MusicNoteIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700}>
              Learn from the Greats
            </Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
            Pick a legendary musician and get a personalized AI-generated curriculum that teaches
            you to play in their style — their chords, their keys, their techniques.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : musicians.length === 0 ? (
          <Typography color="text.disabled">No musicians available yet.</Typography>
        ) : (
          <Grid container spacing={2}>
            {musicians.map((m) => (
              <Grid item xs={12} sm={6} key={m.id}>
                <MusicianCard musician={m} onClick={() => router.push(`/styles/${m.slug}`)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
