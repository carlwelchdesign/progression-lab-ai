'use client';

import { Box, Stack, Typography } from '@mui/material';

import GuitarChordDiagram from './GuitarChordDiagram';
import PianoChordDiagram from './PianoChordDiagram';
import Card from '../../../components/ui/Card';
import MidiDownloadButton from '../../../components/ui/MidiDownloadButton';
import PdfDownloadButton from '../../../components/ui/PdfDownloadButton';
import { playChordPattern } from '../../../domain/audio/audio';
import type {
  AudioInstrument,
  PadPattern,
  PlaybackRegister,
  PlaybackStyle,
} from '../../../domain/audio/audio';
import type { TimeSignature } from '../../../domain/audio/audio';
import { getGuitarShapeTextFromVoicing } from '../../../domain/music/guitarDiagramUtils';
import { downloadChordMidi } from '../../../lib/midi';
import type { ChordSuggestionResponse } from '../../../lib/types';
import PlaybackToggleButton from './PlaybackToggleButton';
import { getProgressionAutoResetMs, usePlaybackToggle } from '../hooks/usePlaybackToggle';
import type { ProgressionDiagramInstrument } from '../types';

/**
 * Props for rendering next-chord recommendation cards.
 */
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
  instrument: AudioInstrument;
  octaveShift?: number;
  padPattern?: PadPattern;
  timeSignature?: TimeSignature;
  showTitle?: boolean;
  scale?: string;
  genre?: string;
};

/**
 * Displays next-chord suggestions with playback, MIDI, PDF, and diagram actions.
 */
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
  instrument,
  octaveShift = 0,
  padPattern = 'single',
  timeSignature,
  showTitle = true,
  scale,
  genre,
}: NextChordSuggestionsSectionProps) {
  const { playingId, initializingId, handlePlayToggle } = usePlaybackToggle();

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
              label="PDF"
              chartOptions={{
                title: 'Next Chord Suggestions',
                scale,
                genre,
                tempoBpm,
                chords: suggestions.map((s) => ({
                  chord: s.chord,
                  romanNumeral: s.romanNumeral,
                  voicingHint: s.voicingHint,
                  pianoVoicing: s.pianoVoicing,
                  guitarVoicingText: getGuitarShapeTextFromVoicing(s.guitarVoicing),
                  guitarDiagram: s.guitarVoicing
                    ? {
                        position: s.guitarVoicing.position,
                        fingers: s.guitarVoicing.fingers.map((finger) => [
                          finger.string,
                          finger.fret,
                        ]),
                      }
                    : null,
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
        {suggestions.map((item, index) => (
          <Card key={`${item.chord}-${item.functionExplanation}`}>
            {(() => {
              const pianoVoicing = item.pianoVoicing;
              const playId = `next-chord-${index}-${item.chord}`;

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
                      <PlaybackToggleButton
                        playTitle="Play chord"
                        stopTitle="Stop chord"
                        isPlaying={playingId === playId}
                        isInitializing={initializingId === playId}
                        onClick={() => {
                          void handlePlayToggle(
                            playId,
                            () =>
                              playChordPattern({
                                leftHand: pianoVoicing.leftHand,
                                rightHand: pianoVoicing.rightHand,
                                padPattern,
                                timeSignature,
                                loop: false,
                                tempoBpm,
                                playbackStyle,
                                attack,
                                decay,
                                humanize,
                                gate,
                                inversionRegister,
                                instrument,
                                octaveShift,
                              }),
                            getProgressionAutoResetMs(1, tempoBpm),
                          );
                        }}
                      />
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
                              voicingHint: item.voicingHint,
                              pianoVoicing: item.pianoVoicing,
                              guitarVoicingText: getGuitarShapeTextFromVoicing(item.guitarVoicing),
                              guitarDiagram: item.guitarVoicing
                                ? {
                                    position: item.guitarVoicing.position,
                                    fingers: item.guitarVoicing.fingers.map((finger) => [
                                      finger.string,
                                      finger.fret,
                                    ]),
                                  }
                                : null,
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
