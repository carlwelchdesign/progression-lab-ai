'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, Collapse, IconButton, Stack, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { playChordVoicing } from '../../../domain/audio/audio';
import { useMidiInput } from '../hooks/useMidiInput';
import InteractivePiano, { pitchClass } from './InteractivePiano';

type Props = {
  chord: string;
  targetNotes?: string[];
  onSuccess?: () => void;
};

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const successFiredRef = useRef(false);
  const voicingRef = useRef(voicing);
  voicingRef.current = voicing;

  const { pressedNotes, lastNote, lastNoteNumber, status } = useMidiInput({ transposeSemitones });

  const handleTransposeChange = (value: number) => {
    setTransposeSemitones(value);
    window.localStorage.setItem('midi-transpose-semitones', String(value));
  };

  const handlePlay = useCallback(async () => {
    const v = voicingRef.current;
    if (!v || isPlaying) return;
    setIsPlaying(true);
    try {
      await playChordVoicing({
        leftHand: v.leftHand,
        rightHand: v.rightHand,
        tempoBpm: 72,
        playbackStyle: 'block',
        instrument: 'piano',
        duration: '1n',
      });
    } finally {
      setTimeout(() => {
        setIsPlaying(false);
        setHasAutoPlayed(true);
      }, 1200);
    }
  }, [isPlaying]);

  // Reset and auto-play when chord changes
  useEffect(() => {
    setSucceeded(false);
    setHasAutoPlayed(false);
    successFiredRef.current = false;
    setIsPlaying(false);

    const timer = setTimeout(() => {
      void handlePlay();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chord]);

  // All chord notes for visual display on the piano
  const allTargetNotes = useMemo(() => {
    if (targetNotesProp) return targetNotesProp;
    if (!voicing) return [];
    return [...voicing.leftHand, ...voicing.rightHand];
  }, [targetNotesProp, voicing]);

  // Right-hand notes only for match detection (pitch-class, any octave)
  const targetPitchClasses = useMemo(() => {
    const notes = targetNotesProp ?? voicing?.rightHand ?? [];
    return new Set(notes.map(pitchClass));
  }, [targetNotesProp, voicing]);

  const isMatch = useMemo(() => {
    if (targetPitchClasses.size === 0 || pressedNotes.size === 0) return false;
    const pressed = new Set([...pressedNotes].map(pitchClass));
    return [...targetPitchClasses].every((pc) => pressed.has(pc));
  }, [targetPitchClasses, pressedNotes]);

  useEffect(() => {
    if (isMatch && !successFiredRef.current) {
      successFiredRef.current = true;
      setSucceeded(true);
      onSuccess?.();
    }
  }, [isMatch, onSuccess]);

  if (!voicing) return null;

  const isConnected = status === 'connected';
  const isNoDevice = status === 'no-device';

  return (
    <Stack spacing={2}>
      {/* Chord name + instruction + listen button */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ letterSpacing: '-0.02em', lineHeight: 1 }}
          >
            {chord}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: hasAutoPlayed && !succeeded ? 'primary.main' : 'text.disabled',
              opacity: hasAutoPlayed && !succeeded ? 0.9 : 0.55,
              fontWeight: hasAutoPlayed && !succeeded ? 600 : 400,
              transition: 'all 0.3s ease',
            }}
          >
            {succeeded
              ? 'Nailed it!'
              : hasAutoPlayed
                ? 'Now find those red keys ↑'
                : 'Listen first…'}
          </Typography>
        </Box>

        <IconButton
          onClick={() => void handlePlay()}
          disabled={isPlaying}
          size="small"
          aria-label={`Listen to ${chord}`}
          sx={{
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 1.5,
            px: 1,
            gap: 0.5,
            flexShrink: 0,
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
          border: '1px solid',
          borderColor: succeeded ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.08)',
          bgcolor: succeeded ? 'rgba(74, 222, 128, 0.05)' : 'rgba(0,0,0,0.25)',
          p: 0.75,
          transition: 'all 0.4s ease',
        }}
      >
        <InteractivePiano targetNotes={allTargetNotes} pressedNotes={pressedNotes} />
      </Box>

      {/* Success */}
      <Collapse in={succeeded}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleIcon sx={{ fontSize: 18, color: '#4ADE80' }} />
          <Typography variant="body2" sx={{ color: '#4ADE80', fontWeight: 600 }}>
            Correct — moving on…
          </Typography>
        </Stack>
      </Collapse>

      {/* MIDI status bar */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ opacity: 0.6, flexWrap: 'wrap', gap: 0.75 }}
      >
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
                    : 'rgba(255,255,255,0.25)',
              boxShadow: isConnected ? '0 0 5px #4ADE8077' : 'none',
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
            {status === 'connected'
              ? lastNote
                ? `${lastNote} (MIDI ${lastNoteNumber ?? '—'})`
                : 'MIDI connected — play a key'
              : status === 'pending'
                ? 'Detecting MIDI…'
                : status === 'no-device'
                  ? 'No MIDI device — connect one to play'
                  : 'MIDI not supported in this browser'}
          </Typography>
        </Stack>

        {(isConnected || isNoDevice) && (
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <IconButton
              size="small"
              onClick={() => handleTransposeChange(transposeSemitones - 1)}
              disabled={transposeSemitones <= -12}
              sx={{ width: 16, height: 16, p: 0 }}
            >
              <RemoveIcon sx={{ fontSize: 10 }} />
            </IconButton>
            <Typography
              variant="caption"
              onClick={() => transposeSemitones !== 2 && handleTransposeChange(2)}
              sx={{
                minWidth: 26,
                textAlign: 'center',
                fontSize: '0.67rem',
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
              sx={{ width: 16, height: 16, p: 0 }}
            >
              <AddIcon sx={{ fontSize: 10 }} />
            </IconButton>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
