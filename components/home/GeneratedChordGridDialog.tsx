'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

import { playChordVoicing, stopAllAudio } from '../../lib/audio';
import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../../lib/audio';
import { createPianoVoicingFromChordSymbol } from '../../lib/chordVoicing';
import { CHORD_OPTIONS } from '../../lib/formOptions';
import PlaybackSettingsButton from './PlaybackSettingsButton';
import SelectField from '../ui/SelectField';

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
  onPlaybackStyleChange: (value: PlaybackStyle) => void;
  attack?: number;
  onAttackChange: (value: number) => void;
  decay?: number;
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
  onPlaybackStyleChange,
  attack = 0.01,
  onAttackChange,
  decay = 0.5,
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
  chords,
}: GeneratedChordGridDialogProps) {
  const [activePadKey, setActivePadKey] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableChords, setEditableChords] = useState<ChordGridEntry[]>(chords);
  const [editingPadKey, setEditingPadKey] = useState<string | null>(null);
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
    setEditableChords(chords);
    setEditingPadKey(null);
  }, [chords, open]);

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

  const onPadPress = (entry: ChordGridEntry) => {
    if (isEditMode) {
      setEditingPadKey(entry.key);
    }

    triggerPad(entry);
  };

  const onPadChordChange = (padKey: string, chord: string) => {
    const voicing = createPianoVoicingFromChordSymbol(chord);
    if (!voicing) {
      return;
    }

    setEditableChords((previous) =>
      previous.map((entry) =>
        entry.key === padKey
          ? {
              ...entry,
              chord,
              leftHand: voicing.leftHand,
              rightHand: voicing.rightHand,
            }
          : entry,
      ),
    );
  };

  const editableChordOptions = useMemo(() => {
    const values = Array.from(
      new Set([...CHORD_OPTIONS, ...editableChords.map((entry) => entry.chord)]),
    );
    return values.map((value) => ({ value, label: value }));
  }, [editableChords]);

  const editingEntry = editingPadKey
    ? editableChords.find((entry) => entry.key === editingPadKey)
    : undefined;

  const previewEntry =
    editableChords.find((entry) => entry.key === activePadKey) ??
    (editableChords.length > 0
      ? {
          leftHand: editableChords[0].leftHand,
          rightHand: editableChords[0].rightHand,
        }
      : undefined);

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
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        <Typography variant="h5">Chord Playground</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {isEditMode ? (
          <Box
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(23, 27, 32, 0.45)',
              border: '1px solid rgba(188, 194, 201, 0.2)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select a pad, then pick a chord
            </Typography>
            <SelectField
              label="Pad chord"
              value={editingEntry?.chord ?? ''}
              onChange={(event) => {
                if (editingPadKey) {
                  onPadChordChange(editingPadKey, event.target.value);
                }
              }}
              options={editableChordOptions}
              fullWidth
              size="small"
              disabled={!editingPadKey}
            />
          </Box>
        ) : null}
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
          {editableChords.map((entry) => {
            const isActive = activePadKey === entry.key;
            const isEditing = editingPadKey === entry.key;
            const borderColor = getChordBorderColor(entry.chord);
            const editingBorderColor = '#ff4d9d';

            return (
              <Button
                key={entry.key}
                variant="contained"
                onMouseDown={() => onPadPress(entry)}
                sx={{
                  aspectRatio: '1 / 1',
                  minHeight: { xs: 82, sm: 108 },
                  borderRadius: 1.5,
                  fontWeight: 700,
                  fontSize: { xs: '0.88rem', sm: '1.02rem' },
                  letterSpacing: 0.2,
                  textTransform: 'none',
                  color: 'common.white',
                  background: isEditing
                    ? 'linear-gradient(180deg, rgba(255, 77, 157, 0.2) 0%, rgba(60, 38, 53, 0.95) 100%)'
                    : isActive
                      ? padStyles.active.bg
                      : padStyles.body.bg,
                  backgroundColor: '#2e3136',
                  border: '2px solid',
                  borderColor: isEditing
                    ? editingBorderColor
                    : isActive
                      ? padStyles.active.border
                      : borderColor,
                  boxShadow: isEditing
                    ? '0 0 0 2px rgba(255, 77, 157, 0.45), 0 8px 0 rgba(20, 23, 28, 0.82)'
                    : isActive
                      ? '0 3px 0 rgba(20, 23, 28, 0.92)'
                      : '0 8px 0 rgba(20, 23, 28, 0.82)',
                  transform: isActive ? 'translateY(5px)' : 'translateY(0)',
                  transition:
                    'transform 90ms ease, box-shadow 90ms ease, background 120ms, border-color 120ms',
                  '&:hover': {
                    background: isEditing
                      ? 'linear-gradient(180deg, rgba(255, 77, 157, 0.26) 0%, rgba(68, 42, 60, 0.97) 100%)'
                      : isActive
                        ? padStyles.active.bg
                        : padStyles.body.bgHover,
                    boxShadow: isEditing
                      ? '0 0 0 2px rgba(255, 77, 157, 0.6), 0 8px 0 rgba(20, 23, 28, 0.82)'
                      : isActive
                        ? '0 3px 0 rgba(20, 23, 28, 0.92)'
                        : '0 8px 0 rgba(20, 23, 28, 0.82)',
                    borderColor: isEditing
                      ? editingBorderColor
                      : isActive
                        ? padStyles.active.border
                        : borderColor,
                  },
                  '&:active': {
                    transform: 'translateY(5px)',
                    background: isEditing
                      ? 'linear-gradient(180deg, rgba(255, 77, 157, 0.3) 0%, rgba(72, 44, 64, 0.98) 100%)'
                      : isActive
                        ? padStyles.active.bg
                        : padStyles.body.bgHover,
                    boxShadow: '0 3px 0 rgba(20, 23, 28, 0.92)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, fontSize: { xs: '0.88rem', sm: '1.02rem' } }}
                  >
                    {entry.chord}
                  </Typography>
                </Box>
              </Button>
            );
          })}
        </Box>

        {editableChords.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No generated piano voicings available.
          </Typography>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <PlaybackSettingsButton
            playbackStyle={playbackStyle}
            onPlaybackStyleChange={onPlaybackStyleChange}
            attack={attack}
            onAttackChange={onAttackChange}
            decay={decay}
            onDecayChange={onDecayChange}
            padVelocity={padVelocity}
            onPadVelocityChange={onPadVelocityChange}
            padSwing={padSwing}
            onPadSwingChange={onPadSwingChange}
            padLatchMode={padLatchMode}
            onPadLatchModeChange={onPadLatchModeChange}
            humanize={humanize}
            onHumanizeChange={onHumanizeChange}
            gate={gate}
            onGateChange={onGateChange}
            inversionRegister={inversionRegister}
            onInversionRegisterChange={onInversionRegisterChange}
            instrument={instrument}
            onInstrumentChange={onInstrumentChange}
            octaveShift={octaveShift}
            onOctaveShiftChange={onOctaveShiftChange}
            reverb={reverb}
            onReverbChange={onReverbChange}
            tempoBpm={tempoBpm}
            previewVoicing={previewEntry}
            position="modal"
          />
          <Button
            size="small"
            variant={isEditMode ? 'contained' : 'outlined'}
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setEditingPadKey(null);
            }}
            sx={{
              borderWidth: 1.5,
              color: isEditMode ? '#1f1300' : '#60a5fa',
              borderColor: isEditMode ? 'rgba(245, 158, 11, 0.95)' : 'rgba(96, 165, 250, 0.9)',
              backgroundColor: isEditMode ? 'rgba(245, 158, 11, 0.95)' : 'transparent',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: isEditMode
                ? '0 0 0 2px rgba(245, 158, 11, 0.25), 0 4px 10px rgba(245, 158, 11, 0.25)'
                : 'none',
              '&:hover': {
                borderColor: isEditMode ? 'rgba(251, 191, 36, 1)' : 'rgba(147, 197, 253, 1)',
                backgroundColor: isEditMode
                  ? 'rgba(251, 191, 36, 0.95)'
                  : 'rgba(96, 165, 250, 0.08)',
                borderWidth: 1.5,
              },
            }}
          >
            {isEditMode ? 'Save pad' : 'Edit'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button onClick={stopAllAudio}>Stop audio</Button>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
