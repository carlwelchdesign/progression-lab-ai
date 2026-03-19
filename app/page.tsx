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
  ToggleButton,
  ToggleButtonGroup,
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
import { GUITAR_SHAPES } from '../lib/chordShapes';
import { getChordChipSx, getMoodChipSx } from '../lib/tagMetadata';
import type { Adventurousness, ChordItem, ChordSuggestionResponse } from '../lib/types';
import { playChordVoicing, playProgression } from '../lib/audio';

const GENERATOR_CACHE_KEY = 'generatorCache';
const MAX_RANDOM_SELECTIONS = 7;
const ADVENTUROUSNESS_OPTIONS: Adventurousness[] = ['safe', 'balanced', 'surprising'];
const RANDOM_MODE_OPTIONS = MODE_OPTIONS.filter((option) => option.value !== 'custom').map(
  (option) => option.value,
);
const RANDOM_GENRE_OPTIONS = GENRE_OPTIONS.filter((option) => option.value !== 'custom').map(
  (option) => option.value,
);

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomUnique<T>(items: T[], count: number): T[] {
  const pool = [...items];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

type GeneratorCache = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
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
  adventurousness: Adventurousness;
};

type ProgressionDiagramInstrument = 'piano' | 'guitar';

const NOTE_TO_FRET_ON_LOW_E: Record<string, number> = {
  E: 0,
  F: 1,
  'F#': 2,
  Gb: 2,
  G: 3,
  'G#': 4,
  Ab: 4,
  A: 5,
  'A#': 6,
  Bb: 6,
  B: 7,
  C: 8,
  'C#': 9,
  Db: 9,
  D: 10,
  'D#': 11,
  Eb: 11,
};

const NOTE_TO_FRET_ON_A: Record<string, number> = {
  A: 0,
  'A#': 1,
  Bb: 1,
  B: 2,
  C: 3,
  'C#': 4,
  Db: 4,
  D: 5,
  'D#': 6,
  Eb: 6,
  E: 7,
  F: 8,
  'F#': 9,
  Gb: 9,
  G: 10,
  'G#': 11,
  Ab: 11,
};

type GuitarShapeTemplateKey = 'major' | 'minor' | 'dominant7' | 'major7' | 'minor7' | 'sus4';
type RootString = 'lowE' | 'A';

const GUITAR_SHAPE_TEMPLATES: Record<
  RootString,
  Record<GuitarShapeTemplateKey, Array<number | 'x'>>
> = {
  lowE: {
    major: [0, 2, 2, 1, 0, 0],
    minor: [0, 2, 2, 0, 0, 0],
    dominant7: [0, 2, 0, 1, 0, 0],
    major7: [0, 2, 1, 1, 0, 0],
    minor7: [0, 2, 0, 0, 0, 0],
    sus4: [0, 2, 2, 2, 0, 0],
  },
  A: {
    major: ['x', 0, 2, 2, 2, 0],
    minor: ['x', 0, 2, 2, 1, 0],
    dominant7: ['x', 0, 2, 0, 2, 0],
    major7: ['x', 0, 2, 1, 2, 0],
    minor7: ['x', 0, 2, 0, 1, 0],
    sus4: ['x', 0, 2, 2, 3, 0],
  },
};

function getBestRootString(lowEFret: number, aFret: number): RootString {
  if (aFret <= 7 && lowEFret > 5) {
    return 'A';
  }

  return 'lowE';
}

function getTemplateFromSuffix(suffix: string): GuitarShapeTemplateKey | null {
  const normalized = suffix.trim().toLowerCase();

  if (normalized.length === 0) {
    return 'major';
  }

  if (normalized.includes('sus4')) {
    return 'sus4';
  }

  if (normalized.includes('maj7')) {
    return 'major7';
  }

  if (normalized.startsWith('m7') || normalized.startsWith('min7')) {
    return 'minor7';
  }

  if (normalized.startsWith('m') || normalized.startsWith('min')) {
    return 'minor';
  }

  if (normalized.includes('7')) {
    return 'dominant7';
  }

  if (normalized.includes('add9') || normalized.includes('sus2')) {
    return 'major';
  }

  return null;
}

