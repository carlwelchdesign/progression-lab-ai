'use client';

import { Box, Container, Stack, Typography, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GeneratorPageContent from '../../generator/components/layout/GeneratorPageContent';
import { fetchPublishedMarketingContent } from '../../../lib/marketingContentClient';
import type { MarketingContentVersion } from '../../../admin-dashboard/components/admin/types';

type HomePageSections = {
  hero?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  proofStrip?: {
    items?: string[];
  };
  howItWorks?: {
    title?: string;
    steps?: string[];
  };
};

export default function HomePageLayout() {
  const { i18n } = useTranslation();
  const [sections, setSections] = useState<HomePageSections | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomepageSections = async () => {
      try {
        setIsLoading(true);
        const content = await fetchPublishedMarketingContent('homepage', i18n.language);
        if (content) {
          const typedContent = content as Record<string, unknown>;
          setSections({
            hero: typedContent.hero as HomePageSections['hero'] | undefined,
            proofStrip: typedContent.proofStrip as HomePageSections['proofStrip'] | undefined,
            howItWorks: typedContent.howItWorks as HomePageSections['howItWorks'] | undefined,
          });
        }
      } catch (error) {
        console.error('Failed to load homepage marketing sections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomepageSections();
  }, [i18n.language]);

  return (
    <Box>
      {/* Hero Section */}
      {sections?.hero && (
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ py: { xs: 4, md: 6 }, textAlign: 'center' }}>
            {sections.hero.eyebrow && (
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.875rem',
                  letterSpacing: 1,
                  opacity: 0.7,
                  fontWeight: 600,
                }}
              >
                {sections.hero.eyebrow}
              </Typography>
            )}
            {sections.hero.title && (
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {sections.hero.title}
              </Typography>
            )}
            {sections.hero.description && (
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.1rem',
                  opacity: 0.85,
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                {sections.hero.description}
              </Typography>
            )}
          </Stack>
        </Container>
      )}

      {/* Proof Strip */}
      {sections?.proofStrip?.items && sections.proofStrip.items.length > 0 && (
        <Box
          sx={{
            py: { xs: 3, md: 4 },
            bgcolor: 'background.paper',
            borderY: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg">
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0.75,
                flexWrap: 'wrap',
              }}
            >
              {sections.proofStrip.items.map((item, idx) => (
                <Typography key={idx} variant="body2" sx={{ fontWeight: 500 }}>
                  {item}
                  {idx < sections.proofStrip!.items!.length - 1 && (
                    <span style={{ margin: '0 1rem', opacity: 0.3 }}>•</span>
                  )}
                </Typography>
              ))}
            </Stack>
          </Container>
        </Box>
      )}

      {/* How It Works Section */}
      {sections?.howItWorks && (
        <Container maxWidth="lg">
          <Stack spacing={4} sx={{ py: { xs: 4, md: 6 } }}>
            {sections.howItWorks.title && (
              <Typography
                variant="h3"
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {sections.howItWorks.title}
              </Typography>
            )}
            {sections.howItWorks.steps && sections.howItWorks.steps.length > 0 && (
              <Stack spacing={2}>
                {sections.howItWorks.steps.map((step, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      gap: 3,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        fontWeight: 600,
                        flexShrink: 0,
                        fontSize: '0.875rem',
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        pt: 1,
                        lineHeight: 1.6,
                      }}
                    >
                      {step}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </Container>
      )}

      {/* Generator Section */}
      <Box sx={{ py: { xs: 2, md: 4 } }}>
        <GeneratorPageContent />
      </Box>
    </Box>
  );
}
