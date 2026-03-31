'use client';

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewIcon from '@mui/icons-material/GridView';
import SaveIcon from '@mui/icons-material/Save';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import SaveProgressionDialog from '../../../progressions/components/SaveProgressionDialog';
import ArrangementsList from '../../../arrangements/components/ArrangementsList';
import GeneratorFormCard from './GeneratorFormCard';
import GeneratedChordGridDialog from '../chord-grid/GeneratedChordGridDialog';
import GeneratorHeader from './GeneratorHeader';
import InstrumentToggle from '../playback/InstrumentToggle';
import PlaybackSettingsButton from '../playback/PlaybackSettingsButton';
import RestoringState from './RestoringState';
import { useAppLocale } from '../../../../components/providers/LocaleProvider';
import { useAppSnackbar } from '../../../../components/providers/AppSnackbarProvider';
import { useAuth } from '../../../../components/providers/AuthProvider';
import { useAuthModal } from '../../../../components/providers/AuthModalProvider';
import { updatePlaybackTempo } from '../../../../domain/audio/audio';
import usePlaybackSettings from '../../hooks/usePlaybackSettings';
import useGeneratorSessionCache from '../../hooks/useGeneratorSessionCache';
import { applyPlaybackSettings, sanitizePlaybackSettings } from '../../lib/playbackSettingsModel';
import type { GeneratorFormData, ProgressionDiagramInstrument } from '../../types';
import {
  ADVENTUROUSNESS_OPTIONS,
  CHORD_OPTIONS,
  GENRE_INPUT_OPTIONS,
  MODE_INPUT_OPTIONS,
  MOOD_OPTIONS,
  STYLE_REFERENCE_OPTIONS,
} from '../../../../lib/formOptions';
import type {
  Arrangement,
  ChordItem,
  ChordSuggestionResponse,
  GeneratorSnapshot,
  GuitarVoicing,
  VocalFeatureEntitlements,
} from '../../../../lib/types';

const MAX_RANDOM_SELECTIONS = 7;
const ADVENTUROUSNESS_INPUT_OPTIONS = [...ADVENTUROUSNESS_OPTIONS];
const RANDOM_MODE_OPTIONS = MODE_INPUT_OPTIONS;
const RANDOM_GENRE_OPTIONS = GENRE_INPUT_OPTIONS;
const NextChordSuggestionsSection = lazy(
  () => import('../suggestions/NextChordSuggestionsSection'),
);
const ProgressionIdeasSection = lazy(() => import('../suggestions/ProgressionIdeasSection'));
const StructureSuggestionsSection = lazy(
  () => import('../suggestions/StructureSuggestionsSection'),
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : (error as { name?: string })?.name === 'AbortError';
}

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

