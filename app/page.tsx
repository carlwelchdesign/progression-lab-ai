'use client';

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewIcon from '@mui/icons-material/GridView';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import SaveProgressionDialog from '../components/SaveProgressionDialog';
import SuccessSnackbar from '../components/ui/SuccessSnackbar';
import GeneratorFormCard from '../components/home/GeneratorFormCard';
import GeneratedChordGridDialog from '../components/home/GeneratedChordGridDialog';
import GeneratorHeader from '../components/home/GeneratorHeader';
import InstrumentToggle from '../components/home/InstrumentToggle';
import PlaybackSettingsButton from '../components/home/PlaybackSettingsButton';
import RestoringState from '../components/home/RestoringState';
import usePlaybackSettings from '../components/home/usePlaybackSettings';
import useGeneratorSessionCache from '../components/home/useGeneratorSessionCache';
import type { GeneratorFormData, ProgressionDiagramInstrument } from '../components/home/types';
import {
  ADVENTUROUSNESS_OPTIONS,
  CHORD_OPTIONS,
  GENRE_INPUT_OPTIONS,
  MODE_INPUT_OPTIONS,
  MOOD_OPTIONS,
  STYLE_REFERENCE_OPTIONS,
} from '../lib/formOptions';
import type { ChordItem, ChordSuggestionResponse, GuitarVoicing } from '../lib/types';

const MAX_RANDOM_SELECTIONS = 7;
const ADVENTUROUSNESS_INPUT_OPTIONS = [...ADVENTUROUSNESS_OPTIONS];
const RANDOM_MODE_OPTIONS = MODE_INPUT_OPTIONS;
const RANDOM_GENRE_OPTIONS = GENRE_INPUT_OPTIONS;
const NextChordSuggestionsSection = lazy(
  () => import('../components/home/NextChordSuggestionsSection'),
);
const ProgressionIdeasSection = lazy(() => import('../components/home/ProgressionIdeasSection'));
const StructureSuggestionsSection = lazy(
  () => import('../components/home/StructureSuggestionsSection'),
);
const INITIAL_NEXT_SUGGESTIONS = 3;
const INITIAL_PROGRESSION_IDEAS = 3;
const INITIAL_STRUCTURE_SUGGESTIONS = 3;
const NEXT_SUGGESTIONS_CHUNK_SIZE = 3;
const PROGRESSION_IDEAS_CHUNK_SIZE = 3;
const STRUCTURE_SUGGESTIONS_CHUNK_SIZE = 3;
const PROGRESSIVE_REVEAL_DELAY_MS = 24;

type ResultSectionConfig = {
  key: 'next' | 'progressions' | 'structure';
  shouldRender: boolean;
  fallbackLabel: string;
  render: (isCollapsibleLayout: boolean) => React.ReactNode;
};

/**
 * Returns an integer in the inclusive [min, max] range.
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffles input items and returns the first `count` unique values.
 */
