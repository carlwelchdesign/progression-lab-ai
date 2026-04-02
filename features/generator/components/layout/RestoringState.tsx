'use client';

import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

import GeneratorHeader from './GeneratorHeader';

/**
 * Placeholder screen shown while session state is being restored.
 * Renders a skeleton that mirrors the GeneratorFormCard layout so the
 * page shape is visible before content arrives.
 */
export default function RestoringState() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Restoring your last generator session">
      <GeneratorHeader />

      {/* Form card skeleton – mirrors the GeneratorFormCard 2-column grid */}
      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {/* Six autocomplete / text fields */}
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={56} animation="wave" />
            ))}

            {/* Advanced options accordion (collapsed) */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Skeleton variant="rounded" height={44} animation="wave" />
            </Box>
          </Box>

          {/* Action buttons row */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Skeleton variant="rounded" height={36} animation="wave" sx={{ flex: 1 }} />
            <Skeleton variant="rounded" height={36} animation="wave" sx={{ flex: 1 }} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
