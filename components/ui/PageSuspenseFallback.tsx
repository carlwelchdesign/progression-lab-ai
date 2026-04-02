'use client';

import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type PageSuspenseFallbackProps = {
  message?: string;
  messageKey?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  padded?: boolean;
  variant?: 'default' | 'studio' | 'pricing' | 'account' | 'progressions' | 'sharedProgression';
};

export default function PageSuspenseFallback({
  message,
  messageKey,
  maxWidth = 'lg',
  padded = true,
  variant = 'default',
}: PageSuspenseFallbackProps) {
  const { t } = useTranslation('common');
  const resolvedMessage = messageKey ? t(messageKey) : (message ?? t('settings.loadingDefault'));
  const maxWidthPxBySize = {
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  } as const;
  const sectionSkeletonByVariant = {
    default: [56, 56, 56, 56],
    studio: [64, 120, 64],
    pricing: [88, 88, 88],
    account: [72, 72, 120],
    progressions: [88, 88, 88],
    sharedProgression: [56, 180, 56],
  } as const;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: `${maxWidthPxBySize[maxWidth]}px`,
        mx: 'auto',
        py: padded ? 6 : 0,
        '@keyframes suspenseShimmer': {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      }}
    >
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2.5} sx={{ py: 4 }} aria-live="polite" aria-busy>
            <Typography color="text.secondary">{resolvedMessage}</Typography>
            <Box
              sx={{
                height: 10,
                borderRadius: 999,
                bgcolor: 'action.hover',
                overflow: 'hidden',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  transform: 'translateX(-100%)',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                  animation: 'suspenseShimmer 1.4s ease-in-out infinite',
                },
              }}
            />
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: variant === 'studio' || variant === 'sharedProgression' ? '1fr' : '1fr 1fr',
                },
              }}
            >
              {sectionSkeletonByVariant[variant].map((height, item) => (
                <Skeleton key={item} variant="rounded" height={height} animation="wave" />
              ))}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
