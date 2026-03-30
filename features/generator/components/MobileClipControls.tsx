'use client';

import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useTranslation } from 'react-i18next';

type MobileClipControlsProps = {
  selectedStepIndex: number;
  selectedStepEventCount: number;
  totalSteps: number;
  onNudgeLeft: () => void;
  onNudgeRight: () => void;
  onDeleteClip: () => void;
};

/**
 * Shows a contextual panel on mobile when a clip is selected, providing
 * nudge left/right and delete controls.
 * SRP: changes when mobile clip-editing UX changes.
 */
export default function MobileClipControls({
  selectedStepIndex,
  selectedStepEventCount,
  totalSteps,
  onNudgeLeft,
  onNudgeRight,
  onDeleteClip,
}: MobileClipControlsProps) {
  const { t } = useTranslation('generator');
  const theme = useTheme();
  const { appColors } = theme.palette;

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: appColors.surface.translucentPanel,
        border: `1px solid ${appColors.surface.translucentPanelBorder}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 160 }}>
        <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
          {t('ui.chordGrid.selectedClipTitle', { defaultValue: 'Selected clip' })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('ui.chordGrid.selectedClipMeta', {
            defaultValue:
              '{{count}} event at step {{step}}. Drag the clip or use the controls to move it.',
            count: selectedStepEventCount,
            step: selectedStepIndex + 1,
          })}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
        <Tooltip title={t('ui.chordGrid.moveClipLeft', { defaultValue: 'Move clip left' })}>
          <span>
            <IconButton
              size="small"
              onClick={onNudgeLeft}
              disabled={selectedStepIndex === 0}
              aria-label={t('ui.chordGrid.moveClipLeft', { defaultValue: 'Move clip left' })}
            >
              <KeyboardArrowLeftIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('ui.chordGrid.moveClipRight', { defaultValue: 'Move clip right' })}>
          <span>
            <IconButton
              size="small"
              onClick={onNudgeRight}
              disabled={selectedStepIndex >= totalSteps - 1}
              aria-label={t('ui.chordGrid.moveClipRight', { defaultValue: 'Move clip right' })}
            >
              <KeyboardArrowRightIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('ui.chordGrid.deleteSelectedClip', { defaultValue: 'Delete clip' })}>
          <span>
            <IconButton
              size="small"
              onClick={onDeleteClip}
              aria-label={t('ui.chordGrid.deleteSelectedClip', { defaultValue: 'Delete clip' })}
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
        {t('ui.chordGrid.touchEditHint', {
          defaultValue: 'Tap a clip to select it. Drag it horizontally to move it.',
        })}
      </Typography>
    </Box>
  );
}
