'use client';

import { Box, Card, CardContent, Stack } from '@mui/material';
import type { ReactNode } from 'react';

type GenericCardProps = {
  /** Main content area (grows to fill available space) */
  content: ReactNode;
  /** Status/metadata section (below content) */
  status?: ReactNode;
  /** Action buttons fixed to bottom */
  actions: ReactNode;
};

/**
 * Reusable card layout with content, status, and action sections.
 * Suitable for progressions, patterns, templates, and other entities.
 */
export default function GenericCard({ content, status, actions }: GenericCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex' }}>
        <Stack sx={{ width: '100%', height: '100%' }}>
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            {content}
            {status}
          </Stack>

          {/* Actions container fixed to bottom */}
          <Box sx={{ pt: 1, mt: 'auto' }}>{actions}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
