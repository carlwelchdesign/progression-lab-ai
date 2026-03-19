'use client';

import { Box, Button, Typography } from '@mui/material';

import GuitarChordDiagram from '../GuitarChordDiagram';
import PianoChordDiagram from '../PianoChordDiagram';
import Card from '../ui/Card';
import { playChordVoicing } from '../../lib/audio';
import { getGuitarShapeTextFromVoicing } from '../../lib/guitarDiagramUtils';
import type { ChordSuggestionResponse } from '../../lib/types';
import type { ProgressionDiagramInstrument } from './types';

type NextChordSuggestionsSectionProps = {
  suggestions: ChordSuggestionResponse['nextChordSuggestions'];
  progressionDiagramInstrument: ProgressionDiagramInstrument;
  showTitle?: boolean;
};

export default function NextChordSuggestionsSection({
  suggestions,
  progressionDiagramInstrument,
  showTitle = true,
}: NextChordSuggestionsSectionProps) {
  return (
    <Box component="section" id="suggestions">
      {showTitle ? (
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Next chord suggestions
        </Typography>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(1, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {suggestions.map((item) => (
          <Card key={`${item.chord}-${item.functionExplanation}`}>
            <Typography variant="h6" component="h3" gutterBottom>
              {item.chord}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {item.functionExplanation}
            </Typography>
            {item.romanNumeral ? (
              <Typography variant="body2">
                <strong>Roman numeral:</strong> {item.romanNumeral}
              </Typography>
            ) : null}
            <Typography variant="body2">
              <strong>Tension:</strong> {item.tensionLevel}/5
            </Typography>
            <Typography variant="body2">
              <strong>Confidence:</strong> {item.confidence}/5
            </Typography>
            {item.voicingHint ? (
              <Typography variant="body2">
                <strong>Voicing hint:</strong> {item.voicingHint}
              </Typography>
            ) : null}
            {item.pianoVoicing ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() =>
                    playChordVoicing({
                      leftHand: item.pianoVoicing?.leftHand ?? [],
                      rightHand: item.pianoVoicing?.rightHand ?? [],
                    })
                  }
                >
                  Play chord
                </Button>
              </div>
            ) : null}
            {progressionDiagramInstrument === 'piano' && item.pianoVoicing ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Left hand:</strong> {item.pianoVoicing.leftHand.join(', ')}
                </Typography>
                <Typography variant="body2">
                  <strong>Right hand:</strong> {item.pianoVoicing.rightHand.join(', ')}
                </Typography>
              </Box>
            ) : null}

            {progressionDiagramInstrument === 'guitar' ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Common Chord Examples
                </Typography>
                <Typography variant="body2">
                  {item.chord}: {getGuitarShapeTextFromVoicing(item.guitarVoicing)}
                </Typography>
              </Box>
            ) : null}

            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {progressionDiagramInstrument === 'guitar' && item.guitarVoicing && (
                <GuitarChordDiagram
                  title={item.guitarVoicing.title}
                  position={
                    typeof item.guitarVoicing.position === 'number' &&
                    item.guitarVoicing.position >= 1
                      ? item.guitarVoicing.position
                      : 1
                  }
                  fingers={item.guitarVoicing.fingers.map((finger) =>
                    finger.finger
                      ? [finger.string, finger.fret, finger.finger]
                      : [finger.string, finger.fret],
                  )}
                  barres={item.guitarVoicing.barres.map((barre) => ({
                    fromString: barre.fromString,
                    toString: barre.toString,
                    fret: barre.fret,
                    text: barre.text ?? undefined,
                  }))}
                />
              )}
              {progressionDiagramInstrument === 'piano' && item.pianoVoicing ? (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: { xs: '100%', md: '800px' },
                    }}
                  >
                    <PianoChordDiagram
                      leftHand={item.pianoVoicing.leftHand}
                      rightHand={item.pianoVoicing.rightHand}
                    />
                  </Box>
                </Box>
              ) : null}
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
