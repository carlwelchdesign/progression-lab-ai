'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import NextChordSuggestionsSection from '../components/home/NextChordSuggestionsSection';
import PlaybackSettingsButton from '../components/home/PlaybackSettingsButton';
import ProgressionIdeasSection from '../components/home/ProgressionIdeasSection';
import RestoringState from '../components/home/RestoringState';
import StructureSuggestionsSection from '../components/home/StructureSuggestionsSection';
import useGeneratorSessionCache from '../components/home/useGeneratorSessionCache';
import type { GeneratorFormData, ProgressionDiagramInstrument } from '../components/home/types';
import type { PlaybackStyle } from '../lib/audio';
import { CHORD_OPTIONS, GENRE_OPTIONS, MODE_OPTIONS, MOOD_OPTIONS } from '../lib/formOptions';
import type { Adventurousness, ChordItem, ChordSuggestionResponse } from '../lib/types';

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
      tempoBpm: 100,
    },
    mode: 'onChange',
  });

  const mode = watch('mode');
  const genre = watch('genre');
  const customMode = watch('customMode');
  const customGenre = watch('customGenre');
  const tempoBpm = watch('tempoBpm');

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
  const [playbackStyle, setPlaybackStyle] = useState<PlaybackStyle>('strum');
  const [attack, setAttack] = useState<number>(0.01);
  const [decay, setDecay] = useState<number>(0.5);
  const [padVelocity, setPadVelocity] = useState<number>(96);
  const [padSwing, setPadSwing] = useState<number>(0);
  const [padLatchMode, setPadLatchMode] = useState(false);
  const [isGeneratedChordGridOpen, setIsGeneratedChordGridOpen] = useState(false);
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [isNextSectionExpanded, setIsNextSectionExpanded] = useState(true);
  const autoRandomizedOnFirstLoad = useRef(false);

  const { isRestoringState, hasRestoredSessionData, cacheGeneratorResult } =
    useGeneratorSessionCache({
      reset,
      setData,
      setIsLoadedFromSavedProgression,
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
      adventurousness: pickRandomUnique(ADVENTUROUSNESS_OPTIONS, 1)[0] ?? 'balanced',
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
          mode={mode}
          genre={genre}
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
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlaybackSettingsButton
                        playbackStyle={playbackStyle}
                        onPlaybackStyleChange={setPlaybackStyle}
                        attack={attack}
                        onAttackChange={setAttack}
                        decay={decay}
                        onDecayChange={setDecay}
                        padVelocity={padVelocity}
                        onPadVelocityChange={setPadVelocity}
                        padSwing={padSwing}
                        onPadSwingChange={setPadSwing}
                        padLatchMode={padLatchMode}
                        onPadLatchModeChange={setPadLatchMode}
                        tempoBpm={tempoBpm}
                        previewVoicing={previewVoicing}
                      />
                      {generatedChordGridEntries.length > 0 ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<GridViewIcon />}
                          onClick={() => setIsGeneratedChordGridOpen(true)}
                        >
                          pads
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
                      <Box component="section" id="suggestions">
                        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                          Next chord suggestions
                        </Typography>
                        <Accordion
                          expanded={isNextSectionExpanded}
                          onChange={(_, expanded) => setIsNextSectionExpanded(expanded)}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                              {isNextSectionExpanded ? 'Hide suggestions' : 'Show suggestions'}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <NextChordSuggestionsSection
                              suggestions={data.nextChordSuggestions}
                              progressionDiagramInstrument={progressionDiagramInstrument}
                              tempoBpm={tempoBpm}
                              playbackStyle={playbackStyle}
                              attack={attack}
                              decay={decay}
                              showTitle={false}
                            />
                          </AccordionDetails>
                        </Accordion>
                      </Box>

                      <ProgressionIdeasSection
                        progressionIdeas={data.progressionIdeas}
                        isLoadedFromSavedProgression={isLoadedFromSavedProgression}
                        progressionDiagramInstrument={progressionDiagramInstrument}
                        tempoBpm={tempoBpm}
                        playbackStyle={playbackStyle}
                        attack={attack}
                        decay={decay}
                        resolvedGenreForSave={genre === 'custom' ? customGenre.trim() : genre}
                        onRequestSaveProgression={({
                          chords,
                          pianoVoicings,
                          feel,
                          genre: progressionGenre,
                        }) => {
                          setSelectedProgressionChords(chords);
                          setSelectedProgressionVoicings(pianoVoicings);
                          setSelectedProgressionFeel(feel);
                          setSelectedProgressionGenre(progressionGenre);
                          setSaveDialogOpen(true);
                        }}
                      />

                      <StructureSuggestionsSection
                        structureSuggestions={data.structureSuggestions}
                      />
                    </Stack>
                  ) : (
                    <Stack spacing={4}>
                      {!isLoadedFromSavedProgression ? (
                        <NextChordSuggestionsSection
                          suggestions={data.nextChordSuggestions}
                          progressionDiagramInstrument={progressionDiagramInstrument}
                          tempoBpm={tempoBpm}
                          playbackStyle={playbackStyle}
                          attack={attack}
                          decay={decay}
                        />
                      ) : null}

                      <ProgressionIdeasSection
                        progressionIdeas={data.progressionIdeas}
                        isLoadedFromSavedProgression={isLoadedFromSavedProgression}
                        progressionDiagramInstrument={progressionDiagramInstrument}
                        tempoBpm={tempoBpm}
                        playbackStyle={playbackStyle}
                        attack={attack}
                        decay={decay}
                        resolvedGenreForSave={genre === 'custom' ? customGenre.trim() : genre}
                        onRequestSaveProgression={({
                          chords,
                          pianoVoicings,
                          feel,
                          genre: progressionGenre,
                        }) => {
                          setSelectedProgressionChords(chords);
                          setSelectedProgressionVoicings(pianoVoicings);
                          setSelectedProgressionFeel(feel);
                          setSelectedProgressionGenre(progressionGenre);
                          setSaveDialogOpen(true);
                        }}
                      />

                      {!isLoadedFromSavedProgression ? (
                        <StructureSuggestionsSection
                          structureSuggestions={data.structureSuggestions}
                        />
                      ) : null}
                    </Stack>
                  )}

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
                  <GeneratedChordGridDialog
                    open={isGeneratedChordGridOpen}
                    onClose={() => setIsGeneratedChordGridOpen(false)}
                    tempoBpm={tempoBpm}
                    playbackStyle={playbackStyle}
                    onPlaybackStyleChange={setPlaybackStyle}
                    attack={attack}
                    onAttackChange={setAttack}
                    decay={decay}
                    onDecayChange={setDecay}
                    padVelocity={padVelocity}
                    onPadVelocityChange={setPadVelocity}
                    padSwing={padSwing}
                    onPadSwingChange={setPadSwing}
                    padLatchMode={padLatchMode}
                    onPadLatchModeChange={setPadLatchMode}
                    chords={generatedChordGridEntries}
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
