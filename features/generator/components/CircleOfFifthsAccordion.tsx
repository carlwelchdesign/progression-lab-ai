'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';

import type { CircleOfFifthsSuggestionMode } from '../../../domain/music/circleOfFifths';

type CircleOfFifthsAccordionProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  suggestionMode: CircleOfFifthsSuggestionMode;
  onSuggestionModeChange: (mode: CircleOfFifthsSuggestionMode) => void;
};

/**
 * Collapsible accordion containing the Circle of Fifths suggestion mode selector.
 * SRP: changes when the CoF suggestion UI or available modes change.
 */
export default function CircleOfFifthsAccordion({
  expanded,
  onExpandedChange,
  suggestionMode,
  onSuggestionModeChange,
}: CircleOfFifthsAccordionProps) {
  const { t } = useTranslation('generator');
  const theme = useTheme();
  const { appColors } = theme.palette;

  return (
    <Accordion
      disableGutters
      expanded={expanded}
      onChange={(_event, isExpanded) => onExpandedChange(isExpanded)}
      sx={{
        mt: 1.5,
        borderRadius: 1.5,
        bgcolor: appColors.surface.translucentPanel,
        border: `1px solid ${appColors.surface.translucentPanelBorder}`,
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-label={t('ui.chordGrid.suggestionModeAccordionLabel', {
          defaultValue: 'Suggestion modes',
        })}
        sx={{
          px: 1.25,
          minHeight: 0,
          '& .MuiAccordionSummary-content': { my: 1 },
        }}
      >
        <Typography variant="subtitle2">
          {t('ui.chordGrid.suggestionModeAccordionLabel', { defaultValue: 'Suggestion modes' })}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.25, pb: 1.25, pt: 0.25 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          fullWidth
          value={suggestionMode}
          onChange={(_event, mode: CircleOfFifthsSuggestionMode | null) => {
            if (mode) {
              onSuggestionModeChange(mode);
            }
          }}
          aria-label={t('ui.chordGrid.suggestionModeLabel', {
            defaultValue: 'Circle of 5ths suggestions',
          })}
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.72rem', sm: '0.8rem' },
              px: { xs: 0.75, sm: 1.25 },
              py: 0.7,
              whiteSpace: 'nowrap',
            },
          }}
        >
          <ToggleButton
            value="none"
            aria-label={t('ui.chordGrid.suggestionModeOff', { defaultValue: 'Off' })}
          >
            {t('ui.chordGrid.suggestionModeOff', { defaultValue: 'Off' })}
          </ToggleButton>
          <ToggleButton
            value="neighbors"
            aria-label={t('ui.chordGrid.suggestionModeCurrent', {
              defaultValue: 'Both directions',
            })}
          >
            {t('ui.chordGrid.suggestionModeCurrent', { defaultValue: 'Both directions' })}
          </ToggleButton>
          <ToggleButton
            value="clockwise"
            aria-label={t('ui.chordGrid.suggestionModeClockwise', {
              defaultValue: 'Dominant flow',
            })}
          >
            {t('ui.chordGrid.suggestionModeClockwise', { defaultValue: 'Dominant flow' })}
          </ToggleButton>
          <ToggleButton
            value="counterclockwise"
            aria-label={t('ui.chordGrid.suggestionModeCounterclockwise', {
              defaultValue: 'Subdominant flow',
            })}
          >
            {t('ui.chordGrid.suggestionModeCounterclockwise', {
              defaultValue: 'Subdominant flow',
            })}
          </ToggleButton>
        </ToggleButtonGroup>
      </AccordionDetails>
    </Accordion>
  );
}
