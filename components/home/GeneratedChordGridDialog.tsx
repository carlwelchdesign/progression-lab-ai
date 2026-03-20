'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { playChordVoicing, stopAllAudio } from '../../lib/audio';
import type { PlaybackStyle } from '../../lib/audio';

type ChordGridEntry = {
  key: string;
  chord: string;
  source: string;
  leftHand: string[];
  rightHand: string[];
};

type GeneratedChordGridDialogProps = {
  open: boolean;
  onClose: () => void;
  tempoBpm: number;
  playbackStyle: PlaybackStyle;
  chords: ChordGridEntry[];
};

const HAPPY_FALLBACK_BORDERS = ['#f97316', '#22d3ee', '#a3e635', '#f43f5e', '#f59e0b', '#60a5fa'];

function getChordBorderColor(chordName: string): string {
  if (/sus/i.test(chordName)) {
    return '#22d3ee';
  }

  if (/(?:maj9|add9|\b9\b|\b7\b|11|13)/i.test(chordName)) {
    return '#c084fc';
  }

  if (/(?:^|[^A-Za-z])m(?!aj)|min/i.test(chordName)) {
    return '#34d399';
  }

  if (/dim|o/i.test(chordName)) {
    return '#f87171';
  }

  if (/aug|\+/i.test(chordName)) {
    return '#f59e0b';
  }

  let hash = 0;
  for (const char of chordName) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  }

  return HAPPY_FALLBACK_BORDERS[Math.abs(hash) % HAPPY_FALLBACK_BORDERS.length];
}

export default function GeneratedChordGridDialog({
  open,
  onClose,
  tempoBpm,
  playbackStyle,
  chords,
}: GeneratedChordGridDialogProps) {
  const [activePadKey, setActivePadKey] = useState<string | null>(null);
  const [selectedPlaybackStyle, setSelectedPlaybackStyle] = useState<PlaybackStyle>(playbackStyle);
  const [attack, setAttack] = useState<number>(0.01);
  const [decay, setDecay] = useState<number>(0.5);
  const activePadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padStyles = {
    body: {
      bg: 'linear-gradient(180deg, rgba(84, 84, 87, 0.97) 0%, rgba(44, 45, 49, 0.99) 100%)',
      bgHover: 'linear-gradient(180deg, rgba(98, 98, 102, 0.98) 0%, rgba(52, 53, 58, 0.99) 100%)',
    },
    active: {
      bg: 'linear-gradient(180deg, rgba(116, 117, 121, 0.99) 0%, rgba(63, 64, 69, 0.99) 100%)',
      border: '#facc15',
    },
  } as const;

  useEffect(() => {
    return () => {
      if (activePadTimeout.current) {
        clearTimeout(activePadTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    setSelectedPlaybackStyle(playbackStyle);
  }, [playbackStyle, open]);

  const triggerPad = (entry: ChordGridEntry) => {
    if (activePadTimeout.current) {
      clearTimeout(activePadTimeout.current);
    }

    setActivePadKey(entry.key);
    activePadTimeout.current = setTimeout(() => {
      setActivePadKey(null);
      activePadTimeout.current = null;
    }, 180);

    void playChordVoicing({
      leftHand: entry.leftHand,
      rightHand: entry.rightHand,
      tempoBpm,
      playbackStyle: selectedPlaybackStyle,
      attack,
      decay,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 800,
          paddingTop: 2,
          borderRadius: 2,
          color: 'common.white',
          background:
            'linear-gradient(160deg, rgba(95, 101, 109, 0.96) 0%, rgba(49, 54, 61, 0.98) 52%, rgba(32, 36, 42, 0.98) 100%)',
          border: '1px solid rgba(190, 196, 204, 0.28)',
        },
      }}
    >
      <DialogContent dividers>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <ToggleButtonGroup
            size="small"
            color="primary"
            exclusive
            value={selectedPlaybackStyle}
            onChange={(_, nextValue: PlaybackStyle | null) => {
              if (nextValue) {
                setSelectedPlaybackStyle(nextValue);
              }
            }}
            aria-label="Chord pad playback style"
          >
            <ToggleButton value="strum" aria-label="Strum playback">
              Strum
            </ToggleButton>
            <ToggleButton value="block" aria-label="Block playback">
              Block
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center'}}>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Attack: {attack.toFixed(2)}s
              </Typography>
              <Slider
                size="small"
                value={attack}
                onChange={(_, value) => setAttack(value as number)}
                min={0}
                max={0.5}
                step={0.01}
                aria-label="Attack time"
              />
            </Box>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Decay: {decay.toFixed(2)}s
              </Typography>
              <Slider
                size="small"
                value={decay}
                onChange={(_, value) => setDecay(value as number)}
                min={0.1}
                max={3}
                step={0.1}
                aria-label="Decay time"
              />
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(3, minmax(0, 1fr))',
              sm: 'repeat(4, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: { xs: 1, sm: 1.5 },
            p: { xs: 0.5, sm: 1 },
            borderRadius: 2,
            bgcolor: 'rgba(23, 27, 32, 0.5)',
            border: '1px solid rgba(188, 194, 201, 0.2)',
          }}
        >
          {chords.map((entry) => {
            const isActive = activePadKey === entry.key;
            const borderColor = getChordBorderColor(entry.chord);

            return (
              <Button
                key={entry.key}
                variant="contained"
                onClick={() => triggerPad(entry)}
                sx={{
                  aspectRatio: '1 / 1',
                  minHeight: { xs: 82, sm: 108 },
                  borderRadius: 1.5,
                  fontWeight: 700,
                  fontSize: { xs: '0.88rem', sm: '1.02rem' },
                  letterSpacing: 0.2,
                  textTransform: 'none',
                  color: 'common.white',
                  background: isActive ? padStyles.active.bg : padStyles.body.bg,
                  backgroundColor: '#2e3136',
                  border: '2px solid',
                  borderColor: isActive ? padStyles.active.border : borderColor,
                  boxShadow: isActive
                    ? '0 3px 0 rgba(20, 23, 28, 0.92)'
                    : '0 8px 0 rgba(20, 23, 28, 0.82)',
                  transform: isActive ? 'translateY(5px)' : 'translateY(0)',
                  transition:
                    'transform 90ms ease, box-shadow 90ms ease, background 120ms, border-color 120ms',
                  '&:hover': {
                    background: isActive ? padStyles.active.bg : padStyles.body.bgHover,
                    boxShadow: isActive
                      ? '0 3px 0 rgba(20, 23, 28, 0.92)'
                      : '0 8px 0 rgba(20, 23, 28, 0.82)',
                    borderColor: isActive ? padStyles.active.border : borderColor,
                  },
                  '&:active': {
                    transform: 'translateY(5px)',
                    background: isActive ? padStyles.active.bg : padStyles.body.bgHover,
                    boxShadow: '0 3px 0 rgba(20, 23, 28, 0.92)',
                  },
                }}
              >
                {entry.chord}
              </Button>
            );
          })}
        </Box>

        {chords.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No generated piano voicings available.
          </Typography>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={stopAllAudio}>Stop audio</Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
