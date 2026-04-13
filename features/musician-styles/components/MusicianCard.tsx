'use client';

import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import type { MusicianProfileSummary } from '../types';

type Props = {
  musician: MusicianProfileSummary;
  onClick: () => void;
};

export default function MusicianCard({ musician, onClick }: Props) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MusicNoteIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                  {musician.displayName}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {musician.genre} · {musician.era}
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {musician.tagline}
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {musician.signatureTechniques.slice(0, 3).map((t) => (
                <Chip key={t} label={t} size="small" variant="outlined" />
              ))}
            </Stack>

            <Typography variant="caption" color="text.disabled">
              Keys: {musician.preferredKeys.join(', ')}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
