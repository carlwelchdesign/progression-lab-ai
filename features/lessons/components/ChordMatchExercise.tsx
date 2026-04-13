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

/** Extract octave number from a note string like "C4", "Bb3" */
function noteOctave(note: string): number {
  const m = /(\d+)$/.exec(note);
  return m ? parseInt(m[1], 10) : 4;
}

/** Split a Set of MIDI pressed notes into left-hand (octave ≤ 3) and right-hand (octave ≥ 4) */
function splitByHand(notes: Set<string>): { left: Set<string>; right: Set<string> } {
  const left = new Set<string>();
  const right = new Set<string>();
  for (const note of notes) {
    if (noteOctave(note) <= 3) left.add(note);
    else right.add(note);
  }
  return { left, right };
}

/** Note chips that light up green as each target note is held */
function NoteChips({
  displayNotes,
  pressedNotes,
}: {
  displayNotes: string[];
  pressedNotes: Set<string>;
}) {
  const normalizedPressed = useMemo(
    () => new Set([...pressedNotes].map(normalizeNote)),
    [pressedNotes],
  );
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {displayNotes.map((note) => {
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
  );
}

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

  // When targetNotesProp is provided (single-note exercises), use it directly.
  // Otherwise match only the right hand of the voicing.
  const targetNotesDisplay = useMemo(
    () => targetNotesProp ?? voicing?.rightHand ?? [],
    [targetNotesProp, voicing],
  );
  const targetNotes = useMemo(() => targetNotesDisplay.map(normalizeNote), [targetNotesDisplay]);

  const isMatch = useMemo(() => {
    if (targetNotes.length === 0 || pressedNotes.size === 0) return false;
    const normalizedPressed = new Set([...pressedNotes].map(normalizeNote));
    return targetNotes.every((n) => normalizedPressed.has(n));
  }, [targetNotes, pressedNotes]);

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

  // Split live MIDI input by hand boundary (octave 3 / 4)
  const { left: leftPressed, right: rightPressed } = useMemo(
    () => splitByHand(pressedNotes),
    [pressedNotes],
  );

  // When targetNotesProp is used (single-note), show one piano; otherwise show both hands.
  const showBothHands = !targetNotesProp && !!voicing;

  const leftHandNotes = useMemo(
    () => (showBothHands ? voicing!.leftHand.map(normalizeNote) : []),
    [showBothHands, voicing],
  );
  const rightHandNotes = useMemo(() => targetNotes, [targetNotes]);

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

      {showBothHands ? (
        /* ── Two-hand layout ─────────────────────────────────────────── */
        <Stack spacing={2}>
          {/* Left hand */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Left Hand
            </Typography>
            <MidiInteractivePiano
              targetNotes={leftHandNotes}
              pressedNotes={leftPressed}
              startOctave={2}
              endOctave={3}
            />
            <Box sx={{ mt: 0.75 }}>
              <NoteChips displayNotes={voicing!.leftHand} pressedNotes={leftPressed} />
            </Box>
          </Box>

          {/* Right hand */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Right Hand
            </Typography>
            <MidiInteractivePiano
              targetNotes={rightHandNotes}
              pressedNotes={rightPressed}
              startOctave={3}
              endOctave={5}
            />
            <Box sx={{ mt: 0.75 }}>
              <NoteChips displayNotes={targetNotesDisplay} pressedNotes={rightPressed} />
            </Box>
          </Box>
        </Stack>
      ) : (
        /* ── Single piano (targetNotesProp override) ─────────────────── */
        <Box>
          <MidiInteractivePiano targetNotes={rightHandNotes} pressedNotes={pressedNotes} />
          <Box sx={{ mt: 0.75 }}>
            <NoteChips displayNotes={targetNotesDisplay} pressedNotes={pressedNotes} />
          </Box>
        </Box>
      )}

      {/* MIDI status + transpose */}
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
