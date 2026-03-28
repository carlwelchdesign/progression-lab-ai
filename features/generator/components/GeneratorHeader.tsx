'use client';

import Image from 'next/image';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Top-of-page branding and short generator description.
 */
export default function GeneratorHeader() {
  const { t } = useTranslation();

  return (
    <Box id="generator">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Image src="/icon.png" alt="ProgressionLab.AI logo" width={48} height={48} />
        <Typography variant="h3" component="h1">
          ProgressionLab
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary">
        {t('generator.header.description')}
      </Typography>
    </Box>
  );
}
