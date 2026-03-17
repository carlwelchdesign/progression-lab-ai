'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
  Divider,
} from '@mui/material';

import GuitarChordDiagram from '../components/GuitarChordDiagram';
import PianoChordDiagram from '../components/PianoChordDiagram';
import AppCard from '../components/ui/AppCard';
import AppSelectField from '../components/ui/AppSelectField';
import AppTextField from '../components/ui/AppTextField';
import SaveProgressionDialog from '../components/SaveProgressionDialog';
import type {
  Adventurousness,
  ChordItem,
  ChordSuggestionResponse,
  InstrumentPreference
} from '../lib/types';
import { playChordVoicing, playProgression } from '../lib/audio';

const MODE_OPTIONS = [
  { value: 'ionian', label: 'Ionian (Major)' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'aeolian', label: 'Aeolian (Natural Minor)' },
  { value: 'locrian', label: 'Locrian' },
  { value: 'major pentatonic', label: 'Major Pentatonic' },
  { value: 'minor pentatonic', label: 'Minor Pentatonic' },
  { value: 'harmonic minor', label: 'Harmonic Minor' },
  { value: 'melodic minor', label: 'Melodic Minor' },
  { value: 'blues', label: 'Blues' },
  { value: 'whole tone', label: 'Whole Tone' },
  { value: 'diminished', label: 'Diminished' },
  { value: 'chromatic', label: 'Chromatic' },
  { value: 'custom', label: 'Custom' },
];

const GENRE_OPTIONS = [
  { value: 'house', label: 'House' },
  { value: 'piano house', label: 'Piano House' },
  { value: 'deep house', label: 'Deep House' },
  { value: 'disco house', label: 'Disco House' },
  { value: 'tech house', label: 'Tech House' },
  { value: 'funk / disco', label: 'Funk / Disco' },
  { value: 'pop', label: 'Pop' },
  { value: 'indie pop', label: 'Indie Pop' },
  { value: 'r&b / neo soul', label: 'R&B / Neo Soul' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'lo-fi', label: 'Lo-fi' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'edm', label: 'EDM' },
  { value: 'afro house', label: 'Afro House' },
  { value: 'progressive house', label: 'Progressive House' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'rock', label: 'Rock' },
  { value: 'folk', label: 'Folk' },
  { value: 'custom', label: 'Custom' },
];

