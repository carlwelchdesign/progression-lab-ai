'use client';

import SettingsIcon from '@mui/icons-material/Settings';
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
import { useState } from 'react';

import { playChordVoicing } from '../../lib/audio';
import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../../lib/audio';
import SelectField from '../ui/SelectField';
import EffectParamSlider from './EffectParamSlider';
import EffectSettingsCard from './EffectSettingsCard';
import EnvelopeControls from './EnvelopeControls';

type PreviewVoicing = {
  leftHand: string[];
  rightHand: string[];
};

type PlaybackSettingsButtonProps = {
  playbackStyle: PlaybackStyle;
  onPlaybackStyleChange: (value: PlaybackStyle) => void;
  attack: number;
  onAttackChange: (value: number) => void;
  decay: number;
  onDecayChange: (value: number) => void;
  padVelocity: number;
  onPadVelocityChange: (value: number) => void;
  padSwing: number;
  onPadSwingChange: (value: number) => void;
  padLatchMode: boolean;
  onPadLatchModeChange: (value: boolean) => void;
  humanize: number;
  onHumanizeChange: (value: number) => void;
  gate: number;
  onGateChange: (value: number) => void;
  inversionRegister: PlaybackRegister;
  onInversionRegisterChange: (value: PlaybackRegister) => void;
  instrument: AudioInstrument;
  onInstrumentChange: (value: AudioInstrument) => void;
  octaveShift: number;
  onOctaveShiftChange: (value: number) => void;
  reverb: number;
  onReverbChange: (value: number) => void;
  reverbEnabled: boolean;
  onReverbEnabledChange: (value: boolean) => void;
  chorus: number;
  onChorusChange: (value: number) => void;
  chorusEnabled: boolean;
  onChorusEnabledChange: (value: boolean) => void;
  chorusRate: number;
  onChorusRateChange: (value: number) => void;
  chorusDepth: number;
  onChorusDepthChange: (value: number) => void;
  chorusDelayTime: number;
  onChorusDelayTimeChange: (value: number) => void;
  feedbackDelayEnabled: boolean;
  onFeedbackDelayEnabledChange: (value: boolean) => void;
  feedbackDelay: number;
  onFeedbackDelayChange: (value: number) => void;
  feedbackDelayTime: number;
  onFeedbackDelayTimeChange: (value: number) => void;
  feedbackDelayFeedback: number;
  onFeedbackDelayFeedbackChange: (value: number) => void;
  tremoloEnabled: boolean;
  onTremoloEnabledChange: (value: boolean) => void;
  tremolo: number;
  onTremoloChange: (value: number) => void;
  tremoloFrequency: number;
  onTremoloFrequencyChange: (value: number) => void;
  tremoloDepth: number;
  onTremoloDepthChange: (value: number) => void;
  vibratoEnabled: boolean;
  onVibratoEnabledChange: (value: boolean) => void;
  vibrato: number;
  onVibratoChange: (value: number) => void;
  vibratoFrequency: number;
  onVibratoFrequencyChange: (value: number) => void;
  vibratoDepth: number;
  onVibratoDepthChange: (value: number) => void;
  phaserEnabled: boolean;
  onPhaserEnabledChange: (value: boolean) => void;
  phaser: number;
  onPhaserChange: (value: number) => void;
  phaserFrequency: number;
  onPhaserFrequencyChange: (value: number) => void;
  phaserOctaves: number;
  onPhaserOctavesChange: (value: number) => void;
  phaserQ: number;
  onPhaserQChange: (value: number) => void;
  roomSize: number;
  onRoomSizeChange: (value: number) => void;
  tempoBpm: number;
  onTempoBpmChange: (value: number) => void;
  previewVoicing?: PreviewVoicing;
  position?: 'inline' | 'modal';
};

