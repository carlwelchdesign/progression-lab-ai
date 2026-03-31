'use client';

import { Box, Button, Stack, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSampleProgressionsByPersona } from '../../../lib/sampleContent';
import { trackEvent } from '../../../lib/analytics';

type Persona = 'beginner' | 'intermediate' | 'professional';

interface OnboardingSampleSelectorProps {
  onPersonaSelect: (persona: Persona) => void;
  onSkip?: () => void;
}

export default function OnboardingSampleSelector({
  onPersonaSelect,
  onSkip,
}: OnboardingSampleSelectorProps) {
  const { t } = useTranslation();
  const [selectedPersona, setSelectedPersona] = useState<Persona>('beginner');

  const personaDescriptions = {
    beginner: t('onboarding:beginner_description'),
    intermediate: t('onboarding:intermediate_description'),
    professional: t('onboarding:professional_description'),
  };

  const samples = getSampleProgressionsByPersona(selectedPersona);

  const handlePersonaChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPersona: Persona | null,
  ) => {
    if (newPersona) {
      setSelectedPersona(newPersona);
    }
  };

  const handleSelect = useCallback(() => {
    trackEvent('onboarding_persona_selected', {
      persona: selectedPersona,
    });
    onPersonaSelect(selectedPersona);
  }, [selectedPersona, onPersonaSelect]);

  const handleSkip = useCallback(() => {
    trackEvent('onboarding_persona_skipped', {});
    if (onSkip) onSkip();
  }, [onSkip]);

  return (
    <Stack spacing={4} sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          {t('onboarding:select_your_level')}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, mb: 3 }}>
          {t('onboarding:level_description')}
        </Typography>
      </Box>

      <ToggleButtonGroup
        value={selectedPersona}
        exclusive
        onChange={handlePersonaChange}
        fullWidth
        sx={{
          '& .MuiToggleButton-root': {
            py: 2,
            textTransform: 'capitalize',
          },
        }}
      >
        <ToggleButton value="beginner">{t('common:beginner')}</ToggleButton>
        <ToggleButton value="intermediate">{t('common:intermediate')}</ToggleButton>
        <ToggleButton value="professional">{t('common:professional')}</ToggleButton>
      </ToggleButtonGroup>

      <Box>
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>
          {personaDescriptions[selectedPersona]}
        </Typography>
      </Box>

      {samples.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            {t('onboarding:sample_progressions')}
          </Typography>
          <Stack spacing={1}>
            {samples.slice(0, 2).map((sample) => (
              <Typography key={sample.name} variant="body2" sx={{ opacity: 0.75 }}>
                • {sample.name}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      <Stack direction="row" spacing={2}>
        <Button variant="contained" fullWidth onClick={handleSelect}>
          {t('onboarding:continue')}
        </Button>
        <Button variant="outlined" fullWidth onClick={handleSkip}>
          {t('common:skip')}
        </Button>
      </Stack>
    </Stack>
  );
}
