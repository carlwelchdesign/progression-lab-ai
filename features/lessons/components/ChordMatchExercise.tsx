'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, Collapse, IconButton, Stack, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { playChordVoicing } from '../../../domain/audio/audio';
import { useMidiInput } from '../hooks/useMidiInput';
import MidiInteractivePiano from './MidiInteractivePiano';
import { normalizeNote } from './MidiInteractivePiano';

type Props = {
  chord: string;
  targetNotes?: string[];
  onSuccess?: () => void;
};

/** Strip the octave number — "C#4" → "C#", "Bb3" → "A#" */
function pitchClass(note: string): string {
  return normalizeNote(note).replace(/\d+$/, '');
}

function getDefaultTranspose(): number {
  if (typeof window === 'undefined') return 2;
  const saved = window.localStorage.getItem('midi-transpose-semitones');
  return saved !== null ? Number(saved) : 2;
}

export default function ChordMatchExercise({
  chord,
  targetNotes: targetNotesProp,
  onSuccess,
}: Props) {
  const voicing = useMemo(() => createPianoVoicingFromChordSymbol(chord), [chord]);
  const [transposeSemitones, setTransposeSemitones] = useState(getDefaultTranspose);

  const handleTransposeChange = (value: number) => {
    setTransposeSemitones(value);
    window.localStorage.setItem('midi-transpose-semitones', String(value));
  };

  const { pressedNotes, lastNote, lastNoteNumber, status } = useMidiInput({ transposeSemitones });
  const [isPlaying, setIsPlaying] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const successFiredRef = useRef(false);

  useEffect(() => {
    setSucceeded(false);
    successFiredRef.current = false;
  }, [chord]);

  // All chord notes (both hands) used for piano highlighting
  const allTargetNotes = useMemo(() => {
    if (targetNotesProp) return targetNotesProp;
    if (!voicing) return [];
    return [...voicing.leftHand, ...voicing.rightHand];
  }, [targetNotesProp, voicing]);

  // The notes the user must match — right hand only (or override), by pitch class
  const targetPitchClasses = useMemo(() => {
    const notes = targetNotesProp ?? voicing?.rightHand ?? [];
    return new Set(notes.map(pitchClass));
  }, [targetNotesProp, voicing]);

  // Match by pitch class — any octave counts
  const isMatch = useMemo(() => {
    if (targetPitchClasses.size === 0 || pressedNotes.size === 0) return false;
    const pressedClasses = new Set([...pressedNotes].map(pitchClass));
    return [...targetPitchClasses].every((pc) => pressedClasses.has(pc));
  }, [targetPitchClasses, pressedNotes]);

  useEffect(() => {
    if (isMatch && !successFiredRef.current) {
      successFiredRef.current = true;
      setSucceeded(true);
      onSuccess?.();
    }
  }, [isMatch, onSuccess]);

  const handlePlay = async () => {
    if (!voicing || isPlaying) return;
    setIsPlaying(true);
    try {
      await playChordVoicing({
        leftHand: voicing.leftHand,
        rightHand: voicing.rightHand,
        tempoBpm: 72,
        playbackStyle: 'block',
        instrument: 'piano',
        duration: '1n',
      });
    } finally {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  if (!voicing) return null;

  const isConnected = status === 'connected';
  const isNoDevice = status === 'no-device';

  return (
    <Stack spacing={2}>
      {/* Chord name + listen button */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ letterSpacing: '-0.02em', lineHeight: 1 }}
          >
            {chord}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ opacity: 0.6 }}>
            Play the highlighted keys
          </Typography>
        </Box>
        <IconButton
          onClick={() => void handlePlay()}
          disabled={isPlaying}
          aria-label={`Listen to ${chord}`}
          size="small"
          sx={{
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 1.5,
            px: 1,
            gap: 0.5,
            color: 'text.secondary',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          {isPlaying ? (
            <CircularProgress size={14} color="inherit" />
          ) : (
            <PlayArrowIcon sx={{ fontSize: 16 }} />
          )}
          <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
            Listen
          </Typography>
        </IconButton>
      </Stack>

      {/* Piano keyboard */}
      <Box
        sx={{
          borderRadius: 1.5,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
          bgcolor: succeeded ? 'rgba(74, 222, 128, 0.04)' : 'rgba(0,0,0,0.2)',
          transition: 'background-color 0.4s ease',
          p: 1,
        }}
      >
        <MidiInteractivePiano
          targetNotes={allTargetNotes}
          pressedNotes={pressedNotes}
          startOctave={2}
          endOctave={6}
        />
      </Box>

      {/* Success */}
      <Collapse in={succeeded}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 18, color: '#4ADE80' }} />
          <Typography variant="body2" sx={{ color: '#4ADE80', fontWeight: 600 }}>
            Correct! Moving on…
          </Typography>
        </Stack>
      </Collapse>

      {/* MIDI status bar */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ opacity: 0.7, flexWrap: 'wrap', gap: 1 }}
      >
        {/* Connection dot */}
        <Stack direction="row" spacing={0.625} alignItems="center">
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor:
                status === 'connected'
                  ? '#4ADE80'
                  : status === 'pending'
                    ? '#F59E0B'
                    : 'text.disabled',
              boxShadow: isConnected ? '0 0 6px #4ADE8088' : 'none',
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
            {status === 'connected'
              ? lastNote
                ? `${lastNote} (MIDI ${lastNoteNumber ?? '—'})`
                : 'MIDI connected'
              : status === 'pending'
                ? 'Detecting MIDI…'
                : status === 'no-device'
                  ? 'No MIDI device'
                  : 'MIDI not supported'}
          </Typography>
        </Stack>

        {/* Transpose control — only show when connected or no-device */}
        {(isConnected || isNoDevice) && (
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <KeyboardIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <IconButton
              size="small"
              onClick={() => handleTransposeChange(transposeSemitones - 1)}
              disabled={transposeSemitones <= -12}
              sx={{ width: 18, height: 18, p: 0 }}
            >
              <RemoveIcon sx={{ fontSize: 11 }} />
            </IconButton>
            <Typography
              variant="caption"
              onClick={() => transposeSemitones !== 2 && handleTransposeChange(2)}
              sx={{
                minWidth: 28,
                textAlign: 'center',
                fontSize: '0.68rem',
                fontFamily: 'monospace',
                color: transposeSemitones !== 2 ? 'warning.main' : 'text.disabled',
                cursor: transposeSemitones !== 2 ? 'pointer' : 'default',
              }}
            >
              {transposeSemitones >= 0 ? '+' : ''}
              {transposeSemitones}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleTransposeChange(transposeSemitones + 1)}
              disabled={transposeSemitones >= 12}
              sx={{ width: 18, height: 18, p: 0 }}
            >
              <AddIcon sx={{ fontSize: 11 }} />
            </IconButton>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
