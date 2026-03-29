'use client';

import SettingsIcon from '@mui/icons-material/Settings';
import {
  GATE_RANGE,
  INSTRUMENT_OPTIONS,
  INVERSION_OPTIONS,
  OCTAVE_SHIFT_MARKS,
  OCTAVE_SHIFT_RANGE,
  PLAYBACK_SETTINGS_COPY,
  PLAYBACK_STYLE_OPTIONS,
  TIME_SIGNATURE_OPTIONS,
  TEMPO_RANGE,
  createEffectConfigs,
  createPadSliderConfigs,
  formatGateLabel,
  getSettingsTriggerButtonSx,
  type EffectId,
  type EffectConfig,
  type SliderRowConfig,
} from '../lib/playbackSettingsConfigs';

import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { playChordVoicing } from '../../../domain/audio/audio';
import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../../../domain/audio/audio';
import type { TimeSignature } from '../../../domain/audio/audio';
import SelectField from '../../../components/ui/SelectField';
import EffectParamSlider from './EffectParamSlider';
import EffectSettingsCard from './EffectSettingsCard';
import EnvelopeControls from './EnvelopeControls';
import { stopGlobalPlayback } from '../hooks/usePlaybackToggle';
import type {
  PlaybackSettings,
  PlaybackSettingsChangeHandlers,
} from '../lib/playbackSettingsModel';

/**
 * Lightweight voicing payload used for preview playback.
 */
type PreviewVoicing = {
  leftHand: string[];
  rightHand: string[];
};

/**
 * Props for the playback settings trigger and dialog.
 */
type PlaybackSettingsButtonProps = {
  settings: PlaybackSettings;
  onChange: PlaybackSettingsChangeHandlers;
  tempoBpm: number;
  onTempoBpmChange: (value: number) => void;
  previewVoicing?: PreviewVoicing;
  position?: 'inline' | 'modal';
};

/**
 * Renders playback settings controls and a preview action for the current voicing.
 */