export default function GeneratorPageContent() {
  const { t } = useTranslation('generator');
  const { locale } = useAppLocale();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
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
      voicingProfiles: [],
      customVoicingInstructions: '',
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
      updatePlaybackTempo(normalizedValue);
    },
    [setValue],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ChordSuggestionResponse | null>(null);
  const [isLoadedFromSavedProgression, setIsLoadedFromSavedProgression] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [generatorSnapshotToSave, setGeneratorSnapshotToSave] = useState<GeneratorSnapshot | null>(
    null,
  );
  const [individualProgressionToSave, setIndividualProgressionToSave] = useState<{
    chords: ChordItem[];
    pianoVoicings: ChordSuggestionResponse['progressionIdeas'][number]['pianoVoicings'];
    feel: string;
    genre: string;
  } | null>(null);
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
    padPattern,
    timeSignature,
    metronomeEnabled,
    metronomeVolume,
    metronomeSource,
    metronomeDrumPath,
  } = playbackSettings;

  const [isGeneratedChordGridOpen, setIsGeneratedChordGridOpen] = useState(false);
  const [vocalEntitlements, setVocalEntitlements] = useState<VocalFeatureEntitlements>({
    canUseVocalTrackRecording: true,
    maxVocalTakesPerArrangement: 1,
  });
  const [pendingArrangementLoad, setPendingArrangementLoad] = useState<{
    key: string;
    events: Arrangement['timeline']['events'];
    loopLengthBars: number;
  } | null>(null);
  const [arrangementsRefreshSignal, setArrangementsRefreshSignal] = useState(0);
  const [showArrangementsSection, setShowArrangementsSection] = useState(true);
  const [isArrangementsExpanded, setIsArrangementsExpanded] = useState(false);
  const [isNextSectionExpanded, setIsNextSectionExpanded] = useState(true);
  const [visibleNextSuggestionsCount, setVisibleNextSuggestionsCount] = useState(0);
  const [visibleProgressionIdeasCount, setVisibleProgressionIdeasCount] = useState(0);
  const [visibleStructureSuggestionsCount, setVisibleStructureSuggestionsCount] = useState(0);
  const autoRandomizedOnFirstLoad = useRef(false);
  const progressiveRevealTimerRef = useRef<number | null>(null);
  const inFlightRequestControllerRef = useRef<AbortController | null>(null);
  const { showError } = useAppSnackbar();

  useEffect(() => {
    if (!isGeneratedChordGridOpen) {
      return;
    }

    if (!isAuthenticated) {
      setVocalEntitlements({
        canUseVocalTrackRecording: true,
        maxVocalTakesPerArrangement: 1,
      });
      return;
    }

    const controller = new AbortController();

    const loadVocalEntitlements = async () => {
      try {
        const response = await fetch('/api/billing/status', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as {
          entitlements?: Partial<VocalFeatureEntitlements>;
        };

        setVocalEntitlements({
          canUseVocalTrackRecording: body.entitlements?.canUseVocalTrackRecording ?? true,
          maxVocalTakesPerArrangement: body.entitlements?.maxVocalTakesPerArrangement ?? 1,
        });
      } catch {
        // Keep fallback entitlements if billing status request fails.
      }
    };

    void loadVocalEntitlements();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, isGeneratedChordGridOpen]);

  const abortInFlightRequest = useCallback(() => {
    inFlightRequestControllerRef.current?.abort();
    inFlightRequestControllerRef.current = null;
  }, []);

  useEffect(
    () => () => {
      abortInFlightRequest();
    },
    [abortInFlightRequest],
  );

  useEffect(() => {
    const handlePageHide = () => {
      abortInFlightRequest();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        abortInFlightRequest();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [abortInFlightRequest]);

  const handleLoadArrangement = useCallback(
    (arrangement: Arrangement) => {
      const snap = arrangement.playbackSnapshot;
      handleTempoBpmChange(snap.tempoBpm);
      const sanitizedSettings = sanitizePlaybackSettings(snap);
      applyPlaybackSettings(playbackSettingsSetters, sanitizedSettings);

      setPendingArrangementLoad({
        key: arrangement.id,
        events: arrangement.timeline.events,
        loopLengthBars: arrangement.timeline.loopLengthBars,
      });
      setIsGeneratedChordGridOpen(true);
    },
    [handleTempoBpmChange, playbackSettingsSetters],
  );

  const { isRestoringState, hasRestoredSessionData, cacheGeneratorResult } =
    useGeneratorSessionCache({
      reset,
      setData,
      setIsLoadedFromSavedProgression,
      locale,
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

  const handleOpenSaveDialog = useCallback(() => {
    if (!data) {
      return;
    }

    const formData = getValues();
    setGeneratorSnapshotToSave({ formData, data });
    setIndividualProgressionToSave(null);
    setSaveDialogOpen(true);
  }, [data, getValues]);

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
      setIndividualProgressionToSave({ chords, pianoVoicings, feel, genre: progressionGenre });
      setGeneratorSnapshotToSave(null);
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
      setError(t('errors.selectMode'));
      return;
    }

    if (!resolvedGenre) {
      setError(t('errors.selectGenre'));
      return;
    }

    abortInFlightRequest();
    const controller = new AbortController();
    inFlightRequestControllerRef.current = controller;

    setLoading(true);

    try {
      const response = await fetch('/api/chord-suggestions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
          voicingProfiles: formData.voicingProfiles,
          customVoicingInstructions: formData.customVoicingInstructions,
          language: locale,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          openAuthModal({ mode: 'login', reason: 'generic' });
          throw new Error('Authentication required');
        }
        throw new Error('Request failed');
      }

      const json = (await response.json()) as ChordSuggestionResponse;
      setData(json);
      cacheGeneratorResult(formData, json);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      if (err instanceof Error && err.message === 'Authentication required') {
        return;
      }

      console.error(err);
      const errorMessage = t('errors.requestFailed');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      if (inFlightRequestControllerRef.current === controller) {
        abortInFlightRequest();
        setLoading(false);
      }
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
      voicingProfiles: [],
      customVoicingInstructions: '',
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
      fallbackLabel: t('status.loadingSuggestions'),
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
          octaveShift={octaveShift}
          padPattern={padPattern}
          timeSignature={timeSignature}
          scale={resolvedScale}
          genre={resolvedGenre}
          showTitle={isCollapsibleLayout ? false : undefined}
        />
      ),
    },
    {
      key: 'progressions',
      shouldRender: true,
      fallbackLabel: t('status.loadingProgressionIdeas'),
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
          padPattern={padPattern}
          timeSignature={timeSignature}
          metronomeEnabled={metronomeEnabled}
          metronomeVolume={metronomeVolume}
          metronomeSource={metronomeSource}
          metronomeDrumPath={metronomeDrumPath}
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
      fallbackLabel: t('status.loadingStructureSuggestions'),
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
          padPattern={padPattern}
          scale={resolvedScale}
          genre={resolvedGenre}
          timeSignature={timeSignature}
          metronomeEnabled={metronomeEnabled}
          metronomeVolume={metronomeVolume}
          metronomeSource={metronomeSource}
          metronomeDrumPath={metronomeDrumPath}
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

        {isAuthenticated && showArrangementsSection ? (
          <Accordion
            expanded={isArrangementsExpanded}
            onChange={(_, expanded) => {
              setIsArrangementsExpanded(expanded);
            }}
            disableGutters
            elevation={0}
            sx={{
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              backgroundColor: 'background.paper',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 2, minHeight: 48, '& .MuiAccordionSummary-content': { my: 1 } }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                My Arrangements
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <ArrangementsList
                onLoad={(arrangement) => {
                  handleLoadArrangement(arrangement);
                }}
                refreshSignal={arrangementsRefreshSignal}
                onAvailabilityChange={(hasAny) => {
                  setShowArrangementsSection(hasAny);
                  if (!hasAny) {
                    setIsArrangementsExpanded(false);
                  }
                }}
              />
            </AccordionDetails>
          </Accordion>
        ) : null}

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
              py: 8,
              px: { xs: 1, sm: 2 },
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Generating suggestions...
            </Typography>
            <LinearProgress sx={{ mb: 2 }} />
            <Stack spacing={1.25}>
              <Skeleton variant="rounded" height={52} />
              <Skeleton variant="rounded" height={52} />
              <Skeleton variant="rounded" height={52} />
            </Stack>
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
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={handleOpenSaveDialog}
                        disabled={data.progressionIdeas.length === 0}
                        sx={{
                          borderWidth: 1.5,
                          color: (theme) => theme.palette.primary.main,
                          borderColor: (theme) => alpha(theme.palette.primary.main, 0.9),
                          backgroundColor: 'transparent',
                          textTransform: 'none',
                          fontWeight: 600,
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          '&:hover': {
                            borderColor: (theme) => theme.palette.primary.main,
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                            borderWidth: 1.5,
                          },
                        }}
                      >
                        {t('ui.buttons.save')}
                      </Button>
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
                            color: (theme) => theme.palette.primary.main,
                            borderColor: (theme) => alpha(theme.palette.primary.main, 0.9),
                            backgroundColor: 'transparent',
                            textTransform: 'none',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            '&:hover': {
                              borderColor: (theme) => theme.palette.primary.main,
                              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                              borderWidth: 1.5,
                            },
                          }}
                        >
                          {t('ui.buttons.pads')}
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

                  {generatorSnapshotToSave || individualProgressionToSave ? (
                    <SaveProgressionDialog
                      open={saveDialogOpen}
                      onClose={() => setSaveDialogOpen(false)}
                      generatorSnapshot={generatorSnapshotToSave ?? undefined}
                      chords={individualProgressionToSave?.chords}
                      pianoVoicings={individualProgressionToSave?.pianoVoicings}
                      feel={individualProgressionToSave?.feel}
                      scale={mode}
                      genre={individualProgressionToSave?.genre}
                    />
                  ) : null}
                  <GeneratedChordGridDialog
                    open={isGeneratedChordGridOpen}
                    onClose={() => setIsGeneratedChordGridOpen(false)}
                    tempoBpm={tempoBpm}
                    settings={playbackSettings}
                    onSettingsChange={playbackSettingsChangeHandlers}
                    chords={generatedChordGridEntries}
                    onTempoBpmChange={handleTempoBpmChange}
                    pendingLoad={pendingArrangementLoad}
                    onSaveSuccess={() => {
                      setShowArrangementsSection(true);
                      setArrangementsRefreshSignal((prev) => prev + 1);
                    }}
                    vocalEntitlements={vocalEntitlements}
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
