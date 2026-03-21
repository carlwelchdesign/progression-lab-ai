'use client';

import { Box, Button, Stack, Typography } from '@mui/material';

import GuitarChordDiagram from '../GuitarChordDiagram';
import PianoChordDiagram from '../PianoChordDiagram';
import Card from '../ui/Card';
import MidiDownloadButton from '../ui/MidiDownloadButton';
import PdfDownloadButton from '../ui/PdfDownloadButton';
import { playChordVoicing } from '../../lib/audio';
import type { PlaybackRegister, PlaybackStyle } from '../../lib/audio';
import { getGuitarShapeTextFromVoicing } from '../../lib/guitarDiagramUtils';
import { downloadChordMidi } from '../../lib/midi';
import type { ChordSuggestionResponse } from '../../lib/types';
import type { ProgressionDiagramInstrument } from './types';

type NextChordSuggestionsSectionProps = {
  suggestions: ChordSuggestionResponse['nextChordSuggestions'];
  progressionDiagramInstrument: ProgressionDiagramInstrument;
  tempoBpm: number;
  playbackStyle: PlaybackStyle;
  attack?: number;
  decay?: number;
  humanize?: number;
  gate?: number;
  inversionRegister?: PlaybackRegister;
  showTitle?: boolean;
  scale?: string;
  genre?: string;
};

export default function NextChordSuggestionsSection({
  suggestions,
  progressionDiagramInstrument,
  tempoBpm,
  playbackStyle,
  attack,
  decay,
  humanize,
  gate,
  inversionRegister,
  showTitle = true,
  scale,
  genre,
}: NextChordSuggestionsSectionProps) {
  return (
    <Box component="section" id="suggestions">
      {showTitle ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2">
            Next chord suggestions
          </Typography>
          {suggestions.length > 0 ? (
            <PdfDownloadButton
              variant="outlined"
              size="small"
              label="Export PDF"
              chartOptions={{
                title: 'Next Chord Suggestions',
                scale,
                genre,
                tempoBpm,
                chords: suggestions.map((s) => ({
                  chord: s.chord,
                  romanNumeral: s.romanNumeral,
                  functionExplanation: s.functionExplanation,
                  voicingHint: s.voicingHint,
                  pianoVoicing: s.pianoVoicing,
                  guitarVoicingText: getGuitarShapeTextFromVoicing(s.guitarVoicing),
                  tensionLevel: s.tensionLevel,
                })),
              }}
            />
          ) : null}
        </Stack>
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
            {(() => {
              const pianoVoicing = item.pianoVoicing;

              return (
                <>
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
                  {pianoVoicing ? (
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                          playChordVoicing({
                            leftHand: pianoVoicing.leftHand,
                            rightHand: pianoVoicing.rightHand,
                            tempoBpm,
                            playbackStyle,
                            attack,
                            decay,
                            humanize,
                            gate,
                            inversionRegister,
                          })
                        }
                      >
                        Play chord
                      </Button>
                      <MidiDownloadButton
                        variant="outlined"
                        size="small"
                        onClick={() => downloadChordMidi(item.chord, pianoVoicing, tempoBpm)}
                      />
                      <PdfDownloadButton
                        variant="outlined"
                        size="small"
                        chartOptions={{
                          title: item.chord,
                          scale,
                          genre,
                          tempoBpm,
                          chords: [
                            {
                              chord: item.chord,
                              romanNumeral: item.romanNumeral,
                              functionExplanation: item.functionExplanation,
                              voicingHint: item.voicingHint,
                              pianoVoicing: item.pianoVoicing,
                              guitarVoicingText: getGuitarShapeTextFromVoicing(item.guitarVoicing),
                              tensionLevel: item.tensionLevel,
                            },
                          ],
                        }}
                      />
                    </Stack>
                  ) : null}
                  {progressionDiagramInstrument === 'piano' && pianoVoicing ? (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>Left hand:</strong> {pianoVoicing.leftHand.join(', ')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Right hand:</strong> {pianoVoicing.rightHand.join(', ')}
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
                    {progressionDiagramInstrument === 'piano' && pianoVoicing ? (
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <Box
                          sx={{
                            width: '100%',
                            maxWidth: { xs: '100%', md: '800px' },
                          }}
                        >
                          <PianoChordDiagram
                            leftHand={pianoVoicing.leftHand}
                            rightHand={pianoVoicing.rightHand}
                          />
                        </Box>
                      </Box>
                    ) : null}
                  </Box>
                </>
              );
            })()}
          </Card>
        ))}
      </Box>
    </Box>
  );
}
