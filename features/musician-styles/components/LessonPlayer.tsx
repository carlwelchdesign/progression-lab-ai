'use client';

import { useEffect, useMemo, useState } from 'react';

import { trackEvent } from '../../../lib/analytics';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { normalizeMidiNoteName, WebMidiService } from '../services/midiService';
import type { GeneratedLesson } from '../types';
import { LessonStepExercise } from './LessonStepExercise';
import { LessonStepText } from './LessonStepText';
import {
  shouldIgnoreDuplicateMidiMatch,
  transitionFlowState,
  type LessonFlowState,
} from './LessonFlowController';

type LessonPlayerProps = {
  lesson: GeneratedLesson | null;
  onStartNextLesson: () => void;
};

type MidiConnectionState = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'denied';

export function LessonPlayer({ lesson, onStartNextLesson }: LessonPlayerProps) {
  const { saveStep } = useLessonProgress();
  const [midiService] = useState(() => new WebMidiService());
  const [stepIndex, setStepIndex] = useState(0);
  const [flowState, setFlowState] = useState<LessonFlowState>('idle');
  const [lastMidiMatchAt, setLastMidiMatchAt] = useState<number | null>(null);
  const [manualClicks, setManualClicks] = useState(0);
  const [autoAdvanceCount, setAutoAdvanceCount] = useState(0);
  const [backtrackCount, setBacktrackCount] = useState(0);
  const [midiStatus, setMidiStatus] = useState<MidiConnectionState>('idle');
  const [playedNotes, setPlayedNotes] = useState<string[]>([]);

  const currentStep = useMemo(() => {
    if (!lesson) {
      return null;
    }

    return lesson.steps[stepIndex] ?? null;
  }, [lesson, stepIndex]);

  useEffect(() => {
    setStepIndex(0);
    setFlowState('idle');
    setLastMidiMatchAt(null);
    setPlayedNotes([]);
  }, [lesson?.id]);

  useEffect(() => {
    if (!midiService.isSupported()) {
      setMidiStatus('unsupported');
      return;
    }

    setMidiStatus('idle');
  }, [midiService]);

  useEffect(() => {
    if (midiStatus !== 'connected') {
      return;
    }

    const subscription = midiService.subscribeToNotes((event) => {
      const normalizedNote = normalizeMidiNoteName(event.note);
      setPlayedNotes((current) => [
        ...current.filter((note) => note !== normalizedNote),
        normalizedNote,
      ]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [midiService, midiStatus]);

  useEffect(() => {
    setPlayedNotes([]);
  }, [stepIndex, lesson?.id]);

  useEffect(() => {
    if (!currentStep || currentStep.type !== 'exercise') {
      return;
    }

    if (midiStatus !== 'connected') {
      return;
    }

    if (
      flowState === 'autoAdvancing' ||
      flowState === 'stepCompleted' ||
      flowState === 'lessonCompleted'
    ) {
      return;
    }

    const required = new Set(
      currentStep.exercise.targetNotes.map((note) => normalizeMidiNoteName(note)),
    );
    const detected = new Set(playedNotes.map((note) => normalizeMidiNoteName(note)));
    const allMatched = Array.from(required).every((note) => detected.has(note));

    if (!allMatched) {
      return;
    }

    const now = Date.now();
    if (shouldIgnoreDuplicateMidiMatch(lastMidiMatchAt, now)) {
      return;
    }

    setLastMidiMatchAt(now);
    setFlowState(transitionFlowState(flowState, 'COMPLETE_STEP'));

    window.setTimeout(() => {
      void goNext(true);
    }, 850);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, playedNotes, midiStatus, flowState, lastMidiMatchAt]);

  useEffect(() => {
    if (flowState !== 'lessonCompleted' || !lesson) {
      return;
    }

    trackEvent('lesson_flow', {
      lessonId: lesson.id,
      manualClicks,
      autoAdvanceCount,
      backtrackCount,
    });
  }, [flowState, lesson, manualClicks, autoAdvanceCount, backtrackCount]);

  if (!lesson || !currentStep) {
    return <section className="rounded border p-4">Select a lesson to begin.</section>;
  }

  const goNext = async (autoAdvance: boolean) => {
    const isLastStep = stepIndex >= lesson.steps.length - 1;
    const completed = isLastStep;

    const result = await saveStep({
      lessonId: lesson.id,
      completed,
      stepIndex,
      attempts: 1,
      autoAdvance,
    });

    if (completed) {
      setFlowState(transitionFlowState(flowState, 'COMPLETE_LESSON'));
      return;
    }

    if (autoAdvance) {
      setAutoAdvanceCount((current) => current + 1);
    }

    setFlowState(transitionFlowState(flowState, autoAdvance ? 'AUTO_ADVANCE' : 'COMPLETE_STEP'));
    setStepIndex(result.nextStepIndex ?? stepIndex + 1);
    setFlowState('idle');
  };

  const connectMidiKeyboard = async () => {
    if (midiStatus === 'unsupported' || midiStatus === 'connecting') {
      return;
    }

    setMidiStatus('connecting');

    try {
      const connected = await midiService.requestAccess();
      setMidiStatus(connected ? 'connected' : 'denied');
    } catch {
      setMidiStatus('denied');
    }
  };

  return (
    <section className="space-y-4 rounded border p-4">
      <header>
        <h2 className="text-lg font-semibold">{lesson.title}</h2>
        <p className="text-sm text-gray-600">
          Step {stepIndex + 1} of {lesson.steps.length}
        </p>
      </header>

      {currentStep.type === 'text' ? (
        <LessonStepText step={currentStep} />
      ) : (
        <div className="space-y-3">
          <LessonStepExercise
            step={currentStep}
            isMatched={flowState === 'stepCompleted' || flowState === 'autoAdvancing'}
            playedNotes={playedNotes}
            midiStatus={midiStatus}
          />
          {midiStatus !== 'connected' ? (
            <button
              type="button"
              aria-label="Connect MIDI keyboard"
              onClick={() => void connectMidiKeyboard()}
              className="rounded border px-3 py-2"
              disabled={midiStatus === 'unsupported' || midiStatus === 'connecting'}
            >
              {midiStatus === 'unsupported'
                ? 'Web MIDI Unsupported'
                : midiStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Connect MIDI Keyboard'}
            </button>
          ) : null}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Go to previous step"
          onClick={() => {
            setBacktrackCount((current) => current + 1);
            setStepIndex((current) => Math.max(0, current - 1));
          }}
          disabled={stepIndex === 0}
          className="rounded border px-3 py-2 disabled:opacity-50"
        >
          Back
        </button>
        {currentStep.type === 'text' ? (
          <button
            type="button"
            aria-label="Continue to next step"
            onClick={() => {
              setManualClicks((current) => current + 1);
              void goNext(false);
            }}
            className="rounded border px-3 py-2"
          >
            Continue
          </button>
        ) : null}
      </div>

      {flowState === 'lessonCompleted' ? (
        <div className="rounded border border-green-300 bg-green-50 p-3">
          <p className="mb-2">Lesson complete. Start Next Lesson to keep momentum.</p>
          <button
            type="button"
            aria-label="Start next lesson"
            onClick={onStartNextLesson}
            className="rounded border px-3 py-2"
          >
            Start Next Lesson
          </button>
        </div>
      ) : null}
    </section>
  );
}
