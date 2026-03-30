import { useEffect, useRef, useState } from 'react';

import { playMetronomePulse, startAudio, stopAllAudio } from '../../../domain/audio/audio';
import type { TimeSignature } from '../../../domain/audio/audio';
import type { ArrangementEvent } from '../../../lib/types';
import { stopGlobalPlayback } from './usePlaybackToggle';
import { STEPS_PER_BEAT, RECORDING_LEAD_IN_BARS } from '../components/chordGridTypes';
import { getSchedulerNowMs } from '../components/chordGridUtils';
import type { RecordingMode } from '../components/chordGridTypes';

export type PlayEntryOptions = {
  stopBefore?: boolean;
  loop?: boolean;
  useCurrentPadPattern?: boolean;
  velocity?: number;
};

export type PlayEntryArg = {
  key: string;
  leftHand: string[];
  rightHand: string[];
};

type UseSequencerEngineProps = {
  open: boolean;
  tempoBpm: number;
  beatsPerBar: number;
  stepsPerBar: number;
  totalSteps: number;
  isLoopEnabled: boolean;
  recordingMode: RecordingMode;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  metronomeSource: 'click' | 'drum';
  metronomeDrumPath: string | null;
  timeSignature: TimeSignature;
  padVelocity: number;
  eventsByStepRef: React.MutableRefObject<Map<number, ArrangementEvent[]>>;
  onPlayEntry: (entry: PlayEntryArg, options?: PlayEntryOptions) => void;
  /** Called synchronously at the start of count-in (before the first click fires). */
  onCountInBegin?: () => void;
};

export type UseSequencerEngineReturn = {
  isSequencerPlaying: boolean;
  isRecording: boolean;
  isCountInActive: boolean;
  currentStep: number;
  currentStepRef: React.MutableRefObject<number>;
  hasInitializedAudio: boolean;
  setHasInitializedAudio: React.Dispatch<React.SetStateAction<boolean>>;
  isBeatPulseVisible: boolean;
  isDownbeatPulse: boolean;
  currentBeatInBar: number;
  stopSequencer: () => void;
  startSequencer: () => void;
  handleSequencerPlayToggle: () => void;
  handleRecordToggle: () => void;
  resetStep: () => void;
  resetEngineState: () => void;
};

/**
 * Encapsulates the real-time sequencer scheduling engine, count-in logic,
 * and all associated timer refs. SRP: changes when the timing algorithm changes.
 */