function getGeneratedGuitarDiagram(chord: string) {
  const parsed = chord.trim().match(/^([A-G](?:#|b)?)(.*)$/);

  if (!parsed) {
    return null;
  }

  const [, root, suffix] = parsed;
  const lowEFret = NOTE_TO_FRET_ON_LOW_E[root];
  const aFret = NOTE_TO_FRET_ON_A[root];
  const templateKey = getTemplateFromSuffix(suffix);

  if (lowEFret === undefined || aFret === undefined || !templateKey) {
    return null;
  }

  const rootString = getBestRootString(lowEFret, aFret);
  const rootFret = rootString === 'A' ? aFret : lowEFret;
  const template = GUITAR_SHAPE_TEMPLATES[rootString][templateKey];

  return {
    title: chord,
    position: rootFret + 1,
    fingers: template.map(
      (offset, index) =>
        [6 - index, offset === 'x' ? 'x' : rootFret + offset] as [number, number | 'x'],
    ),
  };
}

function getGuitarDiagramFromChord(chord: string) {
  const shape = GUITAR_SHAPES[chord];

  if (!shape) {
    return getGeneratedGuitarDiagram(chord);
  }

  return {
    title: shape.chord,
    fingers: shape.frets.map((fret, index) => [6 - index, fret] as [number, number | 'x']),
    position: shape.baseFret ?? 1,
  };
}

function getGuitarShapeTextFromVoicing(
  voicing: ChordSuggestionResponse['nextChordSuggestions'][number]['guitarVoicing'],
): string {
  if (!voicing) {
    return 'xxxxxx';
  }

  const byString = new Map<number, number | 'x'>();

  voicing.fingers.forEach((finger) => {
    byString.set(finger.string, finger.fret);
  });

  return [6, 5, 4, 3, 2, 1]
    .map((stringNumber) => {
      const fret = byString.get(stringNumber);

      if (fret === undefined) {
        return 'x';
      }

      return typeof fret === 'number' ? String(fret) : fret;
    })
    .join('');
}

function getGuitarShapeTextFromDiagram(
  diagram: ReturnType<typeof getGuitarDiagramFromChord>,
): string {
  if (!diagram) {
    return 'xxxxxx';
  }

  const byString = new Map<number, number | 'x'>();

  diagram.fingers.forEach(([stringNumber, fret]) => {
    byString.set(stringNumber, fret);
  });

  return [6, 5, 4, 3, 2, 1]
    .map((stringNumber) => {
      const fret = byString.get(stringNumber);

      if (fret === undefined) {
        return 'x';
      }

      return typeof fret === 'number' ? String(fret) : fret;
    })
    .join('');
}

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
      adventurousness: 'balanced',
    },
    mode: 'onChange',
  });

  const mode = watch('mode');
  const genre = watch('genre');
  const customMode = watch('customMode');
  const customGenre = watch('customGenre');

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
  const [selectedProgressionGenre, setSelectedProgressionGenre] = useState('');
  const [progressionDiagramInstrument, setProgressionDiagramInstrument] =
    useState<ProgressionDiagramInstrument>('piano');
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
            genre?: string;
          };

          const normalizedGenre = parsed.genre?.trim() ?? '';
          const hasMatchingGenreOption = GENRE_OPTIONS.some(
            (option) => option.value === normalizedGenre,
          );
          let restoredGenre = '';
          if (normalizedGenre.length > 0) {
            restoredGenre = hasMatchingGenreOption ? normalizedGenre : 'custom';
          }
          const restoredCustomGenre =
            normalizedGenre.length === 0 || hasMatchingGenreOption ? '' : normalizedGenre;

          const chordNames = (parsed.chords ?? [])
            .map((chord) => (typeof chord === 'string' ? chord : (chord.name ?? '').trim()))
            .filter(Boolean);

          if (chordNames.length > 0) {
            reset({
              seedChords: chordNames.join(', '),
              mood: parsed.feel || '',
              mode: parsed.scale || '',
              customMode: '',
              genre: restoredGenre,
              customGenre: restoredCustomGenre,
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
                genre: parsed.genre ?? prev?.inputSummary.genre ?? null,
                instrument: 'both',
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
          instrument: 'both',
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

  const handleRandomize = () => {
    const uniqueChordOptions = Array.from(new Set(CHORD_OPTIONS));
    const uniqueMoodOptions = Array.from(
      new Set(MOOD_OPTIONS.map((option) => option.trim()).filter((option) => option.length > 0)),
    );

    const randomSeedChordCount = getRandomInt(
      1,
      Math.min(MAX_RANDOM_SELECTIONS, uniqueChordOptions.length),
    );
    const randomMoodCount = getRandomInt(
      1,
      Math.min(MAX_RANDOM_SELECTIONS, uniqueMoodOptions.length),
    );

    reset({
      seedChords: pickRandomUnique(uniqueChordOptions, randomSeedChordCount).join(', '),
      mood: pickRandomUnique(uniqueMoodOptions, randomMoodCount).join(', '),
      mode: pickRandomUnique(RANDOM_MODE_OPTIONS, 1)[0] ?? '',
      customMode: '',
      genre: pickRandomUnique(RANDOM_GENRE_OPTIONS, 1)[0] ?? '',
      customGenre: '',
      adventurousness: pickRandomUnique(ADVENTUROUSNESS_OPTIONS, 1)[0] ?? 'balanced',
    });
    setError('');
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
                  options={[
                    { value: '', label: 'Select a mode or scale', disabled: true },
                    ...MODE_OPTIONS,
                  ]}
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
                  options={[
                    { value: '', label: 'Select a genre', disabled: true },
                    ...GENRE_OPTIONS,
                  ]}
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
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                type="button"
                onClick={handleRandomize}
                disabled={isSubmitting || loading}
                fullWidth
              >
                Randomize Inputs
              </Button>
              <Button
                variant="contained"
                type="submit"
                form="generator-form"
                disabled={isSubmitting || loading || Object.keys(errors).length > 0}
                fullWidth
              >
                {loading ? 'Generating...' : 'Generate Ideas'}
              </Button>
            </Stack>

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
            <Box
              sx={{
                position: 'sticky',
                top: { xs: 68, md: 72 },
                zIndex: 10,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={progressionDiagramInstrument}
                onChange={(_event, value: ProgressionDiagramInstrument | null) => {
                  if (value) {
                    const scrollY = window.scrollY;
                    setProgressionDiagramInstrument(value);
                    requestAnimationFrame(() => {
                      window.scrollTo({ top: scrollY });
                    });
                  }
                }}
              >
                <ToggleButton value="piano">Piano diagrams</ToggleButton>
                <ToggleButton value="guitar">Guitar diagrams</ToggleButton>
              </ToggleButtonGroup>
            </Box>

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
            ) : null}

            <Box component="section" id="progressions">
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                sx={{ mb: 2 }}
              >
                <Typography variant="h5" component="h2">
                  Progression ideas
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: isLoadedFromSavedProgression ? '1fr' : 'repeat(3, minmax(0, 1fr))',
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
                              setSelectedProgressionGenre(
                                genre === 'custom' ? customGenre.trim() : genre,
                              );
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
                          const guitarDiagram = getGuitarDiagramFromChord(chord);

                          return (
                            <Box key={`${idea.label}-${chord}-${index}`}>
                              {index > 0 ? <Divider sx={{ mb: 2 }} /> : null}

                              <Stack spacing={1.5}>
                                <Typography variant="subtitle1" component="h4">
                                  {chord}
                                </Typography>

                                {progressionDiagramInstrument === 'piano' && voicing ? (
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

                                    <Box
                                      sx={{
                                        pt: 1,
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: '100%',
                                          maxWidth: { xs: '100%', md: '800px' },
                                        }}
                                      >
                                        <PianoChordDiagram
                                          leftHand={voicing.leftHand}
                                          rightHand={voicing.rightHand}
                                        />
                                      </Box>
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
                                ) : progressionDiagramInstrument === 'guitar' && guitarDiagram ? (
                                  <Stack spacing={1} sx={{ pt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                      Common Chord Examples
                                    </Typography>
                                    <Typography variant="body2">
                                      {chord}: {getGuitarShapeTextFromDiagram(guitarDiagram)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                      <GuitarChordDiagram
                                        title={guitarDiagram.title}
                                        position={guitarDiagram.position}
                                        fingers={guitarDiagram.fingers}
                                      />
                                    </Box>
                                    {voicing ? (
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
                                    ) : null}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    {progressionDiagramInstrument === 'piano'
                                      ? 'No piano voicing available.'
                                      : 'No guitar diagram available.'}
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
              genre={selectedProgressionGenre}
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
