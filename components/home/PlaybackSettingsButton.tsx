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
import type { PlaybackRegister, PlaybackStyle } from '../../lib/audio';
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
  tempoBpm: number;
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
  tempoBpm,
  previewVoicing,
  position = 'inline',
}: PlaybackSettingsButtonProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            color: '#60a5fa',
            borderColor: 'rgba(96, 165, 250, 0.9)',
            backgroundColor: 'transparent',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              borderColor: 'rgba(147, 197, 253, 1)',
              backgroundColor: 'rgba(96, 165, 250, 0.08)',
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
                Shifts chord notes to stay in the chosen register using nearest-octave voice leading.
              </Typography>
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
