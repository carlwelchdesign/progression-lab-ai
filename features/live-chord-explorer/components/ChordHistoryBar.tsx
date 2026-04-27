'use client';

import { Box, Chip, Stack, Typography } from '@mui/material';

type Props = {
  history: string[];
  currentAnchor: string | null;
};

export default function ChordHistoryBar({ history, currentAnchor }: Props) {
  const visible = history.slice(-6);
  if (visible.length === 0) return null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{ overflow: 'auto', flexWrap: 'nowrap', minWidth: 0, py: 0.25 }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', flexShrink: 0, fontSize: '0.65rem', mr: 0.25 }}
      >
        Recent:
      </Typography>
      {visible.map((chord, i) => (
        <Box key={`${chord}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {i > 0 && (
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', flexShrink: 0, lineHeight: 1 }}
            >
              →
            </Typography>
          )}
          <Chip
            label={chord}
            size="small"
            variant={chord === currentAnchor ? 'filled' : 'outlined'}
            sx={{
              fontSize: '0.62rem',
              height: 18,
              '& .MuiChip-label': { px: 0.75 },
              ...(chord === currentAnchor
                ? {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderColor: 'primary.main',
                  }
                : { color: 'text.secondary', borderColor: 'divider' }),
            }}
          />
        </Box>
      ))}
    </Stack>
  );
}
