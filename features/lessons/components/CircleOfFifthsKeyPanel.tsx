'use client';

import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import type { CofKeyData } from '../data/circleOfFifthsData';
import { SCALE_DEGREE_LABELS } from '../data/circleOfFifthsData';
import TryInGeneratorButton from './TryInGeneratorButton';

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
  const symbol = n > 0 ? '♯' : '♭';
  const count = Math.abs(n);
  return (
    <Typography variant="body2" color="text.secondary">
      {count} {symbol === '♯' ? 'sharp' : 'flat'}
      {count !== 1 ? 's' : ''}
    </Typography>
  );
}

export default function CircleOfFifthsKeyPanel({ selectedKey }: Props) {
  // I, IV, V, vi chords for the generator CTA
  const generatorChords = [
    selectedKey.diatonicChords[0], // I
    selectedKey.diatonicChords[3], // IV
    selectedKey.diatonicChords[4], // V
    selectedKey.diatonicChords[5], // vi
  ];

  return (
    <Stack spacing={2} sx={{ p: { xs: 0, md: 1 } }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {selectedKey.majorKey} major
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Relative minor: {selectedKey.minorKey}
          {selectedKey.enharmonic ? ` (also written as ${selectedKey.enharmonic})` : ''}
        </Typography>
      </Box>

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

      <Box>
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
        >
          Diatonic Chords
        </Typography>
        <Stack spacing={0.75}>
          {selectedKey.diatonicChords.map((chord, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  width: 28,
                  textAlign: 'right',
                  color: 'text.disabled',
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                }}
              >
                {SCALE_DEGREE_LABELS[i]}
              </Typography>
              <Chip label={chord} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
            </Stack>
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Try the I – IV – V – vi progression in {selectedKey.majorKey} in the generator:
        </Typography>
        <TryInGeneratorButton
          chords={generatorChords}
          label={`Try ${selectedKey.majorKey} in Generator`}
        />
      </Box>
    </Stack>
  );
}
