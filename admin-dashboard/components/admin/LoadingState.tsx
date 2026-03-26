'use client';

import { CircularProgress, Container, Stack, Typography } from '@mui/material';

type LoadingStateProps = {
  message: string;
};

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography color="text.secondary">{message}</Typography>
      </Stack>
    </Container>
  );
}
