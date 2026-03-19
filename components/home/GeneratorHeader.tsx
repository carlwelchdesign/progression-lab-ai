'use client';

import Image from 'next/image';
import { Box, Typography } from '@mui/material';

export default function GeneratorHeader() {
  return (
    <Box id="generator">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Image src="/icon.png" alt="ProgressionLab.AI logo" width={48} height={48} />
        <Typography variant="h3" component="h1">
          ProgressionLab
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary">
        Enter a few chords, a mood, and a mode. Get back progression ideas, structure suggestions,
        and simple guitar/piano diagrams.
      </Typography>
    </Box>
  );
}