export default function PlaybackSettingsButton({
  settings,
  onChange,
  tempoBpm,
  onTempoBpmChange,
  previewVoicing,
  position = 'inline',
}: PlaybackSettingsButtonProps) {
  const { t } = useTranslation('generator');
  const {
    playbackStyle,
    attack,
    decay,
    padVelocity,
    timeSignature,
    metronomeEnabled,
    metronomeVolume,
    humanize,
    gate,
    inversionRegister,
    instrument,
    octaveShift,
  } = settings;

  const {
    onPlaybackStyleChange,
    onAttackChange,
    onDecayChange,
    onTimeSignatureChange,
    onMetronomeEnabledChange,
    onMetronomeVolumeChange,
    onGateChange,
    onInversionRegisterChange,
    onInstrumentChange,
    onOctaveShiftChange,
  } = onChange;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [advancedOpenByEffect, setAdvancedOpenByEffect] = useState<Record<EffectId, boolean>>({
    reverb: false,
    chorus: false,
    tremolo: false,
    feedbackDelay: false,
    vibrato: false,
    phaser: false,
  });

  const closeDialog = () => setIsSettingsOpen(false);
  const canPreview = Boolean(previewVoicing);
  const toggleAdvanced = useCallback((effectId: EffectId) => {
    setAdvancedOpenByEffect((previousState) => ({
      ...previousState,
      [effectId]: !previousState[effectId],
    }));
  }, []);

  const effectConfigs: EffectConfig[] = createEffectConfigs(settings, onChange);
  const padSliderConfigs: SliderRowConfig[] = createPadSliderConfigs(settings, onChange);

  /**
   * Plays a one-shot preview using the current settings.
   */
  const previewSound = () => {
    if (!previewVoicing) {
      return;
    }

    stopGlobalPlayback();

    void playChordVoicing({
      leftHand: previewVoicing.leftHand,
      rightHand: previewVoicing.rightHand,
      tempoBpm,
      playbackStyle,
      attack,
      decay,
      velocity: padVelocity,
      humanize,
      gate,
      inversionRegister,
      instrument,
      octaveShift,
    });
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignSelf: position === 'modal' ? 'flex-end' : 'auto',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<SettingsIcon />}
          onClick={() => setIsSettingsOpen(true)}
          sx={getSettingsTriggerButtonSx(position)}
        >
          {t('ui.buttons.settings')}
        </Button>
      </Box>

      <Dialog open={isSettingsOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t('ui.settingsDialog.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {PLAYBACK_SETTINGS_COPY.instrumentLabel}
              </Typography>
              <SelectField
                value={instrument}
                onChange={(e) => {
                  onInstrumentChange(e.target.value as AudioInstrument);
                }}
                options={INSTRUMENT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                size="small"
                fullWidth
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {PLAYBACK_SETTINGS_COPY.octaveShiftLabel}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={octaveShift}
                  onChange={(_, value) => onOctaveShiftChange(value as number)}
                  min={OCTAVE_SHIFT_RANGE.min}
                  max={OCTAVE_SHIFT_RANGE.max}
                  step={OCTAVE_SHIFT_RANGE.step}
                  marks={OCTAVE_SHIFT_MARKS}
                  valueLabelDisplay="auto"
                  aria-label="Octave shift"
                  sx={{ flex: 1 }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {PLAYBACK_SETTINGS_COPY.octaveShiftHelp}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {PLAYBACK_SETTINGS_COPY.inversionLockLabel}
              </Typography>
              <ToggleButtonGroup
                size="small"
                color="primary"
                exclusive
                value={inversionRegister}
                onChange={(_, nextValue: PlaybackRegister | null) => {
                  if (nextValue) {
                    onInversionRegisterChange(nextValue);
                  }
                }}
                aria-label="Inversion register"
                fullWidth
              >
                {INVERSION_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    value={option.value}
                    aria-label={option.ariaLabel}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {PLAYBACK_SETTINGS_COPY.inversionLockHelp}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {PLAYBACK_SETTINGS_COPY.playbackStyleLabel}
              </Typography>
              <ToggleButtonGroup
                size="small"
                color="primary"
                exclusive
                value={playbackStyle}
                onChange={(_, nextValue: PlaybackStyle | null) => {
                  if (nextValue) {
                    onPlaybackStyleChange(nextValue);
                  }
                }}
                aria-label="Playback style"
                fullWidth
              >
                {PLAYBACK_STYLE_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    value={option.value}
                    aria-label={option.ariaLabel}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {PLAYBACK_SETTINGS_COPY.tempoLabel}
              </Typography>
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Slider
                    size="small"
                    value={tempoBpm}
                    onChange={(_, value) => onTempoBpmChange(value as number)}
                    min={TEMPO_RANGE.min}
                    max={TEMPO_RANGE.max}
                    step={TEMPO_RANGE.step}
                    aria-label={PLAYBACK_SETTINGS_COPY.tempoAriaLabel}
                    sx={{ flex: 1 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ minWidth: 58, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {tempoBpm} BPM
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {PLAYBACK_SETTINGS_COPY.timeSignatureLabel}
              </Typography>
              <ToggleButtonGroup
                size="small"
                color="primary"
                exclusive
                value={timeSignature}
                onChange={(_, next: TimeSignature | null) => {
                  if (next) onTimeSignatureChange(next);
                }}
                aria-label="Time signature"
                fullWidth
              >
                {TIME_SIGNATURE_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    value={option.value}
                    aria-label={option.ariaLabel}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box>
              <FormControlLabel
                sx={{ ml: 0 }}
                control={
                  <Switch
                    checked={metronomeEnabled}
                    onChange={(event) => onMetronomeEnabledChange(event.target.checked)}
                    inputProps={{ 'aria-label': PLAYBACK_SETTINGS_COPY.metronomeAriaLabel }}
                  />
                }
                label={PLAYBACK_SETTINGS_COPY.metronomeLabel}
              />
              {metronomeEnabled ? (
                <Box sx={{ mt: 0.5 }}>
                  <EffectParamSlider
                    label={PLAYBACK_SETTINGS_COPY.metronomeVolumeLabel}
                    valueText={`${Math.round(metronomeVolume * 100)}%`}
                    value={metronomeVolume}
                    onChange={onMetronomeVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    ariaLabel={PLAYBACK_SETTINGS_COPY.metronomeVolumeAriaLabel}
                  />
                </Box>
              ) : null}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {PLAYBACK_SETTINGS_COPY.envelopeLabel}
                  </Typography>
                  <EnvelopeControls
                    attack={attack}
                    onAttackChange={onAttackChange}
                    decay={decay}
                    onDecayChange={onDecayChange}
                    direction="column"
                  />
                  <Box sx={{ mt: 2 }}>
                    <EffectParamSlider
                      label={PLAYBACK_SETTINGS_COPY.gateLabel}
                      valueText={formatGateLabel(gate)}
                      value={gate}
                      onChange={onGateChange}
                      min={GATE_RANGE.min}
                      max={GATE_RANGE.max}
                      step={GATE_RANGE.step}
                      ariaLabel={PLAYBACK_SETTINGS_COPY.gateAriaLabel}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2">{PLAYBACK_SETTINGS_COPY.padsLabel}</Typography>

                    {padSliderConfigs.map((slider) => (
                      <EffectParamSlider
                        key={slider.key}
                        label={slider.label}
                        valueText={slider.valueText}
                        value={slider.value}
                        onChange={slider.onChange}
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        ariaLabel={slider.ariaLabel}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {PLAYBACK_SETTINGS_COPY.effectsLabel}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {effectConfigs.map((effect) => (
                  <EffectSettingsCard
                    key={effect.id}
                    title={effect.title}
                    enabled={effect.enabled}
                    onEnabledChange={effect.onEnabledChange}
                    level={effect.level}
                    onLevelChange={effect.onLevelChange}
                    levelAriaLabel={effect.levelAriaLabel}
                    advancedOpen={advancedOpenByEffect[effect.id]}
                    onAdvancedToggle={() => toggleAdvanced(effect.id)}
                  >
                    {effect.sliders.map((slider) => (
                      <Box key={`${effect.id}-${slider.label}`}>
                        <EffectParamSlider
                          label={slider.label}
                          valueText={slider.valueText}
                          value={slider.value}
                          onChange={slider.onChange}
                          min={slider.min}
                          max={slider.max}
                          step={slider.step}
                          ariaLabel={slider.ariaLabel}
                          disabled={!effect.enabled}
                        />
                      </Box>
                    ))}
                  </EffectSettingsCard>
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{PLAYBACK_SETTINGS_COPY.closeButtonLabel}</Button>
          <Button variant="contained" onClick={previewSound} disabled={!canPreview}>
            {PLAYBACK_SETTINGS_COPY.testSoundButtonLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
