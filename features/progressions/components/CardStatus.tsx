'use client';

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type CardStatusProps = {
  /** Primary status (e.g., "Public", "Private") */
  primary: ReactNode;
  /** Secondary status timestamp (optional) */
  secondary?: ReactNode;
};

/**
 * Reusable card status badge showing visibility/accessibility and timestamp.
 */
export default function CardStatus({ primary, secondary }: CardStatusProps) {
  return (
    <Typography variant="caption" color="text.secondary">
      {primary}
      {secondary && (
        <>
          {' • '}
          {secondary}
        </>
      )}
    </Typography>
  );
}
