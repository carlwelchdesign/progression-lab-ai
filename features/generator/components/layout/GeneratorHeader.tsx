'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';

import { fetchPublishedMarketingContent } from '../../../../lib/marketingContentClient';

type HomepageMarketingContent = {
  hero?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    primaryCta?: string;
    secondaryCta?: string;
  };
  proofStrip?: {
    items?: string[];
  };
  howItWorks?: {
    title?: string;
    steps?: string[];
  };
};

/**
 * Top-of-page branding and short generator description.
 */
export default function GeneratorHeader() {
  const { t, i18n } = useTranslation('generator');
  const [marketingContent, setMarketingContent] = useState<HomepageMarketingContent | null>(null);

  useEffect(() => {
    const loadMarketingContent = async () => {
      try {
        const item = await fetchPublishedMarketingContent('homepage', i18n.language);
        setMarketingContent((item?.content ?? null) as HomepageMarketingContent | null);
      } catch {
        setMarketingContent(null);
      }
    };

    void loadMarketingContent();
  }, [i18n.language]);

  const heroEyebrow = marketingContent?.hero?.eyebrow?.trim() || '';
  const heroTitle = marketingContent?.hero?.title?.trim() || 'ProgressionLab';
  const heroDescription = marketingContent?.hero?.description?.trim() || t('header.description');
  const primaryCtaLabel = marketingContent?.hero?.primaryCta?.trim() || '';
  const secondaryCtaLabel = marketingContent?.hero?.secondaryCta?.trim() || '';
  const proofItems = useMemo(
    () =>
      (marketingContent?.proofStrip?.items ?? [])
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    [marketingContent],
  );
  const howItWorksTitle = marketingContent?.howItWorks?.title?.trim() || '';
  const howItWorksSteps = useMemo(
    () =>
      (marketingContent?.howItWorks?.steps ?? [])
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    [marketingContent],
  );

  return (
    <Box id="generator">
      {heroEyebrow ? (
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: '0.08em', display: 'inline-block', mb: 0.5 }}
        >
          {heroEyebrow}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Image src="/icon.png" alt="ProgressionLab.AI logo" width={48} height={48} />
        <Typography variant="h3" component="h1">
          {heroTitle}
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary">
        {heroDescription}
      </Typography>
      {primaryCtaLabel || secondaryCtaLabel ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          {primaryCtaLabel ? (
            <Button variant="contained" component={Link} href="/#generator-form">
              {primaryCtaLabel}
            </Button>
          ) : null}
          {secondaryCtaLabel ? (
            <Button variant="outlined" component={Link} href="/pricing">
              {secondaryCtaLabel}
            </Button>
          ) : null}
        </Stack>
      ) : null}
      {proofItems.length > 0 ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}
        >
          {proofItems.map((item) => (
            <Typography
              key={item}
              variant="caption"
              color="text.secondary"
              sx={{
                px: 1.25,
                py: 0.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 999,
                width: 'fit-content',
              }}
            >
              {item}
            </Typography>
          ))}
        </Stack>
      ) : null}
      {howItWorksTitle || howItWorksSteps.length > 0 ? (
        <Box sx={{ mt: 2.5 }}>
          {howItWorksTitle ? (
            <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.75 }}>
              {howItWorksTitle}
            </Typography>
          ) : null}
          {howItWorksSteps.map((step) => (
            <Typography key={step} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {step}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
