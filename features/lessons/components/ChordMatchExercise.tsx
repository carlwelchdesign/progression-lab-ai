'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { playChordVoicing } from '../../../domain/audio/audio';
import { useMidiInput } from '../hooks/useMidiInput';
import MidiInteractivePiano from './MidiInteractivePiano';
import MidiStatusBadge from './MidiStatusBadge';
import { normalizeNote } from './MidiInteractivePiano';

type Props = {
  chord: string;
  /** Called once after the user successfully plays the chord */
  onSuccess?: () => void;
};

const SUCCESS_DELAY_MS = 900;

export default function ChordMatchExercise({ chord, onSuccess }: Props) {
  const voicing = useMemo(() => createPianoVoicingFromChordSymbol(chord), [chord]);
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const { pressedNotes, lastNote, lastNoteNumber, status } = useMidiInput({ transposeSemitones });
  const [isPlaying, setIsPlaying] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const successFiredRef = useRef(false);

  // Reset when the chord changes
  useEffect(() => {
    setSucceeded(false);
    successFiredRef.current = false;
  }, [chord]);

  // Normalized target notes (right-hand voicing only, covers chord tones)
  const targetNotes = useMemo(
    () => (voicing ? voicing.rightHand.map(normalizeNote) : []),
    [voicing],
  );

  // Check if every target note is being held
  const isMatch = useMemo(() => {
    if (targetNotes.length === 0 || pressedNotes.size === 0) return false;
    const normalizedPressed = new Set([...pressedNotes].map(normalizeNote));
    return targetNotes.every((n) => normalizedPressed.has(n));
  }, [targetNotes, pressedNotes]);

  // Trigger success once
  useEffect(() => {
    if (isMatch && !succeeded && !successFiredRef.current) {
      successFiredRef.current = true;
      setSucceeded(true);
      const timer = setTimeout(() => {
        onSuccess?.();
      }, SUCCESS_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [isMatch, succeeded, onSuccess]);

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

  return (
    <Stack spacing={1.5}>
      {/* Chord name + play button */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle1" fontWeight={700}>
          Play: {chord}
        </Typography>
        <IconButton
          size="small"
          onClick={() => void handlePlay()}
          disabled={isPlaying}
          aria-label={`Play ${chord}`}
          color="primary"
        >
          {isPlaying ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
        </IconButton>
      </Stack>

      {/* Piano with target highlights + live MIDI input */}
      <MidiInteractivePiano targetNotes={targetNotes} pressedNotes={pressedNotes} />

      {/* MIDI status + octave transpose control */}
      <Box>
        <MidiStatusBadge
          status={status}
          lastNote={lastNote}
          lastNoteNumber={lastNoteNumber}
          transposeSemitones={transposeSemitones}
          onTransposeChange={setTransposeSemitones}
        />
      </Box>

      {/* Success feedback */}
      <Collapse in={succeeded}>
        <Alert
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          severity="success"
          sx={{ py: 0.5 }}
        >
          Correct! Well played.
        </Alert>
      </Collapse>

      {/* Hint: show target notes when no MIDI device */}
      {status === 'unsupported' || status === 'no-device' ? (
        <Typography variant="caption" color="text.disabled">
          Target notes: {targetNotes.join(' – ')}
        </Typography>
      ) : null}
    </Stack>
  );
}
