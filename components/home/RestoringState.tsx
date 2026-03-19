'use client';

import { Box, CircularProgress, Stack, Typography } from '@mui/material';

import GeneratorHeader from './GeneratorHeader';

export default function RestoringState() {
  return (
    <Stack spacing={3}>
      <GeneratorHeader />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10,
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Restoring your last generator session...
        </Typography>
      </Box>
    </Stack>
  );
}
