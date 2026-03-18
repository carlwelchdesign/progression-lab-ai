'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  TextField as MuiTextField,
  Typography,
  Divider,
} from '@mui/material';

import GuitarChordDiagram from '../components/GuitarChordDiagram';
import PianoChordDiagram from '../components/PianoChordDiagram';
import Card from '../components/ui/Card';
import SelectField from '../components/ui/SelectField';
import TextField from '../components/ui/TextField';
import SaveProgressionDialog from '../components/SaveProgressionDialog';
import SuccessSnackbar from '../components/ui/SuccessSnackbar';
import { CHORD_OPTIONS, GENRE_OPTIONS, MODE_OPTIONS, MOOD_OPTIONS } from '../lib/formOptions';
import { getChordChipSx, getMoodChipSx } from '../lib/tagMetadata';
import type {
  Adventurousness,
  ChordItem,
  ChordSuggestionResponse,
  InstrumentPreference,
} from '../lib/types';
import { playChordVoicing, playProgression } from '../lib/audio';

const GENERATOR_CACHE_KEY = 'generatorCache';

type GeneratorCache = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  instrument: InstrumentPreference;
  adventurousness: Adventurousness;
  data: ChordSuggestionResponse;
};

type GeneratorFormData = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  instrument: InstrumentPreference;
  adventurousness: Adventurousness;
};