export default function PlaybackSettingsButton({
  playbackStyle,
  onPlaybackStyleChange,
  attack,
  onAttackChange,
  decay,
  onDecayChange,
  padVelocity,
  onPadVelocityChange,
  padSwing,
  onPadSwingChange,
  padLatchMode,
  onPadLatchModeChange,
  humanize,
  onHumanizeChange,
  gate,
  onGateChange,
  inversionRegister,
  onInversionRegisterChange,
  instrument,
  onInstrumentChange,
  octaveShift,
  onOctaveShiftChange,
  reverb,
  onReverbChange,
  reverbEnabled,
  onReverbEnabledChange,
  chorus,
  onChorusChange,
  chorusEnabled,
  onChorusEnabledChange,
  chorusRate,
  onChorusRateChange,
  chorusDepth,
  onChorusDepthChange,
  chorusDelayTime,
  onChorusDelayTimeChange,
  feedbackDelayEnabled,
  onFeedbackDelayEnabledChange,
  feedbackDelay,
  onFeedbackDelayChange,
  feedbackDelayTime,
  onFeedbackDelayTimeChange,
  feedbackDelayFeedback,
  onFeedbackDelayFeedbackChange,
  tremoloEnabled,
  onTremoloEnabledChange,
  tremolo,
  onTremoloChange,
  tremoloFrequency,
  onTremoloFrequencyChange,
  tremoloDepth,
  onTremoloDepthChange,
  vibratoEnabled,
  onVibratoEnabledChange,
  vibrato,
  onVibratoChange,
  vibratoFrequency,
  onVibratoFrequencyChange,
  vibratoDepth,
  onVibratoDepthChange,
  phaserEnabled,
  onPhaserEnabledChange,
  phaser,
  onPhaserChange,
  phaserFrequency,
  onPhaserFrequencyChange,
  phaserOctaves,
  onPhaserOctavesChange,
  phaserQ,
  onPhaserQChange,
  roomSize,
  onRoomSizeChange,
  tempoBpm,
  onTempoBpmChange,
  previewVoicing,
  position = 'inline',
}: PlaybackSettingsButtonProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reverbAdvancedOpen, setReverbAdvancedOpen] = useState(false);
  const [chorusAdvancedOpen, setChorusAdvancedOpen] = useState(false);
  const [feedbackDelayAdvancedOpen, setFeedbackDelayAdvancedOpen] = useState(false);
  const [tremoloAdvancedOpen, setTremoloAdvancedOpen] = useState(false);
  const [vibratoAdvancedOpen, setVibratoAdvancedOpen] = useState(false);
  const [phaserAdvancedOpen, setPhaserAdvancedOpen] = useState(false);

  const closeDialog = () => setIsSettingsOpen(false);
  const canPreview = Boolean(previewVoicing);

  const previewSound = () => {
    if (!previewVoicing) {
      return;
    }

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
          sx={{
            borderWidth: 1.5,
            color: '#60a5fa',
            borderColor: 'rgba(96, 165, 250, 0.9)',
            backgroundColor:
              position === 'inline'
                ? (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(15, 23, 42, 0.35)'
                      : 'rgba(255, 255, 255, 0.5)'
                : 'transparent',
            textTransform: 'none',
            fontWeight: 600,
            backdropFilter: position === 'inline' ? 'blur(10px)' : 'none',
            WebkitBackdropFilter: position === 'inline' ? 'blur(10px)' : 'none',
            '&:hover': {
              borderColor: 'rgba(147, 197, 253, 1)',
              backgroundColor: 'rgba(96, 165, 250, 0.08)',
              borderWidth: 1.5,
            },
          }}
        >
          Settings
        </Button>
      </Box>

      <Dialog open={isSettingsOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Playback Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Octave shift
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={octaveShift}
                  onChange={(_, value) => onOctaveShiftChange(value as number)}
                  min={-3}
                  max={3}
                  step={1}
                  marks={[
                    { value: -3, label: '-3' },
                    { value: 0, label: '0' },
                    { value: 3, label: '+3' },
                  ]}
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
                Transposes all notes by octaves. Positive values shift higher, negative values shift
                lower.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Inversion lock
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
                <ToggleButton value="off" aria-label="Off">
                  Off
                </ToggleButton>
                <ToggleButton value="low" aria-label="Low register (C2–B3)">
                  Low
                </ToggleButton>
                <ToggleButton value="mid" aria-label="Mid register (C3–B4)">
                  Mid
                </ToggleButton>
                <ToggleButton value="high" aria-label="High register (C4–B5)">
                  High
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                Shifts chord notes to stay in the chosen register using nearest-octave voice
                leading.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Playback style
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
                <ToggleButton value="strum" aria-label="Strum playback">
                  Strum
                </ToggleButton>
                <ToggleButton value="block" aria-label="Block playback">
                  Block
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Tempo
              </Typography>
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Slider
                    size="small"
                    value={tempoBpm}
                    onChange={(_, value) => onTempoBpmChange(value as number)}
                    min={40}
                    max={240}
                    step={1}
                    aria-label="Tempo in BPM"
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
                Instrument
              </Typography>
              <SelectField
                value={instrument}
                onChange={(e) => {
                  onInstrumentChange(e.target.value as AudioInstrument);
                }}
                options={[
                  { value: 'piano', label: 'Piano' },
                  { value: 'rhodes', label: 'Rhodes' },
                ]}
                size="small"
                fullWidth
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Envelope
                  </Typography>
                  <EnvelopeControls
                    attack={attack}
                    onAttackChange={onAttackChange}
                    decay={decay}
                    onDecayChange={onDecayChange}
                    direction="column"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      Gate:{' '}
                      {gate === 0
                        ? 'staccato'
                        : gate === 1
                          ? 'sustained'
                          : `${Math.round(gate * 100)}%`}
                    </Typography>
                    <Slider
                      size="small"
                      value={gate}
                      onChange={(_, value) => onGateChange(value as number)}
                      min={0}
                      max={1}
                      step={0.01}
                      aria-label="Gate (note length)"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2">Pads</Typography>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Velocity: {Math.round(padVelocity)}
                      </Typography>
                      <Slider
                        size="small"
                        value={padVelocity}
                        onChange={(_, value) => onPadVelocityChange(value as number)}
                        min={20}
                        max={127}
                        step={1}
                        aria-label="Pad velocity"
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Humanize: {Math.round(humanize * 100)}%
                      </Typography>
                      <Slider
                        size="small"
                        value={humanize}
                        onChange={(_, value) => onHumanizeChange(value as number)}
                        min={0}
                        max={1}
                        step={0.01}
                        aria-label="Humanize amount"
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Swing: {padSwing}%
                      </Typography>
                      <Slider
                        size="small"
                        value={padSwing}
                        onChange={(_, value) => onPadSwingChange(value as number)}
                        min={0}
                        max={100}
                        step={1}
                        aria-label="Pad swing"
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={padLatchMode}
                          onChange={(event) => onPadLatchModeChange(event.target.checked)}
                        />
                      }
                      label="Latch mode"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Effects
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                <EffectSettingsCard
                  title="Reverb"
                  enabled={reverbEnabled}
                  onEnabledChange={onReverbEnabledChange}
                  level={reverb}
                  onLevelChange={onReverbChange}
                  levelAriaLabel="Reverb level"
                  advancedOpen={reverbAdvancedOpen}
                  onAdvancedToggle={() => setReverbAdvancedOpen((prev) => !prev)}
                >
                  <Box>
                    <EffectParamSlider
                      label="Room size"
                      valueText={`${Math.round(roomSize * 100)}%`}
                      value={roomSize}
                      onChange={onRoomSizeChange}
                      min={0}
                      max={1}
                      step={0.01}
                      ariaLabel="Reverb room size"
                      disabled={!reverbEnabled}
                    />
                  </Box>
                </EffectSettingsCard>

                <EffectSettingsCard
                  title="Chorus"
                  enabled={chorusEnabled}
                  onEnabledChange={onChorusEnabledChange}
                  level={chorus}
                  onLevelChange={onChorusChange}
                  levelAriaLabel="Chorus level"
                  advancedOpen={chorusAdvancedOpen}
                  onAdvancedToggle={() => setChorusAdvancedOpen((prev) => !prev)}
                >
                  <>
                    <Box>
                      <EffectParamSlider
                        label="Rate"
                        valueText={`${chorusRate.toFixed(1)} Hz`}
                        value={chorusRate}
                        onChange={onChorusRateChange}
                        min={0.1}
                        max={8}
                        step={0.1}
                        ariaLabel="Chorus rate"
                        disabled={!chorusEnabled}
                      />
                    </Box>
                    <Box>
                      <EffectParamSlider
                        label="Depth"
                        valueText={`${Math.round(chorusDepth * 100)}%`}
                        value={chorusDepth}
                        onChange={onChorusDepthChange}
                        min={0}
                        max={1}
                        step={0.01}
                        ariaLabel="Chorus depth"
                        disabled={!chorusEnabled}
                      />
                    </Box>
                    <Box>
                      <EffectParamSlider
                        label="Delay time"
                        valueText={`${chorusDelayTime.toFixed(1)} ms`}
                        value={chorusDelayTime}
                        onChange={onChorusDelayTimeChange}
                        min={0.1}
                        max={20}
                        step={0.1}
                        ariaLabel="Chorus delay time"
                        disabled={!chorusEnabled}
                      />
                    </Box>
                  </>
                </EffectSettingsCard>

                <EffectSettingsCard
                  title="Tremolo"
                  enabled={tremoloEnabled}
                  onEnabledChange={onTremoloEnabledChange}
                  level={tremolo}
                  onLevelChange={onTremoloChange}
                  levelAriaLabel="Tremolo level"
                  advancedOpen={tremoloAdvancedOpen}
                  onAdvancedToggle={() => setTremoloAdvancedOpen((prev) => !prev)}
                >
                  <>
                    <Box>
                      <EffectParamSlider
                        label="Rate"
                        valueText={`${tremoloFrequency.toFixed(1)} Hz`}
                        value={tremoloFrequency}
                        onChange={onTremoloFrequencyChange}
                        min={0.1}
                        max={20}
                        step={0.1}
                        ariaLabel="Tremolo rate"
                        disabled={!tremoloEnabled}
                      />
                    </Box>
                    <Box>
                      <EffectParamSlider
                        label="Depth"
                        valueText={`${Math.round(tremoloDepth * 100)}%`}
                        value={tremoloDepth}
                        onChange={onTremoloDepthChange}
                        min={0}
                        max={1}
                        step={0.01}
                        ariaLabel="Tremolo depth"
                        disabled={!tremoloEnabled}
                      />
                    </Box>
                  </>
                </EffectSettingsCard>

                <EffectSettingsCard
                  title="Feedback delay"
                  enabled={feedbackDelayEnabled}
                  onEnabledChange={onFeedbackDelayEnabledChange}
                  level={feedbackDelay}
                  onLevelChange={onFeedbackDelayChange}
                  levelAriaLabel="Feedback delay level"
                  advancedOpen={feedbackDelayAdvancedOpen}
                  onAdvancedToggle={() => setFeedbackDelayAdvancedOpen((prev) => !prev)}
                >
                  <>
                    <Box>
                      <EffectParamSlider
                        label="Delay time"
                        valueText={`${feedbackDelayTime.toFixed(2)} s`}
                        value={feedbackDelayTime}
                        onChange={onFeedbackDelayTimeChange}
                        min={0.01}
                        max={1.5}
                        step={0.01}
                        ariaLabel="Feedback delay time"
                        disabled={!feedbackDelayEnabled}
                      />
                    </Box>
                    <Box>
                      <EffectParamSlider
                        label="Feedback"
                        valueText={`${Math.round(feedbackDelayFeedback * 100)}%`}
                        value={feedbackDelayFeedback}
                        onChange={onFeedbackDelayFeedbackChange}
                        min={0}
                        max={0.95}
                        step={0.01}
                        ariaLabel="Feedback delay feedback"
                        disabled={!feedbackDelayEnabled}
                      />
                    </Box>
                  </>
                </EffectSettingsCard>

                <EffectSettingsCard
                  title="Vibrato"
                  enabled={vibratoEnabled}
                  onEnabledChange={onVibratoEnabledChange}
                  level={vibrato}
                  onLevelChange={onVibratoChange}
                  levelAriaLabel="Vibrato level"
                  advancedOpen={vibratoAdvancedOpen}
                  onAdvancedToggle={() => setVibratoAdvancedOpen((prev) => !prev)}
                >
                  <>
                    <Box>
                      <EffectParamSlider
                        label="Frequency"
                        valueText={`${vibratoFrequency.toFixed(1)} Hz`}
                        value={vibratoFrequency}
                        onChange={onVibratoFrequencyChange}
                        min={0.1}
                        max={12}
                        step={0.1}
                        ariaLabel="Vibrato frequency"
                        disabled={!vibratoEnabled}
                      />
                    </Box>
                    <Box>
                      <EffectParamSlider
                        label="Depth"
                        valueText={`${Math.round(vibratoDepth * 100)}%`}
                        value={vibratoDepth}
                        onChange={onVibratoDepthChange}
                        min={0}
                        max={1}
                        step={0.01}
                        ariaLabel="Vibrato depth"
                        disabled={!vibratoEnabled}
                      />
                    </Box>
                  </>
                </EffectSettingsCard>

                <EffectSettingsCard
                  title="Phaser"
                  enabled={phaserEnabled}
                  onEnabledChange={onPhaserEnabledChange}
                  level={phaser}
                  onLevelChange={onPhaserChange}
                  levelAriaLabel="Phaser level"
                  advancedOpen={phaserAdvancedOpen}
                  onAdvancedToggle={() => setPhaserAdvancedOpen((prev) => !prev)}
                >
                  <>
                    <Box>
                      <EffectParamSlider
                        label="Frequency"
                        valueText={`${phaserFrequency.toFixed(1)} Hz`}
                        value={phaserFrequency}
                        onChange={onPhaserFrequencyChange}
                        min={0.1}
                        max={8}
                        step={0.1}
                        ariaLabel="Phaser frequency"
                        disabled={!phaserEnabled}
                      />
                    </Box>
                    <Box>
                      <EffectParamSlider
                        label="Octaves"
                        valueText={phaserOctaves.toFixed(1)}
                        value={phaserOctaves}
                        onChange={onPhaserOctavesChange}
                        min={0.1}
                        max={6}
                        step={0.1}
                        ariaLabel="Phaser octaves"
                        disabled={!phaserEnabled}
                      />
                    </Box>
                    <Box>
                      <EffectParamSlider
                        label="Q"
                        valueText={phaserQ.toFixed(1)}
                        value={phaserQ}
                        onChange={onPhaserQChange}
                        min={0.1}
                        max={20}
                        step={0.1}
                        ariaLabel="Phaser Q"
                        disabled={!phaserEnabled}
                      />
                    </Box>
                  </>
                </EffectSettingsCard>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
          <Button variant="contained" onClick={previewSound} disabled={!canPreview}>
            Test sound
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
