'use client';

import { useRef, useState } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { playChordVoicing } from '../../../domain/audio/audio';
import type { CofKeyData } from '../data/circleOfFifthsData';
import { SCALE_DEGREE_LABELS } from '../data/circleOfFifthsData';
import TryInGeneratorButton from './TryInGeneratorButton';
import PlayableChordCard from './PlayableChordCard';

type Props = {
  selectedKey: CofKeyData;
};

function KeySignatureLabel({ n }: { n: number }) {
  if (n === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        No sharps or flats
      </Typography>
    );
  const count = Math.abs(n);
  const word = n > 0 ? 'sharp' : 'flat';
  return (
    <Typography variant="body2" color="text.secondary">
      {count} {word}
      {count !== 1 ? 's' : ''}
    </Typography>
  );
}

export default function CircleOfFifthsKeyPanel({ selectedKey }: Props) {
  // Reset to I chord whenever the selected key changes
  const [activeDiatonicIndex, setActiveDiatonicIndex] = useState(0);
  const prevKeyRef = useRef(selectedKey.semitone);
  if (prevKeyRef.current !== selectedKey.semitone) {
    prevKeyRef.current = selectedKey.semitone;
    setActiveDiatonicIndex(0);
  }

  const playingRef = useRef(false);

  const handleChordClick = async (chord: string, index: number) => {
    setActiveDiatonicIndex(index);
    if (playingRef.current) return;
    const voicing = createPianoVoicingFromChordSymbol(chord);
    if (!voicing) return;
    playingRef.current = true;
    try {
      await playChordVoicing({
        leftHand: voicing.leftHand,
        rightHand: voicing.rightHand,
        tempoBpm: 72,
        playbackStyle: 'block',
        instrument: 'piano',
        duration: '2n',
      });
    } finally {
      setTimeout(() => {
        playingRef.current = false;
      }, 800);
    }
  };

  const activeChord = selectedKey.diatonicChords[activeDiatonicIndex];
  const activeLabel = SCALE_DEGREE_LABELS[activeDiatonicIndex];

  // I, IV, V, vi chords for the generator CTA
  const generatorChords = [
    selectedKey.diatonicChords[0], // I
    selectedKey.diatonicChords[3], // IV
    selectedKey.diatonicChords[4], // V
    selectedKey.diatonicChords[5], // vi
  ];

  return (
    <Stack spacing={2} sx={{ p: { xs: 0, md: 1 } }}>
      {/* Key header */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {selectedKey.majorKey} major
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Relative minor: {selectedKey.minorKey}
          {selectedKey.enharmonic ? ` (also written as ${selectedKey.enharmonic})` : ''}
        </Typography>
      </Box>

      {/* Key signature */}
      <Box>
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Key Signature
        </Typography>
        <KeySignatureLabel n={selectedKey.sharpsFlats} />
      </Box>

      <Divider />

      {/* Diatonic chord selector */}
      <Box>
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
        >
          Diatonic Chords
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
          {selectedKey.diatonicChords.map((chord, i) => (
            <Button
              key={i}
              size="small"
              variant={i === activeDiatonicIndex ? 'contained' : 'outlined'}
              onClick={() => {
                void handleChordClick(chord, i);
              }}
              sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.72rem', fontWeight: 600 }}
            >
              <Box
                component="span"
                sx={{
                  display: 'block',
                  fontSize: '0.6rem',
                  color: i === activeDiatonicIndex ? 'inherit' : 'text.disabled',
                  lineHeight: 1,
                  fontFamily: 'monospace',
                }}
              >
                {SCALE_DEGREE_LABELS[i]}
              </Box>
              {chord}
            </Button>
          ))}
        </Box>

        {/* Piano diagram + play for the active chord */}
        <PlayableChordCard chord={activeChord} label={`${activeLabel} chord`} />
      </Box>

      <Divider />

      {/* Try in generator */}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Try the I – IV – V – vi progression in {selectedKey.majorKey}:
        </Typography>
        <TryInGeneratorButton
          chords={generatorChords}
          label={`Try ${selectedKey.majorKey} in Generator`}
        />
      </Box>
    </Stack>
  );
}