function pickRandomUnique<T>(items: T[], count: number): T[] {
  const pool = [...items];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

/**
 * Home page container for generator form, playback controls, and result sections.
 */
export default function HomePage() {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<GeneratorFormData>({
    defaultValues: {
      seedChords: '',
      mood: '',
      mode: '',
      customMode: '',
      genre: '',
      customGenre: '',
      styleReference: '',
      adventurousness: 'balanced',
      tempoBpm: 100,
    },
    mode: 'onChange',
  });

  const mode = watch('mode');
  const genre = watch('genre');
  const tempoBpm = watch('tempoBpm');

  const handleTempoBpmChange = useCallback(
    (value: number) => {
      const roundedValue = Number.isFinite(value) ? Math.round(value) : 100;
      const normalizedValue = Math.min(240, Math.max(40, roundedValue));
      setValue('tempoBpm', normalizedValue, {
        shouldDirty: true,
        shouldValidate: false,
      });
    },
    [setValue],
  );

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
  const {
    settings: playbackSettings,
    changeHandlers: playbackSettingsChangeHandlers,
    setters: playbackSettingsSetters,
  } = usePlaybackSettings();
  const {
    playbackStyle,
    attack,
    decay,
    humanize,
    gate,
    inversionRegister,
    instrument,
    octaveShift,
    timeSignature,
    metronomeEnabled,
    metronomeVolume,
  } = playbackSettings;

  const [isGeneratedChordGridOpen, setIsGeneratedChordGridOpen] = useState(false);
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [isNextSectionExpanded, setIsNextSectionExpanded] = useState(true);
  const [visibleNextSuggestionsCount, setVisibleNextSuggestionsCount] = useState(0);
  const [visibleProgressionIdeasCount, setVisibleProgressionIdeasCount] = useState(0);
  const [visibleStructureSuggestionsCount, setVisibleStructureSuggestionsCount] = useState(0);
  const autoRandomizedOnFirstLoad = useRef(false);
  const progressiveRevealTimerRef = useRef<number | null>(null);

  const { isRestoringState, hasRestoredSessionData, cacheGeneratorResult } =
    useGeneratorSessionCache({
      reset,
      setData,
      setIsLoadedFromSavedProgression,
      playbackSettings,
      playbackSettingsSetters,
    });

  const generatedChordGridEntries = useMemo(() => {
    if (!data) {
      return [] as Array<{
        key: string;
        chord: string;
        source: string;
        leftHand: string[];
        rightHand: string[];
      }>;
    }

    const entries: Array<{
      key: string;
      chord: string;
      source: string;
      leftHand: string[];
      rightHand: string[];
    }> = [];
    const seenKeys = new Set<string>();

    data.nextChordSuggestions.forEach((suggestion, index) => {
      if (!suggestion.pianoVoicing) {
        return;
      }

      const key = `${suggestion.chord}|${suggestion.pianoVoicing.leftHand.join(',')}|${suggestion.pianoVoicing.rightHand.join(',')}`;
      if (seenKeys.has(key)) {
        return;
      }

      seenKeys.add(key);
      entries.push({
        key,
        chord: suggestion.chord,
        source: `Next suggestion ${index + 1}`,
        leftHand: suggestion.pianoVoicing.leftHand,
        rightHand: suggestion.pianoVoicing.rightHand,
      });
    });

    data.progressionIdeas.forEach((idea) => {
      idea.chords.forEach((chord, index) => {
        const voicing = idea.pianoVoicings[index];
        if (!voicing) {
          return;
        }

        const key = `${chord}|${voicing.leftHand.join(',')}|${voicing.rightHand.join(',')}`;
        if (seenKeys.has(key)) {
          return;
        }

        seenKeys.add(key);
        entries.push({
          key,
          chord,
          source: idea.label,
          leftHand: voicing.leftHand,
          rightHand: voicing.rightHand,
        });
      });
    });

    return entries;
  }, [data]);

  useEffect(() => {
    if (progressiveRevealTimerRef.current) {
      window.clearTimeout(progressiveRevealTimerRef.current);
      progressiveRevealTimerRef.current = null;
    }

    if (!data) {
      setVisibleNextSuggestionsCount(0);
      setVisibleProgressionIdeasCount(0);
      setVisibleStructureSuggestionsCount(0);
      return;
    }

    const totalNextSuggestions = data.nextChordSuggestions.length;
    const totalProgressionIdeas = data.progressionIdeas.length;
    const totalStructureSuggestions = data.structureSuggestions.length;

    setVisibleNextSuggestionsCount(Math.min(INITIAL_NEXT_SUGGESTIONS, totalNextSuggestions));
    setVisibleProgressionIdeasCount(Math.min(INITIAL_PROGRESSION_IDEAS, totalProgressionIdeas));
    setVisibleStructureSuggestionsCount(
      Math.min(INITIAL_STRUCTURE_SUGGESTIONS, totalStructureSuggestions),
    );

    const revealMore = () => {
      let hasMoreToReveal = false;

      setVisibleNextSuggestionsCount((previousCount) => {
        const nextCount = Math.min(
          previousCount + NEXT_SUGGESTIONS_CHUNK_SIZE,
          totalNextSuggestions,
        );
        if (nextCount < totalNextSuggestions) {
          hasMoreToReveal = true;
        }
        return nextCount;
      });

      setVisibleProgressionIdeasCount((previousCount) => {
        const nextCount = Math.min(
          previousCount + PROGRESSION_IDEAS_CHUNK_SIZE,
          totalProgressionIdeas,
        );
        if (nextCount < totalProgressionIdeas) {
          hasMoreToReveal = true;
        }
        return nextCount;
      });

      setVisibleStructureSuggestionsCount((previousCount) => {
        const nextCount = Math.min(
          previousCount + STRUCTURE_SUGGESTIONS_CHUNK_SIZE,
          totalStructureSuggestions,
        );
        if (nextCount < totalStructureSuggestions) {
          hasMoreToReveal = true;
        }
        return nextCount;
      });

      if (hasMoreToReveal) {
        progressiveRevealTimerRef.current = window.setTimeout(
          revealMore,
          PROGRESSIVE_REVEAL_DELAY_MS,
        );
      }
    };

    progressiveRevealTimerRef.current = window.setTimeout(revealMore, PROGRESSIVE_REVEAL_DELAY_MS);

    return () => {
      if (progressiveRevealTimerRef.current) {
        window.clearTimeout(progressiveRevealTimerRef.current);
        progressiveRevealTimerRef.current = null;
      }
    };
  }, [data]);

  const visibleNextChordSuggestions = useMemo(
    () => data?.nextChordSuggestions.slice(0, visibleNextSuggestionsCount) ?? [],
    [data, visibleNextSuggestionsCount],
  );

  const visibleProgressionIdeas = useMemo(
    () => data?.progressionIdeas.slice(0, visibleProgressionIdeasCount) ?? [],
    [data, visibleProgressionIdeasCount],
  );

  const visibleStructureSuggestions = useMemo(
    () => data?.structureSuggestions.slice(0, visibleStructureSuggestionsCount) ?? [],
    [data, visibleStructureSuggestionsCount],
  );

  const handleRequestSaveProgression = useCallback(
    ({
      chords,
      pianoVoicings,
      feel,
      genre: progressionGenre,
    }: {
      chords: ChordItem[];
      pianoVoicings: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
      feel: string;
      genre: string;
    }) => {
      setSelectedProgressionChords(chords);
      setSelectedProgressionVoicings(pianoVoicings);
      setSelectedProgressionFeel(feel);
      setSelectedProgressionGenre(progressionGenre);
      setSaveDialogOpen(true);
    },
    [],
  );

  const previewVoicing = generatedChordGridEntries[0]
    ? {
        leftHand: generatedChordGridEntries[0].leftHand,
        rightHand: generatedChordGridEntries[0].rightHand,
      }
    : undefined;

  const onSubmit = async (formData: GeneratorFormData) => {
    setError('');
    setIsLoadedFromSavedProgression(false);
    setIsGeneratedChordGridOpen(false);

    const resolvedMode = formData.mode.trim();
    const resolvedGenre = formData.genre.trim();

    if (!resolvedMode) {
      setError('Please select or enter a mode / scale.');
      return;
    }

    if (!resolvedGenre) {
      setError('Please select or enter a genre.');
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
          styleReference: formData.styleReference.trim() || null,
          instrument: 'both',
          adventurousness: formData.adventurousness,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const json = (await response.json()) as ChordSuggestionResponse;
      setData(json);
      cacheGeneratorResult(formData, json);
    } catch (err) {
      console.error(err);
      setError('Could not generate suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomize = useCallback(() => {
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
      styleReference: pickRandomUnique(STYLE_REFERENCE_OPTIONS, 1)[0] ?? '',
      adventurousness: pickRandomUnique(ADVENTUROUSNESS_INPUT_OPTIONS, 1)[0] ?? 'balanced',
      tempoBpm,
    });
    setError('');
  }, [reset, tempoBpm]);

  useEffect(() => {
    if (isRestoringState) {
      return;
    }

    if (autoRandomizedOnFirstLoad.current) {
      return;
    }

    if (hasRestoredSessionData) {
      autoRandomizedOnFirstLoad.current = true;
      return;
    }

    if (data) {
      autoRandomizedOnFirstLoad.current = true;
      return;
    }

    autoRandomizedOnFirstLoad.current = true;
    handleRandomize();
  }, [data, handleRandomize, hasRestoredSessionData, isRestoringState]);

  const handleProgressionDiagramInstrumentChange = (value: ProgressionDiagramInstrument) => {
    const scrollY = window.scrollY;
    setProgressionDiagramInstrument(value);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY });
    });
  };

  const resolvedScale = mode;
  const resolvedGenre = genre;
  const guitarVoicingByChord = useMemo(() => {
    const byChord: Partial<Record<string, GuitarVoicing>> = {};

    data?.nextChordSuggestions.forEach((suggestion) => {
      if (!suggestion.guitarVoicing) {
        return;
      }

      if (!byChord[suggestion.chord]) {
        byChord[suggestion.chord] = suggestion.guitarVoicing;
      }
    });

    return byChord;
  }, [data]);

  const resultSectionConfigs: ResultSectionConfig[] = [
    {
      key: 'next',
      shouldRender: !isLoadedFromSavedProgression,
      fallbackLabel: 'Loading suggestions...',
      render: (isCollapsibleLayout: boolean) => (
        <NextChordSuggestionsSection
          suggestions={visibleNextChordSuggestions}
          progressionDiagramInstrument={progressionDiagramInstrument}
          tempoBpm={tempoBpm}
          playbackStyle={playbackStyle}
          attack={attack}
          decay={decay}
          humanize={humanize}
          gate={gate}
          inversionRegister={inversionRegister}
          instrument={instrument}
          scale={resolvedScale}
          genre={resolvedGenre}
          showTitle={isCollapsibleLayout ? false : undefined}
        />
      ),
    },
    {
      key: 'progressions',
      shouldRender: true,
      fallbackLabel: 'Loading progression ideas...',
      render: () => (
        <ProgressionIdeasSection
          progressionIdeas={visibleProgressionIdeas}
          isLoadedFromSavedProgression={isLoadedFromSavedProgression}
          progressionDiagramInstrument={progressionDiagramInstrument}
          tempoBpm={tempoBpm}
          playbackStyle={playbackStyle}
          attack={attack}
          decay={decay}
          humanize={humanize}
          gate={gate}
          inversionRegister={inversionRegister}
          instrument={instrument}
          octaveShift={octaveShift}
          scale={resolvedScale}
          resolvedGenreForSave={resolvedGenre}
          guitarVoicingByChord={guitarVoicingByChord}
          onRequestSaveProgression={handleRequestSaveProgression}
        />
      ),
    },
    {
      key: 'structure',
      shouldRender: !isLoadedFromSavedProgression,
      fallbackLabel: 'Loading structure suggestions...',
      render: () => (
        <StructureSuggestionsSection
          structureSuggestions={visibleStructureSuggestions}
          progressionIdeas={visibleProgressionIdeas}
          tempoBpm={tempoBpm}
          playbackStyle={playbackStyle}
          attack={attack}
          decay={decay}
          humanize={humanize}
          gate={gate}
          inversionRegister={inversionRegister}
          instrument={instrument}
          octaveShift={octaveShift}
          scale={resolvedScale}
          genre={resolvedGenre}
          timeSignature={timeSignature}
          metronomeEnabled={metronomeEnabled}
          metronomeVolume={metronomeVolume}
        />
      ),
    },
  ];

  if (isRestoringState) {
    return (
      <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
        <RestoringState />
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <GeneratorHeader />

        <GeneratorFormCard
          control={control}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          loading={loading}
          errors={errors}
          errorMessage={error}
          onRandomize={handleRandomize}
        />

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
            {(() => {
              const hasNextSuggestions =
                !isLoadedFromSavedProgression && data.nextChordSuggestions.length > 0;
              const hasProgressionIdeas = data.progressionIdeas.length > 0;
              const hasStructureSuggestions =
                !isLoadedFromSavedProgression && data.structureSuggestions.length > 0;
              const useCollapsibleSections =
                hasNextSuggestions && hasProgressionIdeas && hasStructureSuggestions;

              return (
                <>
                  <Box
                    sx={{
                      position: 'sticky',
                      top: { xs: 68, md: 72 },
                      zIndex: 1100,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      py: 0.5,
                      px: 1,
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlaybackSettingsButton
                        settings={playbackSettings}
                        onChange={playbackSettingsChangeHandlers}
                        tempoBpm={tempoBpm}
                        onTempoBpmChange={handleTempoBpmChange}
                        previewVoicing={previewVoicing}
                      />
                      {generatedChordGridEntries.length > 0 ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<GridViewIcon />}
                          onClick={() => setIsGeneratedChordGridOpen(true)}
                          sx={{
                            borderWidth: 1.5,
                            color: '#60a5fa',
                            borderColor: 'rgba(96, 165, 250, 0.9)',
                            backgroundColor: 'transparent',
                            textTransform: 'none',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            '&:hover': {
                              borderColor: 'rgba(147, 197, 253, 1)',
                              backgroundColor: 'rgba(96, 165, 250, 0.08)',
                              borderWidth: 1.5,
                            },
                          }}
                        >
                          Pads
                        </Button>
                      ) : null}
                      <InstrumentToggle
                        value={progressionDiagramInstrument}
                        onChange={handleProgressionDiagramInstrumentChange}
                      />
                    </Stack>
                  </Box>

                  {useCollapsibleSections ? (
                    <Stack spacing={4}>
                      {resultSectionConfigs.map((section) => {
                        if (!section.shouldRender) {
                          return null;
                        }

                        if (section.key === 'next') {
                          return (
                            <Box component="section" id="suggestions" key={section.key}>
                              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                                Next chord suggestions
                              </Typography>
                              <Accordion
                                expanded={isNextSectionExpanded}
                                onChange={(_, expanded) => setIsNextSectionExpanded(expanded)}
                              >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography
                                    variant="body2"
                                    component="span"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {isNextSectionExpanded
                                      ? 'Hide suggestions'
                                      : 'Show suggestions'}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Suspense
                                    fallback={
                                      <Typography variant="body2" color="text.secondary">
                                        {section.fallbackLabel}
                                      </Typography>
                                    }
                                  >
                                    {section.render(true)}
                                  </Suspense>
                                </AccordionDetails>
                              </Accordion>
                            </Box>
                          );
                        }

                        return (
                          <Suspense
                            key={section.key}
                            fallback={
                              <Typography variant="body2" color="text.secondary">
                                {section.fallbackLabel}
                              </Typography>
                            }
                          >
                            {section.render(true)}
                          </Suspense>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Stack spacing={4}>
                      {resultSectionConfigs.map((section) => {
                        if (!section.shouldRender) {
                          return null;
                        }

                        return (
                          <Suspense
                            key={section.key}
                            fallback={
                              <Typography variant="body2" color="text.secondary">
                                {section.fallbackLabel}
                              </Typography>
                            }
                          >
                            {section.render(false)}
                          </Suspense>
                        );
                      })}
                    </Stack>
                  )}

                  <SaveProgressionDialog
                    open={saveDialogOpen}
                    onClose={() => setSaveDialogOpen(false)}
                    chords={selectedProgressionChords}
                    pianoVoicings={selectedProgressionVoicings}
                    feel={selectedProgressionFeel}
                    scale={mode}
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
                  <GeneratedChordGridDialog
                    open={isGeneratedChordGridOpen}
                    onClose={() => setIsGeneratedChordGridOpen(false)}
                    tempoBpm={tempoBpm}
                    settings={playbackSettings}
                    onSettingsChange={playbackSettingsChangeHandlers}
                    chords={generatedChordGridEntries}
                    onTempoBpmChange={handleTempoBpmChange}
                  />
                </>
              );
            })()}
          </>
        ) : null}
      </Stack>
    </Container>
  );
}
