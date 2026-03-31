'use client';

import {
  Box,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import LoopIcon from '@mui/icons-material/Loop';
import MicIcon from '@mui/icons-material/Mic';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import SelectField from '../../../../components/ui/SelectField';
import PlaybackToggleButton from '../playback/PlaybackToggleButton';
import { LOOP_LENGTH_OPTIONS } from './chordGridTypes';
import { getTransportIconButtonSx } from './chordGridUtils';
import type { RecordingMode } from './chordGridTypes';

type TransportBarProps = {
  isSequencerPlaying: boolean;
  isRecording: boolean;
  isCountInActive: boolean;
  hasInitializedAudio: boolean;
  recordingMode: RecordingMode;
  isLoopEnabled: boolean;
  metronomeEnabled: boolean;
  isBeatPulseVisible: boolean;
  isDownbeatPulse: boolean;
  currentBeatInBar: number;
  beatsPerBar: number;
  currentStep: number;
  totalSteps: number;
  loopLengthBars: (typeof LOOP_LENGTH_OPTIONS)[number];
  arrangementEventsCount: number;
  singleShotCursorStep: number | null;
  showKeyboardHints: boolean;
  isDesktopKeyboardUi: boolean;
  onPlayToggle: () => void;
  onRecordToggle: () => void;
  onLoopToggle: () => void;
  onMetronomeToggle: () => void;
  onClearRecording: () => void;
  onLoopLengthChange: (bars: (typeof LOOP_LENGTH_OPTIONS)[number]) => void;
  onRecordingModeChange: (mode: RecordingMode) => void;
  onSingleShotCursorStepChange: (step: number | null) => void;
  isVocalRecording: boolean;
  canUseVocalTrackRecording: boolean;
  isVocalTakeLimitReached: boolean;
  onVocalRecordToggle: () => void;
};

/**
 * Transport controls bar: play, record, recording-mode toggle, loop, metronome,
 * beat-pulse indicator, loop-length selector, and status summary.
 * SRP: changes when transport layout or control availability changes.
 */
export default function TransportBar({
  isSequencerPlaying,
  isRecording,
  isCountInActive,
  hasInitializedAudio,
  recordingMode,
  isLoopEnabled,
  metronomeEnabled,
  isBeatPulseVisible,
  isDownbeatPulse,
  currentBeatInBar,
  beatsPerBar,
  currentStep,
  totalSteps,
  loopLengthBars,
  arrangementEventsCount,
  singleShotCursorStep,
  showKeyboardHints,
  isDesktopKeyboardUi,
  onPlayToggle,
  onRecordToggle,
  onLoopToggle,
  onMetronomeToggle,
  onClearRecording,
  onLoopLengthChange,
  onRecordingModeChange,
  onSingleShotCursorStepChange,
  isVocalRecording,
  canUseVocalTrackRecording,
  isVocalTakeLimitReached,
  onVocalRecordToggle,
}: TransportBarProps) {
  const { t } = useTranslation('generator');
  const theme = useTheme();
  const { appColors } = theme.palette;

  const keyboardShortcutItems = [
    t('ui.chordGrid.keyboardShortcutPads'),
    t('ui.chordGrid.keyboardShortcutTransport'),
    t('ui.chordGrid.keyboardShortcutRecord'),
  ];
  const desktopKeyboardShortcutItems = [
    t('ui.chordGrid.keyboardShortcutDelete'),
    t('ui.chordGrid.keyboardShortcutEscape'),
    t('ui.chordGrid.keyboardShortcutNudge'),
  ];

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: appColors.surface.translucentPanel,
        border: `1px solid ${appColors.surface.translucentPanelBorder}`,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          mb: { xs: 0.75, sm: 0 },
        }}
      >
        <PlaybackToggleButton isPlaying={isSequencerPlaying} onClick={onPlayToggle} />

        <Tooltip
          title={
            recordingMode === 'single-shot'
              ? t('ui.chordGrid.recordDisabledInSingleShot')
              : isCountInActive
                ? t('ui.chordGrid.countInTooltip', {
                    current: currentBeatInBar,
                    total: beatsPerBar,
                  })
                : isRecording
                  ? t('ui.chordGrid.stopRecording')
                  : t('ui.chordGrid.recordArrangement')
          }
        >
          <span>
            <IconButton
              size="small"
              aria-label={
                isCountInActive
                  ? t('ui.chordGrid.countInAriaLabel', {
                      current: currentBeatInBar,
                      total: beatsPerBar,
                    })
                  : isRecording
                    ? t('ui.chordGrid.stopRecording')
                    : t('ui.chordGrid.recordArrangement')
              }
              onClick={onRecordToggle}
              disabled={!hasInitializedAudio || recordingMode === 'single-shot'}
              sx={getTransportIconButtonSx(isRecording || isCountInActive, 'error')}
            >
              <FiberManualRecordIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={recordingMode}
          onChange={(_event, mode: RecordingMode | null) => {
            if (!mode) {
              return;
            }

            onRecordingModeChange(mode);
            if (mode === 'continuous') {
              onSingleShotCursorStepChange(null);
            }
          }}
          aria-label={t('ui.chordGrid.recordingModeLabel')}
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 0.9,
              py: 0.5,
              fontWeight: 600,
              fontSize: { xs: '0.67rem', sm: '0.72rem' },
            },
          }}
        >
          <ToggleButton value="continuous" aria-label={t('ui.chordGrid.recordingModeContinuous')}>
            {t('ui.chordGrid.recordingModeContinuous')}
          </ToggleButton>
          <ToggleButton value="single-shot" aria-label={t('ui.chordGrid.recordingModeSingleShot')}>
            {t('ui.chordGrid.recordingModeSingleShot')}
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip
          title={isLoopEnabled ? t('ui.chordGrid.disableLoop') : t('ui.chordGrid.enableLoop')}
        >
          <IconButton
            size="small"
            aria-label={
              isLoopEnabled ? t('ui.chordGrid.disableLoop') : t('ui.chordGrid.enableLoop')
            }
            onClick={onLoopToggle}
            sx={getTransportIconButtonSx(isLoopEnabled)}
          >
            <LoopIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={
            !canUseVocalTrackRecording
              ? t('ui.chordGrid.vocalUnavailableOnPlan', {
                  defaultValue: 'Upgrade to unlock vocal recording',
                })
              : isVocalTakeLimitReached
                ? t('ui.chordGrid.vocalTakeLimitReached', {
                    defaultValue: 'Take limit reached for this plan',
                  })
                : isVocalRecording
                  ? t('ui.chordGrid.stopVocalRecording', { defaultValue: 'Stop vocal recording' })
                  : t('ui.chordGrid.recordVocalTrack', { defaultValue: 'Record vocal take' })
          }
        >
          <IconButton
            size="small"
            aria-label={
              isVocalRecording
                ? t('ui.chordGrid.stopVocalRecording', { defaultValue: 'Stop vocal recording' })
                : t('ui.chordGrid.recordVocalTrack', { defaultValue: 'Record vocal take' })
            }
            onClick={onVocalRecordToggle}
            sx={getTransportIconButtonSx(isVocalRecording, 'error')}
          >
            <MicIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={
            metronomeEnabled
              ? t('ui.chordGrid.disableMetronome')
              : t('ui.chordGrid.enableMetronome')
          }
        >
          <IconButton
            size="small"
            aria-label={
              metronomeEnabled
                ? t('ui.chordGrid.disableMetronome')
                : t('ui.chordGrid.enableMetronome')
            }
            onClick={onMetronomeToggle}
            sx={getTransportIconButtonSx(metronomeEnabled)}
          >
            <AvTimerIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: isDownbeatPulse
                ? theme.palette.error.main
                : theme.palette.primary.main,
              opacity: metronomeEnabled && isBeatPulseVisible ? 1 : 0.25,
              transform: metronomeEnabled && isBeatPulseVisible ? 'scale(1.35)' : 'scale(1)',
              boxShadow:
                metronomeEnabled && isBeatPulseVisible
                  ? isDownbeatPulse
                    ? `0 0 0 5px ${alpha(theme.palette.error.main, 0.24)}`
                    : `0 0 0 5px ${alpha(theme.palette.primary.main, 0.24)}`
                  : 'none',
              transition: 'opacity 90ms ease, transform 90ms ease, box-shadow 90ms ease',
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
            {t('ui.chordGrid.beatCounter', { current: currentBeatInBar, total: beatsPerBar })}
          </Typography>
        </Box>

        <IconButton
          aria-label={t('ui.chordGrid.clearRecording')}
          size="small"
          onClick={onClearRecording}
          disabled={arrangementEventsCount === 0}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>

        {showKeyboardHints ? (
          <Box sx={{ ml: 'auto' }}>
            <Tooltip
              arrow
              enterTouchDelay={0}
              leaveTouchDelay={3000}
              placement="bottom-end"
              title={
                <Box sx={{ maxWidth: 340, py: 0.25 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {t('ui.chordGrid.keyboardShortcutsLabel')}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                    {keyboardShortcutItems.map((item) => (
                      <Box component="li" key={item} sx={{ mt: 0.25 }}>
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {isDesktopKeyboardUi ? (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 1.25, mb: 0.5 }}>
                        {t('ui.chordGrid.keyboardShortcutDesktopTitle')}
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                        {desktopKeyboardShortcutItems.map((item) => (
                          <Box component="li" key={item} sx={{ mt: 0.25 }}>
                            <Typography variant="body2">{item}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  ) : null}
                </Box>
              }
            >
              <Button
                size="small"
                variant="text"
                startIcon={<KeyboardIcon fontSize="small" />}
                aria-label={t('ui.chordGrid.keyboardShortcutsButtonLabel')}
                sx={{
                  px: 0.75,
                  minWidth: 0,
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {t('ui.chordGrid.keyboardShortcutsButtonLabel')}
                </Box>
              </Button>
            </Tooltip>
          </Box>
        ) : null}
      </Box>

      <Box
        sx={{
          ml: { xs: 0, sm: 'auto' },
          width: { xs: '100%', sm: 'auto' },
          minWidth: { sm: 144 },
        }}
      >
        <SelectField
          label={t('ui.chordGrid.lengthLabel')}
          value={String(loopLengthBars)}
          size="small"
          onChange={(event) => {
            const nextValue = Number.parseInt(event.target.value, 10);
            if (LOOP_LENGTH_OPTIONS.includes(nextValue as (typeof LOOP_LENGTH_OPTIONS)[number])) {
              onLoopLengthChange(nextValue as (typeof LOOP_LENGTH_OPTIONS)[number]);
            }
          }}
          options={LOOP_LENGTH_OPTIONS.map((value) => ({
            value: String(value),
            label:
              value === 1
                ? t('ui.chordGrid.oneBar')
                : t('ui.chordGrid.multipleBars', { count: value }),
          }))}
          sx={{ minWidth: { xs: '100%', sm: 144 } }}
        />
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ width: '100%' }}
        style={{ textAlign: 'right' }}
      >
        {isCountInActive
          ? t('ui.chordGrid.countInActive')
          : t('ui.chordGrid.stepSummary', { current: currentStep + 1, total: totalSteps })}{' '}
        •{' '}
        {arrangementEventsCount === 1
          ? t('ui.chordGrid.eventSingular', { count: arrangementEventsCount })
          : t('ui.chordGrid.eventPlural', { count: arrangementEventsCount })}
        {recordingMode === 'single-shot' ? (
          <>
            {' '}
            •{' '}
            {singleShotCursorStep === null
              ? t('ui.chordGrid.singleShotCursorUnset')
              : t('ui.chordGrid.singleShotCursorSet', { step: singleShotCursorStep + 1 })}
          </>
        ) : null}
      </Typography>
    </Box>
  );
}
