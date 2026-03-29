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
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LoopIcon from '@mui/icons-material/Loop';
import SaveIcon from '@mui/icons-material/Save';
import { alpha, type Theme, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getAudioClockSeconds,
  playChordPattern,
  playMetronomeClick,
  startAudio,
  stopAllAudio,
} from '../../../domain/audio/audio';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import {
  getChordRootSemitone,
  getCircleOfFifthsNeighborSemitones,
} from '../../../domain/music/circleOfFifths';
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

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older mobile browsers (pre-iOS 15.4, older Android WebView)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const STEPS_PER_BEAT = 4;
const RECORDING_LEAD_IN_BARS = 1;
const LOOP_LENGTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const PAD_TRIGGER_KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
] as const;

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }

  if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
    return true;
  }

  return target.closest('[role="textbox"]') !== null;
};

const getSchedulerNowMs = (): number => {
  const audioClockMs = getAudioClockSeconds() * 1000;
  if (Number.isFinite(audioClockMs) && audioClockMs > 0) {
    return audioClockMs;
  }

  return performance.now();
};

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
type PendingArrangementLoad = {
  /** Unique value that changes each time a load is triggered (use arrangement id or a counter). */
  key: string;
  events: import('../../../lib/types').ArrangementEvent[];
  loopLengthBars: number;
};

