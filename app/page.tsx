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
import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../lib/audio';
import {
  setChorusDelayTime,
  setChorusDepth,
  setChorusEnabled,
  setChorusFrequency,
  setChorusWet,
  setFeedbackDelayEnabled,
  setFeedbackDelayFeedback,
  setFeedbackDelayTime,
  setFeedbackDelayWet,
  setPhaserEnabled,
  setPhaserFrequency,
  setPhaserOctaves,
  setPhaserQ,
  setPhaserWet,
  setReverbEnabled,
  setReverbRoomSize,
  setReverbWet,
  setTremoloDepth,
  setTremoloEnabled,
  setTremoloFrequency,
  setTremoloWet,
  setVibratoDepth,
  setVibratoEnabled,
  setVibratoFrequency,
  setVibratoWet,
} from '../lib/audio';
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

  const handleTempoBpmChange = (value: number) => {
    const roundedValue = Number.isFinite(value) ? Math.round(value) : 100;
    const normalizedValue = Math.min(240, Math.max(40, roundedValue));
    setValue('tempoBpm', normalizedValue, {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

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
  const [instrument, setInstrument] = useState<AudioInstrument>('piano');
  const [attack, setAttack] = useState<number>(0.01);
  const [decay, setDecay] = useState<number>(0.5);
  const [padVelocity, setPadVelocity] = useState<number>(96);
  const [padSwing, setPadSwing] = useState<number>(0);
  const [padLatchMode, setPadLatchMode] = useState(false);
  const [humanize, setHumanize] = useState<number>(0);
  const [gate, setGate] = useState<number>(1);
  const [inversionRegister, setInversionRegister] = useState<PlaybackRegister>('off');
  const [octaveShift, setOctaveShift] = useState<number>(0);
  const [reverbEnabled, setReverbEnabledState] = useState(false);
  const [reverb, setReverb] = useState<number>(0);
  const [chorusEnabled, setChorusEnabledState] = useState(false);
  const [chorus, setChorus] = useState<number>(0);
  const [chorusRate, setChorusRate] = useState<number>(1.5);
  const [chorusDepth, setChorusDepthState] = useState<number>(0.7);
  const [chorusDelayTime, setChorusDelayTimeState] = useState<number>(3.5);
  const [feedbackDelayEnabled, setFeedbackDelayEnabledState] = useState(false);
  const [feedbackDelay, setFeedbackDelay] = useState<number>(0);
  const [feedbackDelayTime, setFeedbackDelayTimeState] = useState<number>(0.25);
  const [feedbackDelayFeedback, setFeedbackDelayFeedbackState] = useState<number>(0.35);
  const [tremoloEnabled, setTremoloEnabledState] = useState(false);
  const [tremolo, setTremolo] = useState<number>(0);
  const [tremoloFrequency, setTremoloFrequencyState] = useState<number>(9);
  const [tremoloDepth, setTremoloDepthState] = useState<number>(0.5);
  const [vibratoEnabled, setVibratoEnabledState] = useState(false);
  const [vibrato, setVibrato] = useState<number>(0);
  const [vibratoFrequency, setVibratoFrequencyState] = useState<number>(5);
  const [vibratoDepth, setVibratoDepthState] = useState<number>(0.1);
  const [phaserEnabled, setPhaserEnabledState] = useState(false);
  const [phaser, setPhaser] = useState<number>(0);
  const [phaserFrequency, setPhaserFrequencyState] = useState<number>(0.5);
  const [phaserOctaves, setPhaserOctavesState] = useState<number>(3);
  const [phaserQ, setPhaserQState] = useState<number>(10);
  const [roomSize, setRoomSize] = useState<number>(0.25);

  const handleReverbChange = (value: number) => {
    setReverb(value);
    setReverbWet(value);
  };

  const handleRoomSizeChange = (value: number) => {
    const normalizedValue = Math.min(1, Math.max(0, value));
    setRoomSize(normalizedValue);
    setReverbRoomSize(normalizedValue);
  };

  const handleChorusChange = (value: number) => {
    const normalizedValue = Math.min(1, Math.max(0, value));
    setChorus(normalizedValue);
    setChorusWet(normalizedValue);
  };

  const handleFeedbackDelayChange = (value: number) => {
    const normalizedValue = Math.min(1, Math.max(0, value));
    setFeedbackDelay(normalizedValue);
    setFeedbackDelayWet(normalizedValue);
  };

  const handleEffectToggle = (setState: (value: boolean) => void) => (value: boolean) => {
    setState(value);
  };

  useEffect(() => {
    setReverbEnabled(reverbEnabled);
  }, [reverbEnabled]);

  useEffect(() => {
    setReverbWet(reverb);
  }, [reverb]);

  useEffect(() => {
    setChorusEnabled(chorusEnabled);
  }, [chorusEnabled]);

  useEffect(() => {
    setChorusWet(chorus);
  }, [chorus]);

  useEffect(() => {
    setChorusFrequency(chorusRate);
  }, [chorusRate]);

  useEffect(() => {
    setChorusDepth(chorusDepth);
  }, [chorusDepth]);

  useEffect(() => {
    setChorusDelayTime(chorusDelayTime);
  }, [chorusDelayTime]);

  useEffect(() => {
    setFeedbackDelayEnabled(feedbackDelayEnabled);
  }, [feedbackDelayEnabled]);

  useEffect(() => {
    setFeedbackDelayWet(feedbackDelay);
  }, [feedbackDelay]);

  useEffect(() => {
    setFeedbackDelayTime(feedbackDelayTime);
  }, [feedbackDelayTime]);

  useEffect(() => {
    setFeedbackDelayFeedback(feedbackDelayFeedback);
  }, [feedbackDelayFeedback]);

  useEffect(() => {
    setTremoloEnabled(tremoloEnabled);
  }, [tremoloEnabled]);

  useEffect(() => {
    setTremoloWet(tremolo);
  }, [tremolo]);

  useEffect(() => {
    setTremoloFrequency(tremoloFrequency);
  }, [tremoloFrequency]);

  useEffect(() => {
    setTremoloDepth(tremoloDepth);
  }, [tremoloDepth]);

  useEffect(() => {
    setVibratoEnabled(vibratoEnabled);
  }, [vibratoEnabled]);

  useEffect(() => {
    setVibratoWet(vibrato);
  }, [vibrato]);

  useEffect(() => {
    setVibratoFrequency(vibratoFrequency);
  }, [vibratoFrequency]);

  useEffect(() => {
    setVibratoDepth(vibratoDepth);
  }, [vibratoDepth]);

  useEffect(() => {
    setPhaserEnabled(phaserEnabled);
  }, [phaserEnabled]);

  useEffect(() => {
    setPhaserWet(phaser);
  }, [phaser]);

  useEffect(() => {
    setPhaserFrequency(phaserFrequency);
  }, [phaserFrequency]);

  useEffect(() => {
    setPhaserOctaves(phaserOctaves);
  }, [phaserOctaves]);

  useEffect(() => {
    setPhaserQ(phaserQ);
  }, [phaserQ]);

  useEffect(() => {
    setReverbRoomSize(roomSize);
  }, [roomSize]);

  const [isGeneratedChordGridOpen, setIsGeneratedChordGridOpen] = useState(false);
  const [successMessageOpen, setSuccessMessageOpen] = useState(false);
  const [isNextSectionExpanded, setIsNextSectionExpanded] = useState(true);
  const autoRandomizedOnFirstLoad = useRef(false);

  const { isRestoringState, hasRestoredSessionData, cacheGeneratorResult } =
    useGeneratorSessionCache({
      reset,
      setData,
      setIsLoadedFromSavedProgression,
      playbackStyle,
      setPlaybackStyle,
      attack,
      setAttack,
      decay,
      setDecay,
      padVelocity,
      setPadVelocity,
      padSwing,
      setPadSwing,
      padLatchMode,
      setPadLatchMode,
      humanize,
      setHumanize,
      gate,
      setGate,
      inversionRegister,
      setInversionRegister,
      instrument,
      setInstrument,
      octaveShift,
      setOctaveShift,
      reverbEnabled,
      setReverbEnabled: setReverbEnabledState,
      reverb,
      setReverb,
      chorusEnabled,
      setChorusEnabled: setChorusEnabledState,
      chorus,
      setChorus,
      chorusRate,
      setChorusRate,
      chorusDepth,
      setChorusDepth: setChorusDepthState,
      chorusDelayTime,
      setChorusDelayTime: setChorusDelayTimeState,
      feedbackDelayEnabled,
      setFeedbackDelayEnabled: setFeedbackDelayEnabledState,
      feedbackDelay,
      setFeedbackDelay,
      feedbackDelayTime,
      setFeedbackDelayTime: setFeedbackDelayTimeState,
      feedbackDelayFeedback,
      setFeedbackDelayFeedback: setFeedbackDelayFeedbackState,
      tremoloEnabled,
      setTremoloEnabled: setTremoloEnabledState,
      tremolo,
      setTremolo,
      tremoloFrequency,
      setTremoloFrequency: setTremoloFrequencyState,
      tremoloDepth,
      setTremoloDepth: setTremoloDepthState,
      vibratoEnabled,
      setVibratoEnabled: setVibratoEnabledState,
      vibrato,
      setVibrato,
      vibratoFrequency,
      setVibratoFrequency: setVibratoFrequencyState,
      vibratoDepth,
      setVibratoDepth: setVibratoDepthState,
      phaserEnabled,
      setPhaserEnabled: setPhaserEnabledState,
      phaser,
      setPhaser,
      phaserFrequency,
      setPhaserFrequency: setPhaserFrequencyState,
      phaserOctaves,
      setPhaserOctaves: setPhaserOctavesState,
      phaserQ,
      setPhaserQ: setPhaserQState,
      roomSize,
      setRoomSize,
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
                      py: 0.5,
                      px: 1,
                      WebkitBackdropFilter: 'blur(10px)',
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
                        humanize={humanize}
                        onHumanizeChange={setHumanize}
                        gate={gate}
                        onGateChange={setGate}
                        inversionRegister={inversionRegister}
                        onInversionRegisterChange={setInversionRegister}
                        instrument={instrument}
                        onInstrumentChange={setInstrument}
                        octaveShift={octaveShift}
                        onOctaveShiftChange={setOctaveShift}
                        reverb={reverb}
                        onReverbChange={handleReverbChange}
                        reverbEnabled={reverbEnabled}
                        onReverbEnabledChange={handleEffectToggle(setReverbEnabledState)}
                        chorus={chorus}
                        onChorusChange={handleChorusChange}
                        chorusEnabled={chorusEnabled}
                        onChorusEnabledChange={handleEffectToggle(setChorusEnabledState)}
                        chorusRate={chorusRate}
                        onChorusRateChange={setChorusRate}
                        chorusDepth={chorusDepth}
                        onChorusDepthChange={setChorusDepthState}
                        chorusDelayTime={chorusDelayTime}
                        onChorusDelayTimeChange={setChorusDelayTimeState}
                        feedbackDelayEnabled={feedbackDelayEnabled}
                        onFeedbackDelayEnabledChange={handleEffectToggle(
                          setFeedbackDelayEnabledState,
                        )}
                        feedbackDelay={feedbackDelay}
                        onFeedbackDelayChange={handleFeedbackDelayChange}
                        feedbackDelayTime={feedbackDelayTime}
                        onFeedbackDelayTimeChange={setFeedbackDelayTimeState}
                        feedbackDelayFeedback={feedbackDelayFeedback}
                        onFeedbackDelayFeedbackChange={setFeedbackDelayFeedbackState}
                        tremoloEnabled={tremoloEnabled}
                        onTremoloEnabledChange={handleEffectToggle(setTremoloEnabledState)}
                        tremolo={tremolo}
                        onTremoloChange={setTremolo}
                        tremoloFrequency={tremoloFrequency}
                        onTremoloFrequencyChange={setTremoloFrequencyState}
                        tremoloDepth={tremoloDepth}
                        onTremoloDepthChange={setTremoloDepthState}
                        vibratoEnabled={vibratoEnabled}
                        onVibratoEnabledChange={handleEffectToggle(setVibratoEnabledState)}
                        vibrato={vibrato}
                        onVibratoChange={setVibrato}
                        vibratoFrequency={vibratoFrequency}
                        onVibratoFrequencyChange={setVibratoFrequencyState}
                        vibratoDepth={vibratoDepth}
                        onVibratoDepthChange={setVibratoDepthState}
                        phaserEnabled={phaserEnabled}
                        onPhaserEnabledChange={handleEffectToggle(setPhaserEnabledState)}
                        phaser={phaser}
                        onPhaserChange={setPhaser}
                        phaserFrequency={phaserFrequency}
                        onPhaserFrequencyChange={setPhaserFrequencyState}
                        phaserOctaves={phaserOctaves}
                        onPhaserOctavesChange={setPhaserOctavesState}
                        phaserQ={phaserQ}
                        onPhaserQChange={setPhaserQState}
                        roomSize={roomSize}
                        onRoomSizeChange={handleRoomSizeChange}
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
                              humanize={humanize}
                              gate={gate}
                              inversionRegister={inversionRegister}
                              instrument={instrument}
                              scale={mode === 'custom' ? customMode.trim() : mode}
                              genre={genre === 'custom' ? customGenre.trim() : genre}
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
                        humanize={humanize}
                        gate={gate}
                        inversionRegister={inversionRegister}
                        instrument={instrument}
                        octaveShift={octaveShift}
                        scale={mode === 'custom' ? customMode.trim() : mode}
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
                          humanize={humanize}
                          gate={gate}
                          inversionRegister={inversionRegister}
                          instrument={instrument}
                          scale={mode === 'custom' ? customMode.trim() : mode}
                          genre={genre === 'custom' ? customGenre.trim() : genre}
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
                        humanize={humanize}
                        gate={gate}
                        inversionRegister={inversionRegister}
                        instrument={instrument}
                        octaveShift={octaveShift}
                        scale={mode === 'custom' ? customMode.trim() : mode}
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
                    humanize={humanize}
                    onHumanizeChange={setHumanize}
                    gate={gate}
                    onGateChange={setGate}
                    inversionRegister={inversionRegister}
                    onInversionRegisterChange={setInversionRegister}
                    instrument={instrument}
                    onInstrumentChange={setInstrument}
                    octaveShift={octaveShift}
                    onOctaveShiftChange={setOctaveShift}
                    reverb={reverb}
                    onReverbChange={handleReverbChange}
                    reverbEnabled={reverbEnabled}
                    onReverbEnabledChange={handleEffectToggle(setReverbEnabledState)}
                    chorus={chorus}
                    onChorusChange={handleChorusChange}
                    chorusEnabled={chorusEnabled}
                    onChorusEnabledChange={handleEffectToggle(setChorusEnabledState)}
                    chorusRate={chorusRate}
                    onChorusRateChange={setChorusRate}
                    chorusDepth={chorusDepth}
                    onChorusDepthChange={setChorusDepthState}
                    chorusDelayTime={chorusDelayTime}
                    onChorusDelayTimeChange={setChorusDelayTimeState}
                    feedbackDelayEnabled={feedbackDelayEnabled}
                    onFeedbackDelayEnabledChange={handleEffectToggle(setFeedbackDelayEnabledState)}
                    feedbackDelay={feedbackDelay}
                    onFeedbackDelayChange={handleFeedbackDelayChange}
                    feedbackDelayTime={feedbackDelayTime}
                    onFeedbackDelayTimeChange={setFeedbackDelayTimeState}
                    feedbackDelayFeedback={feedbackDelayFeedback}
                    onFeedbackDelayFeedbackChange={setFeedbackDelayFeedbackState}
                    tremoloEnabled={tremoloEnabled}
                    onTremoloEnabledChange={handleEffectToggle(setTremoloEnabledState)}
                    tremolo={tremolo}
                    onTremoloChange={setTremolo}
                    tremoloFrequency={tremoloFrequency}
                    onTremoloFrequencyChange={setTremoloFrequencyState}
                    tremoloDepth={tremoloDepth}
                    onTremoloDepthChange={setTremoloDepthState}
                    vibratoEnabled={vibratoEnabled}
                    onVibratoEnabledChange={handleEffectToggle(setVibratoEnabledState)}
                    vibrato={vibrato}
                    onVibratoChange={setVibrato}
                    vibratoFrequency={vibratoFrequency}
                    onVibratoFrequencyChange={setVibratoFrequencyState}
                    vibratoDepth={vibratoDepth}
                    onVibratoDepthChange={setVibratoDepthState}
                    phaserEnabled={phaserEnabled}
                    onPhaserEnabledChange={handleEffectToggle(setPhaserEnabledState)}
                    phaser={phaser}
                    onPhaserChange={setPhaser}
                    phaserFrequency={phaserFrequency}
                    onPhaserFrequencyChange={setPhaserFrequencyState}
                    phaserOctaves={phaserOctaves}
                    onPhaserOctavesChange={setPhaserOctavesState}
                    phaserQ={phaserQ}
                    onPhaserQChange={setPhaserQState}
                    roomSize={roomSize}
                    onRoomSizeChange={handleRoomSizeChange}
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
