'use client';

import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type GeneratorSectionSuspenseFallbackProps = {
  label?: string;
  labelKey?: string;
  kind?: 'next' | 'progressions' | 'structure' | 'form';
};

function ChordCardSkeleton() {
  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
      }}
    >
      <Stack spacing={1.25}>
        <Skeleton variant="text" width="30%" height={30} />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rounded" height={68} />
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <Skeleton variant="rounded" height={30} />
          <Skeleton variant="rounded" height={30} />
          <Skeleton variant="rounded" height={30} />
        </Box>
      </Stack>
    </Box>
  );
}

function ProgressionCardSkeleton() {
  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
      }}
    >
      <Stack spacing={1.25}>
        <Skeleton variant="text" width="45%" height={28} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} variant="rounded" height={34} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={120} />
      </Stack>
    </Box>
  );
}

function StructureCardSkeleton() {
  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
      }}
    >
      <Stack spacing={1.25}>
        <Skeleton variant="text" width="50%" height={28} />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="80%" />
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <Skeleton variant="rounded" height={32} />
          <Skeleton variant="rounded" height={32} />
          <Skeleton variant="rounded" height={32} />
        </Box>
      </Stack>
    </Box>
  );
}

export default function GeneratorSectionSuspenseFallback({
  label,
  labelKey,
  kind = 'next',
}: GeneratorSectionSuspenseFallbackProps) {
  const { t } = useTranslation('generator');
  const resolvedLabel = labelKey ? t(labelKey) : (label ?? t('status.loadingSuggestions'));

  const cardsByKind = {
    form: [<ProgressionCardSkeleton key="form-1" />, <ChordCardSkeleton key="form-2" />],
    next: [<ChordCardSkeleton key="next-1" />, <ChordCardSkeleton key="next-2" />],
    progressions: [
      <ProgressionCardSkeleton key="prog-1" />,
      <ProgressionCardSkeleton key="prog-2" />,
    ],
    structure: [<StructureCardSkeleton key="struct-1" />, <StructureCardSkeleton key="struct-2" />],
  } as const;

  return (
    <Stack spacing={2} aria-live="polite" aria-busy>
      <Typography variant="body2" color="text.secondary">
        {resolvedLabel}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', md: kind === 'next' ? '1fr' : '1fr 1fr' },
        }}
      >
        {cardsByKind[kind]}
      </Box>
    </Stack>
  );
}