type GeneratedChordGridDialogProps = {
  open: boolean;
  onClose: () => void;
  tempoBpm: number;
  settings: PlaybackSettings;
  onSettingsChange: PlaybackSettingsChangeHandlers;
  onTempoBpmChange: (value: number) => void;
  chords: ChordGridEntry[];
  /** When non-null, the dialog seeds its timeline from this value on mount / key change. */
  pendingLoad?: PendingArrangementLoad | null;
  /** Called after an arrangement is successfully saved, so callers can refresh lists. */
  onSaveSuccess?: () => void;
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
  pendingLoad = null,
  onSaveSuccess,
}: GeneratedChordGridDialogProps) {
  const { t } = useTranslation('generator');
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
  const [cofFocusPadKey, setCofFocusPadKey] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableChords, setEditableChords] = useState<ChordGridEntry[]>(chords);
  const [editingPadKey, setEditingPadKey] = useState<string | null>(null);
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCountInActive, setIsCountInActive] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(true);
  const [loopLengthBars, setLoopLengthBars] = useState<(typeof LOOP_LENGTH_OPTIONS)[number]>(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [trackScrollRequestKey, setTrackScrollRequestKey] = useState(0);
  const [arrangementEvents, setArrangementEvents] = useState<ArrangementEvent[]>([]);
  const [saveArrangementDialogOpen, setSaveArrangementDialogOpen] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const activePadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequencerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [hasDetectedHardwareKeyboardInput, setHasDetectedHardwareKeyboardInput] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktopKeyboardUi = useMediaQuery('(hover: hover) and (pointer: fine)');
  const showKeyboardHints = isDesktopKeyboardUi || hasDetectedHardwareKeyboardInput;
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

      if (sequencerTimerRef.current) {
        clearTimeout(sequencerTimerRef.current);
      }

      if (countInTimerRef.current) {
        clearTimeout(countInTimerRef.current);
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

  // Seed timeline from a loaded arrangement whenever the load key changes.
  useEffect(() => {
    if (!pendingLoad) {
      return;
    }

    const clampedBars = Math.max(
      1,
      Math.min(
        8,
        LOOP_LENGTH_OPTIONS.includes(
          pendingLoad.loopLengthBars as (typeof LOOP_LENGTH_OPTIONS)[number],
        )
          ? (pendingLoad.loopLengthBars as (typeof LOOP_LENGTH_OPTIONS)[number])
          : 1,
      ),
    ) as (typeof LOOP_LENGTH_OPTIONS)[number];

    setArrangementEvents(
      pendingLoad.events.map((event) => ({ ...event, id: event.id ?? generateId() })),
    );
    setSelectedStepIndex(null);
    setLoopLengthBars(clampedBars);
    setCurrentStep(0);
    currentStepRef.current = 0;
    setIsRecording(false);
    setIsSequencerPlaying(false);
    setIsCountInActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLoad?.key]);

  useEffect(() => {
    if (!open) {
      if (sequencerTimerRef.current) {
        clearTimeout(sequencerTimerRef.current);
        sequencerTimerRef.current = null;
      }

      if (countInTimerRef.current) {
        clearTimeout(countInTimerRef.current);
        countInTimerRef.current = null;
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
      setSelectedStepIndex(null);
      setCofFocusPadKey(null);
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
  const showRecordingLeadIn = isCountInActive || isRecording;

  const padHotkeyBindings = useMemo(
    () =>
      editableChords.map((entry, index) => ({
        entry,
        hotkey: PAD_TRIGGER_KEYS[index] ?? null,
      })),
    [editableChords],
  );

  const padHotkeyMap = useMemo(() => {
    const bindings = new Map<string, ChordGridEntry>();
    padHotkeyBindings.forEach(({ entry, hotkey }) => {
      if (hotkey) {
        bindings.set(hotkey, entry);
      }
    });
    return bindings;
  }, [padHotkeyBindings]);

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
    if (sequencerTimerRef.current) {
      clearTimeout(sequencerTimerRef.current);
      sequencerTimerRef.current = null;
    }

    if (countInTimerRef.current) {
      clearTimeout(countInTimerRef.current);
      countInTimerRef.current = null;
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
    if (sequencerTimerRef.current) {
      clearTimeout(sequencerTimerRef.current);
      sequencerTimerRef.current = null;
    }

    stopGlobalPlayback();
    stopAllAudio();
    void startAudio();

    const stepDurationMs = 60_000 / tempoBpm / STEPS_PER_BEAT;
    let expectedNextTick = getSchedulerNowMs();
    currentStepRef.current = 0;
    setCurrentStep(0);
    setIsSequencerPlaying(true);

    const scheduleNextStep = () => {
      expectedNextTick += stepDurationMs;
      const delayMs = Math.max(0, expectedNextTick - getSchedulerNowMs());

      sequencerTimerRef.current = setTimeout(() => {
        runSequencerStep();
      }, delayMs);
    };

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
          scheduleNextStep();
          return;
        }

        stopSequencer();
        return;
      }

      currentStepRef.current = nextStep;
      scheduleNextStep();
    };

    runSequencerStep();
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
    setTrackScrollRequestKey((previous) => previous + 1);

    void startAudio().then(() => {
      let stepIndex = 0;
      const stepDurationMs = 60_000 / tempoBpm / STEPS_PER_BEAT;
      const totalPreRollBeats = beatsPerBar;
      const totalPreRollSteps = totalPreRollBeats * STEPS_PER_BEAT;
      const leadInSteps = RECORDING_LEAD_IN_BARS * stepsPerBar;
      let expectedNextTick = getSchedulerNowMs();

      setCurrentStep(-leadInSteps);

      const scheduleNextCountInStep = () => {
        expectedNextTick += stepDurationMs;
        const delayMs = Math.max(0, expectedNextTick - getSchedulerNowMs());

        countInTimerRef.current = setTimeout(() => {
          runCountInStep();
        }, delayMs);
      };

      const runCountInStep = () => {
        const beatIndex = Math.floor(stepIndex / STEPS_PER_BEAT);
        const beatNumber = (beatIndex % beatsPerBar) + 1;
        const isDownbeat = beatNumber === 1;
        const isAudibleCountInBeat = beatIndex < beatsPerBar;

        if (stepIndex % STEPS_PER_BEAT === 0) {
          pulseBeatIndicator(beatNumber, isDownbeat);
          if (isAudibleCountInBeat) {
            void playMetronomeClick(metronomeVolume, isDownbeat);
          }
        }

        const completedPreRollSteps = stepIndex + 1;
        setCurrentStep(completedPreRollSteps - leadInSteps);

        stepIndex += 1;

        if (stepIndex >= totalPreRollSteps) {
          if (countInTimerRef.current) {
            clearTimeout(countInTimerRef.current);
            countInTimerRef.current = null;
          }

          setIsCountInActive(false);
          setCurrentBeatInBar(1);
          startSequencer();
          setIsRecording(true);

          return;
        }

        scheduleNextCountInStep();
      };

      runCountInStep();
    });
  };

  const clearRecordedEvents = () => {
    setArrangementEvents([]);
    setCurrentStep(0);
    currentStepRef.current = 0;
    setSelectedStepIndex(null);
  };

  const deleteSelectedClip = () => {
    if (selectedStepIndex === null) {
      return;
    }

    setArrangementEvents((prev) => prev.filter((event) => event.stepIndex !== selectedStepIndex));
    setSelectedStepIndex(null);
  };

  const moveClipStep = (sourceStepIndex: number, newStepIndex: number) => {
    setArrangementEvents((prev) =>
      prev
        .map((event) =>
          event.stepIndex === sourceStepIndex ? { ...event, stepIndex: newStepIndex } : event,
        )
        .sort((a, b) => a.stepIndex - b.stepIndex),
    );
    setSelectedStepIndex(newStepIndex);
  };

  const nudgeSelectedClip = (delta: number) => {
    if (selectedStepIndex === null) {
      return;
    }

    const next = Math.max(0, Math.min(totalSteps - 1, selectedStepIndex + delta));
    if (next === selectedStepIndex) {
      return;
    }

    moveClipStep(selectedStepIndex, next);
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
    } else {
      setCofFocusPadKey((previous) => (previous === entry.key ? null : entry.key));
    }

    triggerPad(entry);

    if (isRecording) {
      const stepIndex = Math.min(currentStepRef.current, Math.max(0, totalSteps - 1));
      const event: ArrangementEvent = {
        id: generateId(),
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

  useEffect(() => {
    if (!open || saveArrangementDialogOpen) {
      return;
    }

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (!isDesktopKeyboardUi && !hasDetectedHardwareKeyboardInput) {
        setHasDetectedHardwareKeyboardInput(true);
      }

      if (event.defaultPrevented || event.repeat || isTypingTarget(event.target)) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === ' ') {
        event.preventDefault();
        handleSequencerPlayToggle();
        return;
      }

      if (event.key === 'Shift') {
        event.preventDefault();
        handleRecordToggle();
        return;
      }

      if ((key === 'delete' || key === 'backspace') && selectedStepIndex !== null) {
        event.preventDefault();
        deleteSelectedClip();
        return;
      }

      if (key === 'escape') {
        setSelectedStepIndex(null);
        return;
      }

      if ((key === 'arrowleft' || key === 'arrowright') && selectedStepIndex !== null) {
        event.preventDefault();
        nudgeSelectedClip(key === 'arrowleft' ? -1 : 1);
        return;
      }

      const matchedEntry = padHotkeyMap.get(key);
      if (!matchedEntry) {
        return;
      }

      event.preventDefault();
      onPadPress(matchedEntry);
    };

    window.addEventListener('keydown', onWindowKeyDown);

    return () => {
      window.removeEventListener('keydown', onWindowKeyDown);
    };
  }, [
    handleRecordToggle,
    handleSequencerPlayToggle,
    hasDetectedHardwareKeyboardInput,
    isDesktopKeyboardUi,
    onPadPress,
    open,
    padHotkeyMap,
    saveArrangementDialogOpen,
    selectedStepIndex,
    totalSteps,
  ]);

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

  const cofHighlightedKeys = useMemo<Set<string>>(() => {
    if (!cofFocusPadKey) {
      return new Set();
    }

    const focusedEntry = editableChords.find((entry) => entry.key === cofFocusPadKey);
    if (!focusedEntry) {
      return new Set();
    }

    const rootSemitone = getChordRootSemitone(focusedEntry.chord);
    if (rootSemitone === null) {
      return new Set();
    }

    const neighborSemitones = getCircleOfFifthsNeighborSemitones(rootSemitone);
    const highlighted = new Set<string>();
    for (const entry of editableChords) {
      if (entry.key === cofFocusPadKey) {
        continue;
      }

      const entrySemitone = getChordRootSemitone(entry.chord);
      if (entrySemitone !== null && neighborSemitones.has(entrySemitone)) {
        highlighted.add(entry.key);
      }
    }

    return highlighted;
  }, [cofFocusPadKey, editableChords]);

  const editableChordOptions = useMemo(() => {
    const values = Array.from(
      new Set([...CHORD_OPTIONS, ...editableChords.map((entry) => entry.chord)]),
    );
    return values.map((value) => ({ value, label: value }));
  }, [editableChords]);

  const editingEntry = editingPadKey
    ? editableChords.find((entry) => entry.key === editingPadKey)
    : undefined;
  const selectedStepEventCount =
    selectedStepIndex === null ? 0 : (eventsByStep.get(selectedStepIndex)?.length ?? 0);

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
      dir="ltr"
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-container': {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
      PaperProps={{
        dir: 'ltr',
        style: { direction: 'ltr' },
        sx: {
          width: '100%',
          maxWidth: isMobile ? '100%' : 800,
          paddingTop: 2,
          borderRadius: isMobile ? 0 : 2,
          color: 'common.white',
          background: appColors.surface.chordPlaygroundDialogGradient,
          border: isMobile ? 'none' : `1px solid ${appColors.surface.chordPlaygroundDialogBorder}`,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{t('ui.chordGrid.title')}</Typography>
          <IconButton
            aria-label={t('ui.chordGrid.closeAriaLabel')}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              mb: { xs: 0.75, sm: 0 },
            }}
          >
            <PlaybackToggleButton
              isPlaying={isSequencerPlaying}
              onClick={handleSequencerPlayToggle}
            />
            <Tooltip
              title={
                isCountInActive
                  ? t('ui.chordGrid.countInTooltip', {
                      current: currentBeatInBar,
                      total: beatsPerBar,
                    })
                  : isRecording
                    ? t('ui.chordGrid.stopRecording')
                    : t('ui.chordGrid.recordArrangement')
              }
            >
              <IconButton
                size="small"
                aria-label={
                  isCountInActive
                    ? t('ui.chordGrid.countInAriaLabel', {
                        current: currentBeatInBar,
                        total: beatsPerBar,
                      })
                    : isRecording
                      ? t('ui.chordGrid.stopRecording')
                      : t('ui.chordGrid.recordArrangement')
                }
                onClick={handleRecordToggle}
                sx={getTransportIconButtonSx(isRecording || isCountInActive, 'error')}
              >
                <FiberManualRecordIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={isLoopEnabled ? t('ui.chordGrid.disableLoop') : t('ui.chordGrid.enableLoop')}
            >
              <IconButton
                size="small"
                aria-label={
                  isLoopEnabled ? t('ui.chordGrid.disableLoop') : t('ui.chordGrid.enableLoop')
                }
                onClick={() => setIsLoopEnabled((previous) => !previous)}
                sx={getTransportIconButtonSx(isLoopEnabled)}
              >
                <LoopIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                metronomeEnabled
                  ? t('ui.chordGrid.disableMetronome')
                  : t('ui.chordGrid.enableMetronome')
              }
            >
              <IconButton
                size="small"
                aria-label={
                  metronomeEnabled
                    ? t('ui.chordGrid.disableMetronome')
                    : t('ui.chordGrid.enableMetronome')
                }
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
                {t('ui.chordGrid.beatCounter', {
                  current: currentBeatInBar,
                  total: beatsPerBar,
                })}
              </Typography>
            </Box>
            <IconButton
              aria-label={t('ui.chordGrid.clearRecording')}
              size="small"
              onClick={clearRecordedEvents}
              disabled={arrangementEvents.length === 0}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              ml: { xs: 0, sm: 'auto' },
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 144 },
            }}
          >
            <SelectField
              label={t('ui.chordGrid.lengthLabel')}
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
                label:
                  value === 1
                    ? t('ui.chordGrid.oneBar')
                    : t('ui.chordGrid.multipleBars', { count: value }),
              }))}
              sx={{ minWidth: { xs: '100%', sm: 144 } }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ width: '100%' }}
            style={{ textAlign: 'right' }}
          >
            {isCountInActive
              ? t('ui.chordGrid.countInActive')
              : t('ui.chordGrid.stepSummary', {
                  current: currentStep + 1,
                  total: totalSteps,
                })}{' '}
            •{' '}
            {arrangementEvents.length === 1
              ? t('ui.chordGrid.eventSingular', { count: arrangementEvents.length })
              : t('ui.chordGrid.eventPlural', { count: arrangementEvents.length })}
          </Typography>
        </Box>

        {/* DAW-style sequencer track visualization */}
        <SequencerTrack
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepsPerBar={stepsPerBar}
          beatsPerBar={beatsPerBar}
          tempoBpm={tempoBpm}
          isPlaying={isSequencerPlaying || isCountInActive}
          loopLengthBars={loopLengthBars}
          leadInBars={showRecordingLeadIn ? RECORDING_LEAD_IN_BARS : 0}
          scrollToStep={showRecordingLeadIn ? stepsPerBar * RECORDING_LEAD_IN_BARS : 0}
          scrollRequestKey={trackScrollRequestKey}
          events={arrangementEvents}
          selectedStepIndex={selectedStepIndex}
          onClipClick={(sourceStepIndex) => {
            setSelectedStepIndex((prev) => (prev === sourceStepIndex ? null : sourceStepIndex));
          }}
          onClipMove={moveClipStep}
        />

        {selectedStepIndex !== null && isMobile ? (
          <Box
            sx={{
              mb: 1.5,
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: appColors.surface.translucentPanel,
              border: `1px solid ${appColors.surface.translucentPanelBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 160 }}>
              <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                {t('ui.chordGrid.selectedClipTitle', {
                  defaultValue: 'Selected clip',
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('ui.chordGrid.selectedClipMeta', {
                  defaultValue:
                    '{{count}} event at step {{step}}. Drag the clip or use the controls to move it.',
                  count: selectedStepEventCount,
                  step: selectedStepIndex + 1,
                })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              <Tooltip
                title={t('ui.chordGrid.moveClipLeft', {
                  defaultValue: 'Move clip left',
                })}
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => nudgeSelectedClip(-1)}
                    disabled={selectedStepIndex === 0}
                    aria-label={t('ui.chordGrid.moveClipLeft', {
                      defaultValue: 'Move clip left',
                    })}
                  >
                    <KeyboardArrowLeftIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={t('ui.chordGrid.moveClipRight', {
                  defaultValue: 'Move clip right',
                })}
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => nudgeSelectedClip(1)}
                    disabled={selectedStepIndex >= totalSteps - 1}
                    aria-label={t('ui.chordGrid.moveClipRight', {
                      defaultValue: 'Move clip right',
                    })}
                  >
                    <KeyboardArrowRightIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={t('ui.chordGrid.deleteSelectedClip', { defaultValue: 'Delete clip' })}
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={deleteSelectedClip}
                    aria-label={t('ui.chordGrid.deleteSelectedClip', {
                      defaultValue: 'Delete clip',
                    })}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
              {t('ui.chordGrid.touchEditHint', {
                defaultValue: 'Tap a clip to select it. Drag it horizontally to move it.',
              })}
            </Typography>
          </Box>
        ) : null}

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
              {t('ui.chordGrid.selectPadThenChord')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
              <Box sx={{ width: { xs: '68%', sm: 'auto' }, flexGrow: { sm: 1 }, minWidth: 0 }}>
                <SelectField
                  label={t('ui.chordGrid.padChordLabel')}
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
                {t('ui.buttons.save')}
              </Button>
            </Box>
          </Box>
        ) : null}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(4, minmax(0, 1fr))',
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
          {padHotkeyBindings.map(({ entry, hotkey }) => {
            const isActive = activePadKey === entry.key;
            const isEditing = editingPadKey === entry.key;
            const isCoFHighlighted = cofHighlightedKeys.has(entry.key);
            const borderColor = getChordBorderColor(
              entry.chord,
              appColors.accent.chordSuggestionBorders,
            );
            const editingBorderColor = appColors.accent.chordPadEditBorder;
            const cofBorderColor = appColors.accent.chordPadCofBorder;
            const cofGlowColor = appColors.accent.chordPadCofGlow;
            const hotkeyLabel = hotkey ? hotkey.toUpperCase() : null;

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
                  position: 'relative',
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
                      : isCoFHighlighted
                        ? cofBorderColor
                        : borderColor,
                  boxShadow: isEditing
                    ? `0 0 0 2px ${appColors.surface.chordPadEditGlow}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                    : isActive
                      ? `0 3px 0 ${appColors.surface.chordPadShadowPressed}`
                      : isCoFHighlighted
                        ? `0 0 0 3px ${cofGlowColor}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
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
                        : isCoFHighlighted
                          ? `0 0 0 4px ${cofGlowColor}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                          : `0 8px 0 ${appColors.surface.chordPadShadowRest}`,
                    borderColor: isEditing
                      ? editingBorderColor
                      : isActive
                        ? padStyles.active.border
                        : isCoFHighlighted
                          ? cofBorderColor
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
                {showKeyboardHints && hotkeyLabel ? (
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      top: 6,
                      minWidth: 20,
                      height: 20,
                      px: 0.5,
                      borderRadius: 0.75,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: { xs: '0.64rem', sm: '0.68rem' },
                      fontWeight: 700,
                      lineHeight: 1,
                      color: theme.palette.common.white,
                      bgcolor: alpha(theme.palette.common.black, 0.36),
                      border: `1px solid ${alpha(theme.palette.common.white, 0.32)}`,
                      boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.3)}`,
                    }}
                    style={{ left: 6 }}
                  >
                    {hotkeyLabel}
                  </Box>
                ) : null}
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

        {showKeyboardHints ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t('ui.chordGrid.keyboardHelp')}
          </Typography>
        ) : null}

        {editableChords.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('ui.chordGrid.noPianoVoicings')}
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
            {t('ui.buttons.edit')}
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
            {t('ui.buttons.saveArrangement')}
          </Button>
        </Box>
      </DialogActions>

      <SaveArrangementDialog
        open={saveArrangementDialogOpen}
        onClose={() => setSaveArrangementDialogOpen(false)}
        onSuccess={onSaveSuccess}
        timeline={timeline}
        playbackSnapshot={playbackSnapshot}
        sourceChords={editableChords}
      />
    </Dialog>
  );
}
