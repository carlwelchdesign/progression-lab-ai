'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LoopIcon from '@mui/icons-material/Loop';
import SaveIcon from '@mui/icons-material/Save';
import { alpha, type Theme, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  playChordPattern,
  playMetronomeClick,
  startAudio,
  stopAllAudio,
} from '../../../domain/audio/audio';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { CHORD_OPTIONS } from '../../../lib/formOptions';
import PlaybackSettingsButton from './PlaybackSettingsButton';
import PlaybackToggleButton from './PlaybackToggleButton';
import SelectField from '../../../components/ui/SelectField';
import { stopGlobalPlayback } from '../hooks/usePlaybackToggle';
import SaveArrangementDialog from '../../arrangements/components/SaveArrangementDialog';
import SequencerTrack from './SequencerTrack';
import type {
  PlaybackSettings,
  PlaybackSettingsChangeHandlers,
} from '../lib/playbackSettingsModel';
import type { TimeSignature } from '../../../domain/audio/audio';
import type {
  ArrangementEvent,
  ArrangementPlaybackSnapshot,
  ArrangementTimeline,
} from '../../../lib/types';

/**
 * Render-ready chord data for each playable grid pad.
 */
type ChordGridEntry = {
  key: string;
  chord: string;
  source: string;
  leftHand: string[];
  rightHand: string[];
};

const STEPS_PER_BEAT = 4;
const LOOP_LENGTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const getBeatsPerBar = (signature: TimeSignature): number => {
  const numerator = Number.parseInt(signature.split('/')[0], 10);
  return Number.isFinite(numerator) && numerator > 0 ? numerator : 4;
};

const getTransportIconButtonSx =
  (isActive: boolean, tone: 'primary' | 'error' = 'primary') =>
  (theme: Theme) => {
    const palette = tone === 'error' ? theme.palette.error : theme.palette.primary;

    return {
      borderWidth: 1.5,
      borderStyle: 'solid',
      borderRadius: 1,
      color: isActive ? theme.palette.common.white : palette.main,
      borderColor: isActive ? palette.main : alpha(palette.main, 0.9),
      backgroundColor: isActive ? palette.main : 'transparent',
      '&:hover': {
        borderColor: palette.main,
        backgroundColor: isActive ? palette.dark : alpha(palette.main, 0.08),
      },
    };
  };

/**
 * Props for the generated chord grid playground dialog.
 */
type GeneratedChordGridDialogProps = {
  open: boolean;
  onClose: () => void;
  tempoBpm: number;
  settings: PlaybackSettings;
  onSettingsChange: PlaybackSettingsChangeHandlers;
  onTempoBpmChange: (value: number) => void;
  chords: ChordGridEntry[];
};

/**
 * Picks a deterministic border color from chord quality or chord-name hash.
 */
function getChordBorderColor(chordName: string, suggestionBorders: readonly string[]): string {
  if (/sus/i.test(chordName)) {
    return suggestionBorders[1] ?? suggestionBorders[0];
  }

  if (/(?:maj9|add9|\b9\b|\b7\b|11|13)/i.test(chordName)) {
    return suggestionBorders[5] ?? suggestionBorders[0];
  }

  if (/(?:^|[^A-Za-z])m(?!aj)|min/i.test(chordName)) {
    return suggestionBorders[2] ?? suggestionBorders[0];
  }

  if (/dim|o/i.test(chordName)) {
    return suggestionBorders[3] ?? suggestionBorders[0];
  }

  if (/aug|\+/i.test(chordName)) {
    return suggestionBorders[4] ?? suggestionBorders[0];
  }

  let hash = 0;
  for (const char of chordName) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  }

  return suggestionBorders[Math.abs(hash) % suggestionBorders.length] ?? suggestionBorders[0];
}

/**
 * Displays a playable and editable pad grid for generated chord voicings.
 */
