'use client';

import { Chip, Stack } from '@mui/material';

type Props = {
  scales: string[];
};

export default function ScaleBadgeList({ scales }: Props) {
  if (scales.length === 0) return null;

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
      {scales.map((scale) => (
        <Chip
          key={scale}
          label={scale}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.65rem',
            height: 20,
            color: 'text.secondary',
            borderColor: 'divider',
          }}
        />
      ))}
    </Stack>
  );
}
