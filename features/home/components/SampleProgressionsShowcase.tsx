'use client';

import { Box, Button, Container, Stack, Typography, Card, CardContent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { useAppSnackbar } from '../../../components/providers/AppSnackbarProvider';
import { getSampleProgressionsByPersona } from '../../../lib/sampleContent';
import { trackEvent } from '../../../lib/analytics';

export type SampleShowcaseVariant = 'homepage' | 'signup';

interface SampleProgressionsShowcaseProps {
  title?: string;
  description?: string;
  variant?: SampleShowcaseVariant;
  onSampleSelect?: (progression: string) => void;
  maxItemsDisplayed?: number;
}

export default function SampleProgressionsShowcase({
  title,
  description,
  variant = 'homepage',
  onSampleSelect,
  maxItemsDisplayed = 3,
}: SampleProgressionsShowcaseProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showSnackbar } = useAppSnackbar();

  // Detect user persona based on context or use beginner as default
  const personaForDisplay = useMemo(() => {
    // Could be extended to analyze user preferences/history
    return 'beginner';
  }, []);

  const samples = useMemo(() => {
    const allSamples = getSampleProgressionsByPersona(personaForDisplay);
    return allSamples.slice(0, maxItemsDisplayed);
  }, [personaForDisplay, maxItemsDisplayed]);

  const handleSampleSelect = useCallback(
    (progressionName: string) => {
      trackEvent('sample_progression_selected', {
        progression: progressionName,
        persona: personaForDisplay,
        source: variant,
      });

      if (onSampleSelect) {
        onSampleSelect(progressionName);
      } else {
        showSnackbar(t('common:sample_loaded', { name: progressionName }), 'info');
      }
    },
    [personaForDisplay, variant, onSampleSelect, t, showSnackbar],
  );

  const displayTitle = title || t('home:sample_progressions_title');
  const displayDescription = description || t('home:sample_progressions_description');

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        bgcolor: variant === 'signup' ? 'transparent' : 'background.paper',
        borderTop: variant === 'homepage' ? 1 : 0,
        borderColor: variant === 'homepage' ? 'divider' : 'transparent',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {displayTitle && (
            <Typography
              variant="h3"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {displayTitle}
            </Typography>
          )}

          {displayDescription && (
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                opacity: 0.85,
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              {displayDescription}
            </Typography>
          )}

          {samples.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: variant === 'signup' ? '1fr 1fr' : '1fr 1fr 1fr',
                  md: '1fr 1fr 1fr',
                },
                gap: 2,
                mt: 3,
              }}
            >
              {samples.map((sample, idx) => (
                <Card
                  key={idx}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => handleSampleSelect(sample.name)}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {sample.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.6,
                        opacity: 0.85,
                        mb: 2,
                      }}
                    >
                      {sample.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        display: 'block',
                        mb: 2,
                      }}
                    >
                      {t('common:chords')}: {sample.chords}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSampleSelect(sample.name);
                      }}
                    >
                      {t('home:try_progression')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {samples.length === 0 && (
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                opacity: 0.6,
              }}
            >
              {t('home:no_samples_available')}
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