export default function HomePage() {
  const [seedChords, setSeedChords] = useState('Fmaj7, F#m7');
  const [mood, setMood] = useState('dreamy, emotional, uplifting');
  const [mode, setMode] = useState('lydian');
  const [customMode, setCustomMode] = useState('');
  const [genre, setGenre] = useState('piano house');
  const [customGenre, setCustomGenre] = useState('');
  const [instrument, setInstrument] = useState<InstrumentPreference>('both');
  const [adventurousness, setAdventurousness] =
    useState<Adventurousness>('balanced');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ChordSuggestionResponse | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedProgressionChords, setSelectedProgressionChords] = useState<ChordItem[]>([]);
  const [selectedProgressionVoicings, setSelectedProgressionVoicings] = useState<ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings']>([]);
  const [selectedProgressionFeel, setSelectedProgressionFeel] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('loadedProgression');
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        title?: string;
        chords?: Array<{ name?: string } | string>;
        pianoVoicings?: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
        feel?: string;
        scale?: string;
      };

      const chordNames = (parsed.chords ?? [])
        .map((chord) =>
          typeof chord === 'string' ? chord : (chord.name ?? '').trim()
        )
        .filter(Boolean);

      if (chordNames.length > 0) {
        setSeedChords(chordNames.join(', '));
      }

      if (parsed.feel) {
        setMood(parsed.feel);
      }

      if (parsed.scale) {
        setMode(parsed.scale);
      }

      if (chordNames.length > 0) {
        const loadedVoicings = Array.isArray(parsed.pianoVoicings)
          ? parsed.pianoVoicings
          : [];

        setData((prev) => ({
          inputSummary: {
            seedChords: chordNames,
            mood: parsed.feel ?? prev?.inputSummary.mood ?? null,
            mode: parsed.scale ?? prev?.inputSummary.mode ?? null,
            genre: prev?.inputSummary.genre ?? null,
            instrument: prev?.inputSummary.instrument ?? null,
            adventurousness: prev?.inputSummary.adventurousness ?? null,
          },
          nextChordSuggestions: prev?.nextChordSuggestions ?? [],
          progressionIdeas: [
            {
              label: parsed.title || 'Loaded progression',
              chords: chordNames,
              feel: parsed.feel || 'Loaded from saved progression',
              performanceTip: null,
              pianoVoicings: loadedVoicings,
            },
          ],
          structureSuggestions: prev?.structureSuggestions ?? [],
        }));
      }
    } catch (err) {
      console.error('Failed to load saved progression from session storage:', err);
    } finally {
      sessionStorage.removeItem('loadedProgression');
    }
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const resolvedMode = mode === 'custom' ? customMode.trim() : mode;
    const resolvedGenre = genre === 'custom' ? customGenre.trim() : genre;

    if (!resolvedMode) {
      setError('Please enter a custom mode or scale.');
      setLoading(false);
      return;
    }

    if (!resolvedGenre) {
      setError('Please enter a custom genre.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chord-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedChords: seedChords
            .split(',')
            .map((chord) => chord.trim())
            .filter(Boolean),
          mood,
          mode: resolvedMode,
          genre: resolvedGenre,
          instrument,
          adventurousness,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const json = (await response.json()) as ChordSuggestionResponse;
      setData(json);
    } catch (err) {
      console.error(err);
      setError('Could not generate suggestions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box id="generator">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Image
              src="/icon.png"
              alt="ProgressionLab.AI logo"
              width={48}
              height={48}
            />
            <Typography variant="h3" component="h1">
              ProgressionLab
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Enter a few chords, a mood, and a mode. Get back progression ideas,
            structure suggestions, and simple guitar/piano diagrams.
          </Typography>
        </Box>

        <AppCard>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <AppTextField
              label="Seed chords"
              value={seedChords}
              onChange={(e) => setSeedChords(e.target.value)}
              placeholder="Fmaj7, F#m7"
            />

            <AppTextField
              label="Mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="dreamy, dark, hopeful"
            />

            <AppSelectField
              label="Mode / scale"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              options={MODE_OPTIONS}
            />

            {mode === 'custom' ? (
              <AppTextField
                label="Custom mode / scale"
                value={customMode}
                onChange={(e) => setCustomMode(e.target.value)}
                placeholder="Hungarian minor, altered scale, etc."
              />
            ) : null}

            <AppSelectField
              label="Genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              options={GENRE_OPTIONS}
            />

            {genre === 'custom' ? (
              <AppTextField
                label="Custom genre"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="UK garage, synthwave, bossa nova, etc."
              />
            ) : null}

            <AppSelectField
              label="Instrument"
              value={instrument}
              onChange={(e) =>
                setInstrument(e.target.value as InstrumentPreference)
              }
              options={[
                { value: 'both', label: 'Both' },
                { value: 'guitar', label: 'Guitar' },
                { value: 'piano', label: 'Piano' },
              ]}
            />

            <AppSelectField
              label="Adventurousness"
              value={adventurousness}
              onChange={(e) =>
                setAdventurousness(e.target.value as Adventurousness)
              }
              options={[
                { value: 'safe', label: 'Safe' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'surprising', label: 'Surprising' },
              ]}
            />
          </Box>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Ideas'}
            </Button>

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </AppCard>

        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              Generating suggestions...
            </Typography>
          </Box>
        )}

        {data && !loading ? (
          <>
            <Box component="section" id="suggestions">
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Next chord suggestions
              </Typography>
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
                {data.nextChordSuggestions.map((item) => (
                  <AppCard
                    key={`${item.chord}-${item.functionExplanation}`}
                  >
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
                    {item.pianoVoicing ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Left hand:</strong> {item.pianoVoicing.leftHand.join(', ')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Right hand:</strong> {item.pianoVoicing.rightHand.join(', ')}
                        </Typography>
                      </Box>
                    ) : null}

                    <Box
                      sx={{
                        mt: 2,
                        display: {
                          xs: 'block',
                          lg: 'grid',
                        },
                        gridTemplateColumns: {
                          xs: '1fr',
                          lg: '220px minmax(0, 1fr)',
                        },
                        gap: 2,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        justifyItems: 'center',
                      }}
                    >
                      {item.guitarVoicing && (
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
                              : [finger.string, finger.fret]
                          )}
                          barres={item.guitarVoicing.barres.map((barre) => ({
                            fromString: barre.fromString,
                            toString: barre.toString,
                            fret: barre.fret,
                            text: barre.text ?? undefined,
                          }))}
                        />
                      )}
                      {item.pianoVoicing ? (
                        <Box
                          sx={{
                            width: '100%',
                            maxWidth: { xs: '100%', lg: '700px' },
                            alignSelf: 'center',
                          }}
                        >
                          <PianoChordDiagram
                            leftHand={item.pianoVoicing.leftHand}
                            rightHand={item.pianoVoicing.rightHand}
                          />
                        </Box>
                      ) : null}
                    </Box>
                  </AppCard>
                ))}
              </Box>
            </Box>

            <Box component="section" id="progressions">
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Progression ideas
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                {data.progressionIdeas.map((idea) => (
                  <AppCard key={idea.label}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {idea.label}
                        </Typography>

                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: 'primary.main',
                          }}
                        >
                          {idea.chords.join(' → ')}
                        </Typography>
                      </Box>

                      <Typography variant="body2">{idea.feel}</Typography>

                      {idea.performanceTip ? (
                        <Typography variant="body2" color="text.secondary">
                          {idea.performanceTip}
                        </Typography>
                      ) : null}

                      {idea.pianoVoicings.length > 0 ? (
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => playProgression(idea.pianoVoicings)}
                          >
                            Play progression
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedProgressionChords(
                                idea.chords.map((chord) => ({ name: chord, beats: 1 }))
                              );
                              setSelectedProgressionVoicings(idea.pianoVoicings);
                              setSelectedProgressionFeel(idea.feel);
                              setSaveDialogOpen(true);
                            }}
                          >
                            Save
                          </Button>
                        </Stack>
                      ) : null}

                      <Stack spacing={2}>
                        {idea.chords.map((chord, index) => {
                          const voicing = idea.pianoVoicings[index];

                          return (
                            <Box key={`${idea.label}-${chord}-${index}`}>
                              {index > 0 ? <Divider sx={{ mb: 2 }} /> : null}

                              <Stack spacing={1.5}>
                                <Typography variant="subtitle1" component="h4">
                                  {chord}
                                </Typography>

                                {voicing ? (
                                  <>
                                    <Stack spacing={0.5}>
                                      <Typography variant="body2">
                                        <Box component="span" sx={{ fontWeight: 700 }}>
                                          LH:
                                        </Box>{' '}
                                        {voicing.leftHand.join(', ')}
                                      </Typography>

                                      <Typography variant="body2">
                                        <Box component="span" sx={{ fontWeight: 700 }}>
                                          RH:
                                        </Box>{' '}
                                        {voicing.rightHand.join(', ')}
                                      </Typography>
                                    </Stack>

                                    <Box sx={{ pt: 1 }}>
                                      <PianoChordDiagram
                                        leftHand={voicing.leftHand}
                                        rightHand={voicing.rightHand}
                                      />
                                    </Box>

                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() =>
                                          playChordVoicing({
                                            leftHand: voicing.leftHand,
                                            rightHand: voicing.rightHand,
                                          })
                                        }
                                      >
                                        Play chord
                                      </Button>
                                    </Stack>
                                  </>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No voicing available.
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </AppCard>
                ))}
              </Box>
            </Box>

            <Box component="section" id="structure">
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Structure suggestions
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                {data.structureSuggestions.map((section) => (
                  <AppCard key={`${section.section}-${section.bars}`}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {section.section} · {section.bars} bars
                    </Typography>
                    <Typography variant="body2">{section.harmonicIdea}</Typography>
                  </AppCard>
                ))}
              </Box>
            </Box>

            <SaveProgressionDialog
              open={saveDialogOpen}
              onClose={() => setSaveDialogOpen(false)}
              chords={selectedProgressionChords}
              pianoVoicings={selectedProgressionVoicings}
              feel={selectedProgressionFeel}
              scale={mode === 'custom' ? customMode : mode}
              onSuccess={() => {
                setSaveDialogOpen(false);
                alert('Progression saved!');
              }}
            />
          </>
        ) : null}
      </Stack>
    </Container>
  );
}