export function useSequencerEngine({
  open,
  tempoBpm,
  beatsPerBar,
  stepsPerBar,
  totalSteps,
  isLoopEnabled,
  recordingMode,
  metronomeEnabled,
  metronomeVolume,
  metronomeSource,
  metronomeDrumPath,
  timeSignature,
  padVelocity,
  eventsByStepRef,
  onPlayEntry,
  onCountInBegin,
}: UseSequencerEngineProps): UseSequencerEngineReturn {
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCountInActive, setIsCountInActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInitializedAudio, setHasInitializedAudio] = useState(false);
  const [isBeatPulseVisible, setIsBeatPulseVisible] = useState(false);
  const [isDownbeatPulse, setIsDownbeatPulse] = useState(false);
  const [currentBeatInBar, setCurrentBeatInBar] = useState(1);

  const currentStepRef = useRef(0);
  const sequencerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countInStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beatPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so timer callbacks always see the latest values.
  const totalStepsRef = useRef(totalSteps);
  const isLoopEnabledRef = useRef(isLoopEnabled);
  const metronomeEnabledRef = useRef(metronomeEnabled);
  const metronomeSourceRef = useRef(metronomeSource);
  const metronomeDrumPathRef = useRef(metronomeDrumPath);
  const beatsPerBarRef = useRef(beatsPerBar);
  const padVelocityRef = useRef(padVelocity);
  const onPlayEntryRef = useRef(onPlayEntry);
  const tempoBpmRef = useRef(tempoBpm);
  const timeSignatureRef = useRef(timeSignature);
  const metronomeVolumeRef = useRef(metronomeVolume);
  const stepsPerBarRef = useRef(stepsPerBar);

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
    metronomeSourceRef.current = metronomeSource;
  }, [metronomeSource]);
  useEffect(() => {
    metronomeDrumPathRef.current = metronomeDrumPath;
  }, [metronomeDrumPath]);
  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
  }, [beatsPerBar]);
  useEffect(() => {
    padVelocityRef.current = padVelocity;
  }, [padVelocity]);
  useEffect(() => {
    onPlayEntryRef.current = onPlayEntry;
  }, [onPlayEntry]);
  useEffect(() => {
    tempoBpmRef.current = tempoBpm;
  }, [tempoBpm]);
  useEffect(() => {
    timeSignatureRef.current = timeSignature;
  }, [timeSignature]);
  useEffect(() => {
    metronomeVolumeRef.current = metronomeVolume;
  }, [metronomeVolume]);
  useEffect(() => {
    stepsPerBarRef.current = stepsPerBar;
  }, [stepsPerBar]);

  // Cleanup all timers on unmount.
  useEffect(() => {
    return () => {
      if (sequencerTimerRef.current) clearTimeout(sequencerTimerRef.current);
      if (countInTimerRef.current) clearTimeout(countInTimerRef.current);
      if (countInStartTimeoutRef.current) clearTimeout(countInStartTimeoutRef.current);
      if (beatPulseTimeoutRef.current) clearTimeout(beatPulseTimeoutRef.current);
    };
  }, []);

  // Reset engine state when dialog closes; reset audio flag when it opens.
  useEffect(() => {
    if (open) {
      setHasInitializedAudio(false);
      return;
    }

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
    setHasInitializedAudio(false);
  }, [open]);

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

  const resetStep = () => {
    setCurrentStep(0);
    currentStepRef.current = 0;
  };

  const resetEngineState = () => {
    stopSequencer();
  };

  const startSequencer = () => {
    if (sequencerTimerRef.current) {
      clearTimeout(sequencerTimerRef.current);
      sequencerTimerRef.current = null;
    }

    stopGlobalPlayback();
    stopAllAudio();
    void startAudio();

    const stepDurationMs = 60_000 / tempoBpmRef.current / STEPS_PER_BEAT;
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
        const absoluteBeatIndex = Math.floor(stepIndex / STEPS_PER_BEAT);
        const beatInBar = absoluteBeatIndex % beatsPerBarRef.current;
        const isDownbeat = beatInBar === 0;

        pulseBeatIndicator(beatInBar + 1, isDownbeat);
        void playMetronomePulse(metronomeVolumeRef.current, isDownbeat, {
          source: metronomeSourceRef.current,
          drumPath: metronomeDrumPathRef.current,
          timeSignature: timeSignatureRef.current,
          tempoBpm: tempoBpmRef.current,
          beatIndex: absoluteBeatIndex,
        });
      }

      const events = eventsByStepRef.current.get(stepIndex) ?? [];
      events.forEach((event) => {
        onPlayEntryRef.current(
          { key: event.padKey, leftHand: event.leftHand, rightHand: event.rightHand },
          {
            stopBefore: false,
            loop: false,
            useCurrentPadPattern: false,
            velocity: event.velocity ?? padVelocityRef.current,
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
    if (recordingMode === 'single-shot') {
      return;
    }

    if (!hasInitializedAudio) {
      return;
    }

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
    onCountInBegin?.();

    void startAudio().then(() => {
      let stepIndex = 0;
      const stepDurationMs = 60_000 / tempoBpmRef.current / STEPS_PER_BEAT;
      const totalPreRollBeats = beatsPerBarRef.current;
      const totalPreRollSteps = totalPreRollBeats * STEPS_PER_BEAT;
      const leadInSteps = RECORDING_LEAD_IN_BARS * stepsPerBarRef.current;
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
        const beatNumber = (beatIndex % beatsPerBarRef.current) + 1;
        const isDownbeat = beatNumber === 1;
        const isAudibleCountInBeat = beatIndex < beatsPerBarRef.current;

        if (stepIndex % STEPS_PER_BEAT === 0) {
          pulseBeatIndicator(beatNumber, isDownbeat);
          if (isAudibleCountInBeat) {
            void playMetronomePulse(metronomeVolumeRef.current, isDownbeat, {
              source: metronomeSourceRef.current,
              drumPath: metronomeDrumPathRef.current,
              timeSignature: timeSignatureRef.current,
              tempoBpm: tempoBpmRef.current,
              beatIndex,
            });
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

  return {
    isSequencerPlaying,
    isRecording,
    isCountInActive,
    currentStep,
    currentStepRef,
    hasInitializedAudio,
    setHasInitializedAudio,
    isBeatPulseVisible,
    isDownbeatPulse,
    currentBeatInBar,
    stopSequencer,
    startSequencer,
    handleSequencerPlayToggle,
    handleRecordToggle,
    resetStep,
    resetEngineState,
  };
}