export default function HomePage() {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<GeneratorFormData>({
    defaultValues: {
      seedChords: '',
      mood: '',
      mode: '',
      customMode: '',
      genre: '',
      customGenre: '',
      instrument: 'both',
      adventurousness: 'balanced',
    },
    mode: 'onChange',
  });

  const mode = watch('mode');
  const genre = watch('genre');
  const customMode = watch('customMode');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ChordSuggestionResponse | null>(null);
  const [isLoadedFromSavedProgression, setIsLoadedFromSavedProgression] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedProgressionChords, setSelectedProgressionChords] = useState<ChordItem[]>([]);
  const [selectedProgressionVoicings, setSelectedProgressionVoicings] = useState<
    ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings']
  >([]);
  const [selectedProgressionFeel, setSelectedProgressionFeel] = useState('');
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(true);

  useEffect(() => {
    try {
      const rawLoadedProgression = sessionStorage.getItem('loadedProgression');

      if (rawLoadedProgression) {
        try {
          const parsed = JSON.parse(rawLoadedProgression) as {
            title?: string;
            chords?: Array<{ name?: string } | string>;
            pianoVoicings?: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
            feel?: string;
            scale?: string;
          };

          const chordNames = (parsed.chords ?? [])
            .map((chord) => (typeof chord === 'string' ? chord : (chord.name ?? '').trim()))
            .filter(Boolean);

          if (chordNames.length > 0) {
            reset({
              seedChords: chordNames.join(', '),
              mood: parsed.feel || '',
              mode: parsed.scale || 'lydian',
              customMode: '',
              genre: 'custom',
              customGenre: '',
              instrument: 'both',
              adventurousness: 'balanced',
            });
          }

          if (parsed.feel) {
            // Mood is already set via reset above
          }

          if (parsed.scale) {
            // Mode is already set via reset above
          }

          if (chordNames.length > 0) {
            setIsLoadedFromSavedProgression(true);
            const loadedVoicings = Array.isArray(parsed.pianoVoicings) ? parsed.pianoVoicings : [];

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
          sessionStorage.removeItem(GENERATOR_CACHE_KEY);
        }

        return;
      }

      const rawGeneratorCache = sessionStorage.getItem(GENERATOR_CACHE_KEY);
      if (!rawGeneratorCache) {
        return;
      }

      try {
        const parsedCache = JSON.parse(rawGeneratorCache) as GeneratorCache;

        reset({
          seedChords: parsedCache.seedChords,
          mood: parsedCache.mood,
          mode: parsedCache.mode,
          customMode: parsedCache.customMode,
          genre: parsedCache.genre,
          customGenre: parsedCache.customGenre,
          instrument: parsedCache.instrument,
          adventurousness: parsedCache.adventurousness,
        });

        setIsLoadedFromSavedProgression(false);
        setData(parsedCache.data);
      } catch (err) {
        console.error('Failed to restore generator cache from session storage:', err);
        sessionStorage.removeItem(GENERATOR_CACHE_KEY);
      }
    } finally {
      setIsRestoringState(false);
    }
  }, [reset]);

  const onSubmit = async (formData: GeneratorFormData) => {
    setError('');
    setIsLoadedFromSavedProgression(false);

    const resolvedMode = formData.mode === 'custom' ? formData.customMode.trim() : formData.mode;
    const resolvedGenre =
      formData.genre === 'custom' ? formData.customGenre.trim() : formData.genre;

    if (!resolvedMode) {
      setError('Please enter a custom mode or scale.');
      return;
    }

    if (!resolvedGenre) {
      setError('Please enter a custom genre.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/chord-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedChords: formData.seedChords
            .split(',')
            .map((chord) => chord.trim())
            .filter(Boolean),
          mood: formData.mood,
          mode: resolvedMode,
          genre: resolvedGenre,
          instrument: formData.instrument,
          adventurousness: formData.adventurousness,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const json = (await response.json()) as ChordSuggestionResponse;
      setData(json);

      const cachePayload: GeneratorCache = {
        seedChords: formData.seedChords,
        mood: formData.mood,
        mode: formData.mode,
        customMode: formData.customMode,
        genre: formData.genre,
        customGenre: formData.customGenre,
        instrument: formData.instrument,
        adventurousness: formData.adventurousness,
        data: json,
      };

      sessionStorage.setItem(GENERATOR_CACHE_KEY, JSON.stringify(cachePayload));
    } catch (err) {
      console.error(err);
      setError('Could not generate suggestions.');
    } finally {
      setLoading(false);
    }
  };

  if (isRestoringState) {
    return (
      <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Box id="generator">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Image src="/icon.png" alt="ProgressionLab.AI logo" width={48} height={48} />
              <Typography variant="h3" component="h1">
                ProgressionLab
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Enter a few chords, a mood, and a mode. Get back progression ideas, structure
              suggestions, and simple guitar/piano diagrams.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 10,
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              Restoring your last generator session...
            </Typography>
          </Box>
        </Stack>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box id="generator">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Image src="/icon.png" alt="ProgressionLab.AI logo" width={48} height={48} />
            <Typography variant="h3" component="h1">
              ProgressionLab
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Enter a few chords, a mood, and a mode. Get back progression ideas, structure
            suggestions, and simple guitar/piano diagrams.
          </Typography>
        </Box>

        <Card>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
            }}
            id="generator-form"
          >
            <Controller
              name="seedChords"
              control={control}
              rules={{
                required: 'Seed chords are required',
                validate: (value) => {
                  return value.trim().length > 0 || 'Please enter at least one chord';
                },
              }}
              render={({ field: { value, onChange }, fieldState: { error } }) => {
                const chordArray = value
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean);
                return (
                  <Autocomplete<string, true, false, true>
                    multiple
                    freeSolo
                    options={CHORD_OPTIONS}
                    value={chordArray}
                    onChange={(_, newValue) => {
                      onChange(newValue.join(', '));
                    }}
                    disabled={isSubmitting || loading}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            variant="outlined"
                            sx={getChordChipSx(option)}
                            {...tagProps}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <MuiTextField
                        {...params}
                        label="Seed chords"
                        placeholder={chordArray.length > 0 ? '' : 'Fmaj7, F#m7'}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                );
              }}
            />

            <Controller
              name="mood"
              control={control}
              rules={{
                required: 'Mood is required',
              }}
              render={({ field: { value, onChange }, fieldState: { error } }) => {
                const moodArray = value
                  .split(',')
                  .map((m) => m.trim())
                  .filter(Boolean);
                return (
                  <Autocomplete<string, true, false, true>
                    multiple
                    freeSolo
                    options={MOOD_OPTIONS}
                    value={moodArray}
                    onChange={(_, newValue) => {
                      onChange(newValue.join(', '));
                    }}
                    disabled={isSubmitting || loading}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            variant="outlined"
                            sx={getMoodChipSx(option)}
                            {...tagProps}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <MuiTextField
                        {...params}
                        label="Mood"
                        placeholder={moodArray.length > 0 ? '' : 'dreamy, dark, hopeful'}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                );
              }}
            />

            <Controller
              name="mode"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Mode / scale"
                  {...field}
                  options={MODE_OPTIONS}
                  disabled={isSubmitting || loading}
                />
              )}
            />

            {mode === 'custom' ? (
              <Controller
                name="customMode"
                control={control}
                rules={{
                  required: 'Please enter a custom mode or scale',
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    label="Custom mode / scale"
                    {...field}
                    placeholder="Hungarian minor, altered scale, etc."
                    disabled={isSubmitting || loading}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            ) : null}

            <Controller
              name="genre"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Genre"
                  {...field}
                  options={GENRE_OPTIONS}
                  disabled={isSubmitting || loading}
                />
              )}
            />

            {genre === 'custom' ? (
              <Controller
                name="customGenre"
                control={control}
                rules={{
                  required: 'Please enter a custom genre',
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    label="Custom genre"
                    {...field}
                    placeholder="UK garage, synthwave, bossa nova, etc."
                    disabled={isSubmitting || loading}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            ) : null}

            <Controller
              name="instrument"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Instrument"
                  {...field}
                  options={[
                    { value: 'both', label: 'Both' },
                    { value: 'guitar', label: 'Guitar' },
                    { value: 'piano', label: 'Piano' },
                  ]}
                  disabled={isSubmitting || loading}
                />
              )}
            />

            <Controller
              name="adventurousness"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Adventurousness"
                  {...field}
                  options={[
                    { value: 'safe', label: 'Safe' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'surprising', label: 'Surprising' },
                  ]}
                  disabled={isSubmitting || loading}
                />
              )}
            />
          </Box>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              type="submit"
              disabled={isSubmitting || loading || Object.keys(errors).length > 0}
            >
              {loading ? 'Generating...' : 'Generate Ideas'}
            </Button>

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </Card>

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
            {!isLoadedFromSavedProgression ? (
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
                    </Card>
                  ))}
                </Box>
              </Box>
            ) : null}

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
                  <Card key={idea.label}>
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
                                idea.chords.map((chord) => ({ name: chord, beats: 1 })),
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
                  </Card>
                ))}
              </Box>
            </Box>

            {!isLoadedFromSavedProgression ? (
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
                    <Card key={`${section.section}-${section.bars}`}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {section.section} · {section.bars} bars
                      </Typography>
                      <Typography variant="body2">{section.harmonicIdea}</Typography>
                    </Card>
                  ))}
                </Box>
              </Box>
            ) : null}

            <SaveProgressionDialog
              open={saveDialogOpen}
              onClose={() => setSaveDialogOpen(false)}
              chords={selectedProgressionChords}
              pianoVoicings={selectedProgressionVoicings}
              feel={selectedProgressionFeel}
              scale={mode === 'custom' ? customMode : mode}
              onSuccess={() => {
                setSaveDialogOpen(false);
                setSuccessMessageOpen(true);
              }}
            />
            <SuccessSnackbar
              open={successMessageOpen}
              message="Progression saved!"
              onClose={() => setSuccessMessageOpen(false)}
            />
          </>
        ) : null}
      </Stack>
    </Container>
  );
}
