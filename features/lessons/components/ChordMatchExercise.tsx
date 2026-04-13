'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
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
  /** Override the notes to match instead of deriving from chord voicing */
  targetNotes?: string[];
  /** Called once after the user successfully plays the chord */
  onSuccess?: () => void;
};

export default function ChordMatchExercise({
  chord,
  targetNotes: targetNotesProp,
  onSuccess,
}: Props) {
  const voicing = useMemo(() => createPianoVoicingFromChordSymbol(chord), [chord]);
  const [transposeSemitones, setTransposeSemitones] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.localStorage.getItem('midi-transpose-semitones');
    return saved !== null ? Number(saved) : 0;
  });

  // Persist transpose preference
  const handleTransposeChange = (value: number) => {
    setTransposeSemitones(value);
    window.localStorage.setItem('midi-transpose-semitones', String(value));
  };
  const { pressedNotes, lastNote, lastNoteNumber, status } = useMidiInput({ transposeSemitones });
  const [isPlaying, setIsPlaying] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const successFiredRef = useRef(false);

  // Reset when the chord changes
  useEffect(() => {
    setSucceeded(false);
    successFiredRef.current = false;
  }, [chord]);

  // Display names (pre-normalization) — used for chip labels so flats show as flats
  const targetNotesDisplay = useMemo(
    () => targetNotesProp ?? voicing?.rightHand ?? [],
    [targetNotesProp, voicing],
  );

  // Normalized target notes for matching
  const targetNotes = useMemo(() => targetNotesDisplay.map(normalizeNote), [targetNotesDisplay]);

  // Check if every target note is being held
  const isMatch = useMemo(() => {
    if (targetNotes.length === 0 || pressedNotes.size === 0) return false;
    const normalizedPressed = new Set([...pressedNotes].map(normalizeNote));
    return targetNotes.every((n) => normalizedPressed.has(n));
  }, [targetNotes, pressedNotes]);

  // Trigger success once — call onSuccess immediately so releasing the key before
  // a delay doesn't prevent the Next button from enabling.
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

      {/* Per-note chips — light up as each note is held */}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {targetNotesDisplay.map((note) => {
          const normalizedPressed = new Set([...pressedNotes].map(normalizeNote));
          const isHeld = normalizedPressed.has(normalizeNote(note));
          return (
            <Chip
              key={note}
              label={note}
              size="small"
              color={isHeld ? 'success' : 'default'}
              variant={isHeld ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
          );
        })}
      </Stack>

      {/* MIDI status + octave transpose control */}
      <Box>
        <MidiStatusBadge
          status={status}
          lastNote={lastNote}
          lastNoteNumber={lastNoteNumber}
          transposeSemitones={transposeSemitones}
          onTransposeChange={handleTransposeChange}
        />
      </Box>

      {/* Success feedback */}
      <Collapse in={succeeded}>
        <Alert
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          severity="success"
          sx={{ py: 0.5 }}
        >
          Correct! Moving on…
        </Alert>
      </Collapse>
    </Stack>
  );
}