export default function GeneratedChordGridDialog({
  open,
  onClose,
  tempoBpm,
  settings,
  onSettingsChange,
  onTempoBpmChange,
  chords,
}: GeneratedChordGridDialogProps) {
  const theme = useTheme();
  const { appColors } = theme.palette;

  const {
    playbackStyle,
    attack,
    decay,
    padVelocity,
    humanize,
    gate,
    inversionRegister,
    instrument,
    octaveShift,
    padPattern,
    timeSignature,
    padLatchMode,
    metronomeEnabled,
    metronomeVolume,
  } = settings;

  const [activePadKey, setActivePadKey] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableChords, setEditableChords] = useState<ChordGridEntry[]>(chords);
  const [editingPadKey, setEditingPadKey] = useState<string | null>(null);
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCountInActive, setIsCountInActive] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(true);
  const [loopLengthBars, setLoopLengthBars] = useState<(typeof LOOP_LENGTH_OPTIONS)[number]>(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [arrangementEvents, setArrangementEvents] = useState<ArrangementEvent[]>([]);
  const [saveArrangementDialogOpen, setSaveArrangementDialogOpen] = useState(false);
  const activePadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequencerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countInIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countInStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStepRef = useRef(0);
  const eventsByStepRef = useRef<Map<number, ArrangementEvent[]>>(new Map());
  const totalStepsRef = useRef(0);
  const isLoopEnabledRef = useRef(isLoopEnabled);
  const metronomeEnabledRef = useRef(metronomeEnabled);
  const beatsPerBarRef = useRef(4);
  const beatPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBeatPulseVisible, setIsBeatPulseVisible] = useState(false);
  const [isDownbeatPulse, setIsDownbeatPulse] = useState(false);
  const [currentBeatInBar, setCurrentBeatInBar] = useState(1);
  const padStyles = {
    body: {
      bg: appColors.surface.chordPadBodyGradient,
      bgHover: appColors.surface.chordPadBodyGradientHover,
    },
    active: {
      bg: appColors.surface.chordPadActiveGradient,
      border: appColors.accent.chordPadActiveBorder,
    },
  } as const;

  useEffect(() => {
    return () => {
      if (activePadTimeout.current) {
        clearTimeout(activePadTimeout.current);
      }

      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
      }

      if (countInIntervalRef.current) {
        clearInterval(countInIntervalRef.current);
      }

      if (countInStartTimeoutRef.current) {
        clearTimeout(countInStartTimeoutRef.current);
      }

      if (beatPulseTimeoutRef.current) {
        clearTimeout(beatPulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setEditableChords(chords);
    setEditingPadKey(null);
  }, [chords, open]);

  useEffect(() => {
    if (!open) {
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
        sequencerIntervalRef.current = null;
      }

      if (countInIntervalRef.current) {
        clearInterval(countInIntervalRef.current);
        countInIntervalRef.current = null;
      }

      if (countInStartTimeoutRef.current) {
        clearTimeout(countInStartTimeoutRef.current);
        countInStartTimeoutRef.current = null;
      }

      setIsSequencerPlaying(false);
      setIsRecording(false);
      setIsCountInActive(false);
      setCurrentStep(0);
      currentStepRef.current = 0;
    }
  }, [open]);

  const beatsPerBar = useMemo(() => getBeatsPerBar(timeSignature), [timeSignature]);
  const stepsPerBar = beatsPerBar * STEPS_PER_BEAT;
  const totalSteps = stepsPerBar * loopLengthBars;

  const eventsByStep = useMemo(() => {
    const grouped = new Map<number, ArrangementEvent[]>();
    arrangementEvents.forEach((event) => {
      if (!grouped.has(event.stepIndex)) {
        grouped.set(event.stepIndex, []);
      }

      grouped.get(event.stepIndex)?.push(event);
    });
    return grouped;
  }, [arrangementEvents]);

  useEffect(() => {
    eventsByStepRef.current = eventsByStep;
  }, [eventsByStep]);

  useEffect(() => {
    totalStepsRef.current = totalSteps;
  }, [totalSteps]);

  useEffect(() => {
    isLoopEnabledRef.current = isLoopEnabled;
  }, [isLoopEnabled]);

  useEffect(() => {
    metronomeEnabledRef.current = metronomeEnabled;
  }, [metronomeEnabled]);

  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
  }, [beatsPerBar]);

  const timeline = useMemo<ArrangementTimeline>(
    () => ({
      stepsPerBar,
      loopLengthBars,
      totalSteps,
      events: arrangementEvents,
    }),
    [arrangementEvents, loopLengthBars, stepsPerBar, totalSteps],
  );

  const playbackSnapshot = useMemo<ArrangementPlaybackSnapshot>(
    () => ({
      tempoBpm,
      timeSignature,
      padPattern,
      playbackStyle,
      instrument,
      octaveShift,
      attack,
      decay,
      padVelocity,
      humanize,
      gate,
      inversionRegister,
    }),
    [
      attack,
      decay,
      gate,
      humanize,
      instrument,
      inversionRegister,
      octaveShift,
      padPattern,
      padVelocity,
      playbackStyle,
      tempoBpm,
      timeSignature,
    ],
  );

  const playEntry = (
    entry: Pick<ChordGridEntry, 'key' | 'leftHand' | 'rightHand'>,
    options?: {
      stopBefore?: boolean;
      loop?: boolean;
      useCurrentPadPattern?: boolean;
      velocity?: number;
    },
  ) => {
    if (options?.stopBefore !== false) {
      stopGlobalPlayback();
    }

    void playChordPattern({
      leftHand: entry.leftHand,
      rightHand: entry.rightHand,
      padPattern: options?.useCurrentPadPattern === false ? 'single' : padPattern,
      timeSignature,
      loop: options?.loop ?? false,
      tempoBpm,
      playbackStyle,
      attack,
      decay,
      velocity: options?.velocity ?? padVelocity,
      humanize,
      gate,
      inversionRegister,
      instrument,
      octaveShift,
    });
  };

  const stopSequencer = () => {
    if (sequencerIntervalRef.current) {
      clearInterval(sequencerIntervalRef.current);
      sequencerIntervalRef.current = null;
    }

    if (countInIntervalRef.current) {
      clearInterval(countInIntervalRef.current);
      countInIntervalRef.current = null;
    }

    if (countInStartTimeoutRef.current) {
      clearTimeout(countInStartTimeoutRef.current);
      countInStartTimeoutRef.current = null;
    }

    setIsSequencerPlaying(false);
    setIsRecording(false);
    setIsCountInActive(false);
    setCurrentStep(0);
    currentStepRef.current = 0;
    setIsBeatPulseVisible(false);
    setCurrentBeatInBar(1);

    if (beatPulseTimeoutRef.current) {
      clearTimeout(beatPulseTimeoutRef.current);
      beatPulseTimeoutRef.current = null;
    }

    stopAllAudio();
  };

  const pulseBeatIndicator = (beatNumber: number, isDownbeat: boolean) => {
    setCurrentBeatInBar(beatNumber);
    setIsDownbeatPulse(isDownbeat);
    setIsBeatPulseVisible(true);

    if (beatPulseTimeoutRef.current) {
      clearTimeout(beatPulseTimeoutRef.current);
    }

    beatPulseTimeoutRef.current = setTimeout(() => {
      setIsBeatPulseVisible(false);
      beatPulseTimeoutRef.current = null;
    }, 120);
  };

  const startSequencer = () => {
    if (sequencerIntervalRef.current) {
      clearInterval(sequencerIntervalRef.current);
    }

    stopGlobalPlayback();
    stopAllAudio();

    const stepDurationMs = 60_000 / tempoBpm / STEPS_PER_BEAT;
    currentStepRef.current = 0;
    setCurrentStep(0);
    setIsSequencerPlaying(true);

    const runSequencerStep = () => {
      const stepIndex = currentStepRef.current;
      setCurrentStep(stepIndex);

      if (metronomeEnabledRef.current && stepIndex % STEPS_PER_BEAT === 0) {
        const beatInBar = Math.floor(stepIndex / STEPS_PER_BEAT) % beatsPerBarRef.current;
        const isDownbeat = beatInBar === 0;

        pulseBeatIndicator(beatInBar + 1, isDownbeat);
        void playMetronomeClick(metronomeVolume, isDownbeat);
      }

      const events = eventsByStepRef.current.get(stepIndex) ?? [];
      events.forEach((event) => {
        playEntry(
          { key: event.padKey, leftHand: event.leftHand, rightHand: event.rightHand },
          {
            stopBefore: false,
            loop: false,
            useCurrentPadPattern: false,
            velocity: event.velocity ?? padVelocity,
          },
        );
      });

      const nextStep = stepIndex + 1;
      if (nextStep >= totalStepsRef.current) {
        if (isLoopEnabledRef.current) {
          currentStepRef.current = 0;
          return;
        }

        stopSequencer();
        return;
      }

      currentStepRef.current = nextStep;
    };

    runSequencerStep();

    sequencerIntervalRef.current = setInterval(() => {
      runSequencerStep();
    }, stepDurationMs);
  };

  const handleSequencerPlayToggle = () => {
    if (isSequencerPlaying) {
      stopSequencer();
      return;
    }

    startSequencer();
  };

  const handleRecordToggle = () => {
    if (isCountInActive) {
      stopSequencer();
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    stopSequencer();
    setCurrentBeatInBar(1);
    setIsCountInActive(true);

    void startAudio().then(() => {
      let beatIndex = 0;
      const stepDurationMs = 60_000 / tempoBpm;

      const runCountInBeat = () => {
        const beatNumber = beatIndex + 1;
        const isDownbeat = beatIndex === 0;

        pulseBeatIndicator(beatNumber, isDownbeat);
        void playMetronomeClick(metronomeVolume, isDownbeat);

        beatIndex += 1;

        if (beatIndex >= beatsPerBar) {
          if (countInIntervalRef.current) {
            clearInterval(countInIntervalRef.current);
            countInIntervalRef.current = null;
          }

          countInStartTimeoutRef.current = setTimeout(() => {
            countInStartTimeoutRef.current = null;
            setIsCountInActive(false);
            setCurrentBeatInBar(1);
            startSequencer();
            setIsRecording(true);
          }, stepDurationMs);
        }
      };

      runCountInBeat();
      countInIntervalRef.current = setInterval(runCountInBeat, stepDurationMs);
    });
  };

  const clearRecordedEvents = () => {
    setArrangementEvents([]);
    setCurrentStep(0);
    currentStepRef.current = 0;
  };

  const triggerPad = (entry: ChordGridEntry) => {
    if (activePadTimeout.current) {
      clearTimeout(activePadTimeout.current);
    }

    setActivePadKey(entry.key);
    activePadTimeout.current = setTimeout(() => {
      setActivePadKey(null);
      activePadTimeout.current = null;
    }, 180);

    const playInSequencerContext = isSequencerPlaying || isRecording;
    playEntry(entry, {
      stopBefore: !playInSequencerContext,
      loop: playInSequencerContext ? false : padLatchMode,
      useCurrentPadPattern: !playInSequencerContext,
    });
  };

  const onPadPress = (entry: ChordGridEntry) => {
    if (isEditMode) {
      setEditingPadKey(entry.key);
    }

    triggerPad(entry);

    if (isRecording) {
      const stepIndex = Math.min(currentStepRef.current, Math.max(0, totalSteps - 1));
      const event: ArrangementEvent = {
        padKey: entry.key,
        chord: entry.chord,
        source: entry.source,
        leftHand: entry.leftHand,
        rightHand: entry.rightHand,
        stepIndex,
        velocity: padVelocity,
      };

      setArrangementEvents((previous) => {
        const filtered = previous.filter(
          (candidate) =>
            !(candidate.stepIndex === event.stepIndex && candidate.padKey === event.padKey),
        );
        return [...filtered, event].sort((a, b) => a.stepIndex - b.stepIndex);
      });
    }
  };

  const onPadChordChange = (padKey: string, chord: string) => {
    const voicing = createPianoVoicingFromChordSymbol(chord);
    if (!voicing) {
      return;
    }

    setEditableChords((previous) =>
      previous.map((entry) =>
        entry.key === padKey
          ? {
              ...entry,
              chord,
              leftHand: voicing.leftHand,
              rightHand: voicing.rightHand,
            }
          : entry,
      ),
    );
  };

  const editableChordOptions = useMemo(() => {
    const values = Array.from(
      new Set([...CHORD_OPTIONS, ...editableChords.map((entry) => entry.chord)]),
    );
    return values.map((value) => ({ value, label: value }));
  }, [editableChords]);

  const editingEntry = editingPadKey
    ? editableChords.find((entry) => entry.key === editingPadKey)
    : undefined;

  const handleStartEditing = () => {
    setIsEditMode(true);
  };

  const handleSaveEditing = () => {
    setIsEditMode(false);
    setEditingPadKey(null);
  };

  const previewEntry =
    editableChords.find((entry) => entry.key === activePadKey) ??
    (editableChords.length > 0
      ? {
          leftHand: editableChords[0].leftHand,
          rightHand: editableChords[0].rightHand,
        }
      : undefined);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 800,
          paddingTop: 2,
          borderRadius: 2,
          color: 'common.white',
          background: appColors.surface.chordPlaygroundDialogGradient,
          border: `1px solid ${appColors.surface.chordPlaygroundDialogBorder}`,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">Chord Playground</Typography>
          <IconButton
            aria-label="Close chord playground"
            onClick={onClose}
            size="small"
            sx={{ color: appColors.accent.chordCloseIcon }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            mb: 1.5,
            p: 1.25,
            borderRadius: 1.5,
            bgcolor: appColors.surface.translucentPanel,
            border: `1px solid ${appColors.surface.translucentPanelBorder}`,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <PlaybackToggleButton
            isPlaying={isSequencerPlaying}
            onClick={handleSequencerPlayToggle}
          />
          <Tooltip
            title={
              isCountInActive
                ? `Count-in ${currentBeatInBar}/${beatsPerBar}`
                : isRecording
                  ? 'Stop recording'
                  : 'Record arrangement'
            }
          >
            <IconButton
              size="small"
              aria-label={
                isCountInActive
                  ? `Count-in ${currentBeatInBar} of ${beatsPerBar}`
                  : isRecording
                    ? 'Stop recording'
                    : 'Record arrangement'
              }
              onClick={handleRecordToggle}
              sx={getTransportIconButtonSx(isRecording || isCountInActive, 'error')}
            >
              <FiberManualRecordIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isLoopEnabled ? 'Disable loop' : 'Enable loop'}>
            <IconButton
              size="small"
              aria-label={isLoopEnabled ? 'Disable loop' : 'Enable loop'}
              onClick={() => setIsLoopEnabled((previous) => !previous)}
              sx={getTransportIconButtonSx(isLoopEnabled)}
            >
              <LoopIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={metronomeEnabled ? 'Disable metronome' : 'Enable metronome'}>
            <IconButton
              size="small"
              aria-label={metronomeEnabled ? 'Disable metronome' : 'Enable metronome'}
              onClick={() => onSettingsChange.onMetronomeEnabledChange(!metronomeEnabled)}
              sx={getTransportIconButtonSx(metronomeEnabled)}
            >
              <AvTimerIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: isDownbeatPulse
                  ? theme.palette.error.main
                  : theme.palette.primary.main,
                opacity: metronomeEnabled && isBeatPulseVisible ? 1 : 0.25,
                transform: metronomeEnabled && isBeatPulseVisible ? 'scale(1.35)' : 'scale(1)',
                boxShadow:
                  metronomeEnabled && isBeatPulseVisible
                    ? isDownbeatPulse
                      ? `0 0 0 5px ${alpha(theme.palette.error.main, 0.24)}`
                      : `0 0 0 5px ${alpha(theme.palette.primary.main, 0.24)}`
                    : 'none',
                transition: 'opacity 90ms ease, transform 90ms ease, box-shadow 90ms ease',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
              Beat {currentBeatInBar}/{beatsPerBar}
            </Typography>
          </Box>
          <IconButton
            aria-label="Clear recording"
            size="small"
            onClick={clearRecordedEvents}
            disabled={arrangementEvents.length === 0}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
          <Box
            sx={{
              ml: { xs: 0, sm: 'auto' },
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 144 },
            }}
          >
            <SelectField
              label="Length"
              value={String(loopLengthBars)}
              size="small"
              onChange={(event) => {
                const nextValue = Number.parseInt(event.target.value, 10);
                if (
                  LOOP_LENGTH_OPTIONS.includes(nextValue as (typeof LOOP_LENGTH_OPTIONS)[number])
                ) {
                  setLoopLengthBars(nextValue as (typeof LOOP_LENGTH_OPTIONS)[number]);
                  setCurrentStep(0);
                  currentStepRef.current = 0;
                }
              }}
              options={LOOP_LENGTH_OPTIONS.map((value) => ({
                value: String(value),
                label: `${value} bar${value > 1 ? 's' : ''}`,
              }))}
              sx={{ minWidth: { xs: '100%', sm: 144 } }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ width: '100%', textAlign: 'right' }}
          >
            {isCountInActive ? 'Count-in active' : `Step ${currentStep + 1}/${totalSteps}`} •{' '}
            {arrangementEvents.length} event
            {arrangementEvents.length === 1 ? '' : 's'}
          </Typography>
        </Box>

        {/* DAW-style sequencer track visualization */}
        <SequencerTrack
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepsPerBar={stepsPerBar}
          beatsPerBar={beatsPerBar}
          tempoBpm={tempoBpm}
          isPlaying={isSequencerPlaying}
          loopLengthBars={loopLengthBars}
          events={arrangementEvents}
        />

        {isEditMode ? (
          <Box
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: appColors.surface.translucentPanel,
              border: `1px solid ${appColors.surface.translucentPanelBorder}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Select a pad, then pick a chord
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
              <Box sx={{ width: { xs: '68%', sm: 'auto' }, flexGrow: { sm: 1 }, minWidth: 0 }}>
                <SelectField
                  label="Pad chord"
                  value={editingEntry?.chord ?? ''}
                  onChange={(event) => {
                    if (editingPadKey) {
                      onPadChordChange(editingPadKey, event.target.value);
                    }
                  }}
                  options={editableChordOptions}
                  fullWidth
                  size="small"
                  disabled={!editingPadKey}
                />
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveEditing}
                disabled={!editingPadKey}
                sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Save
              </Button>
            </Box>
          </Box>
        ) : null}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(3, minmax(0, 1fr))',
              sm: 'repeat(4, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: { xs: 1, sm: 1.5 },
            p: { xs: 0.5, sm: 1 },
            borderRadius: 2,
            bgcolor: appColors.surface.chordPadGridBackground,
            border: `1px solid ${appColors.surface.translucentPanelBorder}`,
          }}
        >
          {editableChords.map((entry) => {
            const isActive = activePadKey === entry.key;
            const isEditing = editingPadKey === entry.key;
            const borderColor = getChordBorderColor(
              entry.chord,
              appColors.accent.chordSuggestionBorders,
            );
            const editingBorderColor = appColors.accent.chordPadEditBorder;

            return (
              <Button
                key={entry.key}
                variant="contained"
                onPointerDown={(event) => {
                  if (event.pointerType === 'touch') {
                    event.preventDefault();
                  }

                  onPadPress(entry);
                }}
                sx={{
                  aspectRatio: '1 / 1',
                  minHeight: { xs: 82, sm: 108 },
                  borderRadius: 1.5,
                  fontWeight: 700,
                  fontSize: { xs: '0.88rem', sm: '1.02rem' },
                  letterSpacing: 0.2,
                  textTransform: 'none',
                  color: 'common.white',
                  background: isEditing
                    ? appColors.surface.chordPadEditGradient
                    : isActive
                      ? padStyles.active.bg
                      : padStyles.body.bg,
                  backgroundColor: appColors.surface.chordPadDefaultBackground,
                  border: '2px solid',
                  borderColor: isEditing
                    ? editingBorderColor
                    : isActive
                      ? padStyles.active.border
                      : borderColor,
                  boxShadow: isEditing
                    ? `0 0 0 2px ${appColors.surface.chordPadEditGlow}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                    : isActive
                      ? `0 3px 0 ${appColors.surface.chordPadShadowPressed}`
                      : `0 8px 0 ${appColors.surface.chordPadShadowRest}`,
                  transform: isActive ? 'translateY(5px)' : 'translateY(0)',
                  transition:
                    'transform 90ms ease, box-shadow 90ms ease, background 120ms, border-color 120ms',
                  '&:hover': {
                    background: isEditing
                      ? appColors.surface.chordPadEditGradientHover
                      : isActive
                        ? padStyles.active.bg
                        : padStyles.body.bgHover,
                    boxShadow: isEditing
                      ? `0 0 0 2px ${appColors.surface.chordPadEditGlowHover}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                      : isActive
                        ? `0 3px 0 ${appColors.surface.chordPadShadowPressed}`
                        : `0 8px 0 ${appColors.surface.chordPadShadowRest}`,
                    borderColor: isEditing
                      ? editingBorderColor
                      : isActive
                        ? padStyles.active.border
                        : borderColor,
                  },
                  '&:active': {
                    transform: 'translateY(5px)',
                    background: isEditing
                      ? appColors.surface.chordPadEditGradientActive
                      : isActive
                        ? padStyles.active.bg
                        : padStyles.body.bgHover,
                    boxShadow: `0 3px 0 ${appColors.surface.chordPadShadowPressed}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, fontSize: { xs: '0.88rem', sm: '1.02rem' } }}
                  >
                    {entry.chord}
                  </Typography>
                </Box>
              </Button>
            );
          })}
        </Box>

        {editableChords.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No generated piano voicings available.
          </Typography>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <PlaybackSettingsButton
            settings={settings}
            onChange={onSettingsChange}
            tempoBpm={tempoBpm}
            onTempoBpmChange={onTempoBpmChange}
            previewVoicing={previewEntry}
            position="modal"
          />
          <Button
            size="small"
            variant="outlined"
            onClick={handleStartEditing}
            disabled={isEditMode}
            sx={(theme) => ({
              borderWidth: 1.5,
              color: theme.palette.primary.main,
              borderColor: alpha(theme.palette.primary.main, 0.9),
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderWidth: 1.5,
              },
              '&.Mui-disabled': {
                borderColor: alpha(theme.palette.primary.main, 0.35),
                color: alpha(theme.palette.primary.main, 0.45),
              },
            })}
          >
            Edit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              stopSequencer();
              setSaveArrangementDialogOpen(true);
            }}
            startIcon={<SaveIcon fontSize="small" />}
            disabled={arrangementEvents.length === 0}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Save arrangement
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              stopSequencer();
              stopAllAudio();
            }}
            sx={(theme) => ({
              borderWidth: 1.5,
              color: theme.palette.primary.main,
              borderColor: alpha(theme.palette.primary.main, 0.9),
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderWidth: 1.5,
              },
            })}
          >
            Stop audio
          </Button>
        </Box>
      </DialogActions>

      <SaveArrangementDialog
        open={saveArrangementDialogOpen}
        onClose={() => setSaveArrangementDialogOpen(false)}
        timeline={timeline}
        playbackSnapshot={playbackSnapshot}
        sourceChords={editableChords}
      />
    </Dialog>
  );
}
