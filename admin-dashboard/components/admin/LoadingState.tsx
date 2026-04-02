'use client';

import { Container, Skeleton, Stack, Typography } from '@mui/material';

type LoadingStateProps = {
  message: string;
};

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Stack spacing={2} aria-live="polite" aria-busy>
        <Typography color="text.secondary">{message}</Typography>
        <Skeleton variant="rounded" height={10} animation="wave" />
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={56} animation="wave" />
          <Skeleton variant="rounded" height={56} animation="wave" />
        </Stack>
      </Stack>
    </Container>
  );
}
