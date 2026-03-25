import { Suspense } from 'react';
import { Card, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material';
import ProgressionsPageContent from '../../features/progressions/components/ProgressionsPageContent';

function ProgressionsPageFallback() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
            <Typography color="text.secondary">Loading progressions...</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function ProgressionsPage() {
  return (
    <Suspense fallback={<ProgressionsPageFallback />}>
      <ProgressionsPageContent />
    </Suspense>
  );
}
