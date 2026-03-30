import { useEffect, useMemo, useRef, useState } from 'react';

import type { ArrangementEvent, ArrangementTimeline } from '../../../lib/types';
import { generateId } from '../components/chordGridUtils';
import type { ChordGridEntry } from '../components/chordGridTypes';

type UseArrangementTimelineProps = {
  totalSteps: number;
  stepsPerBar: number;
  loopLengthBars: number;
  padVelocity: number;
};

export type UseArrangementTimelineReturn = {
  arrangementEvents: ArrangementEvent[];
  setArrangementEvents: React.Dispatch<React.SetStateAction<ArrangementEvent[]>>;
  selectedStepIndex: number | null;
  setSelectedStepIndex: React.Dispatch<React.SetStateAction<number | null>>;
  eventsByStep: Map<number, ArrangementEvent[]>;
  eventsByStepRef: React.MutableRefObject<Map<number, ArrangementEvent[]>>;
  timeline: ArrangementTimeline;
  insertArrangementEvent: (
    entry: ChordGridEntry,
    stepIndex: number,
    options?: { durationSteps?: number },
  ) => void;
  clearArrangementEvents: () => void;
  deleteSelectedClip: () => void;
  moveClipStep: (sourceStepIndex: number, newStepIndex: number) => void;
  nudgeSelectedClip: (delta: number) => void;
};

/**
 * Manages arrangement events state, the events-by-step lookup map, and
 * all timeline mutation operations. SRP: changes when the timeline data model changes.
 */
export function useArrangementTimeline({
  totalSteps,
  stepsPerBar,
  loopLengthBars,
  padVelocity,
}: UseArrangementTimelineProps): UseArrangementTimelineReturn {
  const [arrangementEvents, setArrangementEvents] = useState<ArrangementEvent[]>([]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  const totalStepsRef = useRef(totalSteps);
  const padVelocityRef = useRef(padVelocity);

  useEffect(() => {
    totalStepsRef.current = totalSteps;
  }, [totalSteps]);
  useEffect(() => {
    padVelocityRef.current = padVelocity;
  }, [padVelocity]);

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

  const eventsByStepRef = useRef<Map<number, ArrangementEvent[]>>(new Map());
  useEffect(() => {
    eventsByStepRef.current = eventsByStep;
  }, [eventsByStep]);

  const timeline = useMemo<ArrangementTimeline>(
    () => ({
      stepsPerBar,
      loopLengthBars,
      totalSteps,
      events: arrangementEvents,
    }),
    [arrangementEvents, loopLengthBars, stepsPerBar, totalSteps],
  );

  const insertArrangementEvent = (
    entry: ChordGridEntry,
    stepIndex: number,
    options?: { durationSteps?: number },
  ) => {
    const boundedStepIndex = Math.max(0, Math.min(totalStepsRef.current - 1, stepIndex));
    const event: ArrangementEvent = {
      id: generateId(),
      padKey: entry.key,
      chord: entry.chord,
      source: entry.source,
      leftHand: entry.leftHand,
      rightHand: entry.rightHand,
      stepIndex: boundedStepIndex,
      velocity: padVelocityRef.current,
      durationSteps: options?.durationSteps,
    };

    setArrangementEvents((previous) => {
      const filtered = previous.filter((candidate) => candidate.stepIndex !== event.stepIndex);
      return [...filtered, event].sort((a, b) => a.stepIndex - b.stepIndex);
    });
    setSelectedStepIndex(boundedStepIndex);
  };

  const clearArrangementEvents = () => {
    setArrangementEvents([]);
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

    const next = Math.max(0, Math.min(totalStepsRef.current - 1, selectedStepIndex + delta));
    if (next === selectedStepIndex) {
      return;
    }

    moveClipStep(selectedStepIndex, next);
  };

  return {
    arrangementEvents,
    setArrangementEvents,
    selectedStepIndex,
    setSelectedStepIndex,
    eventsByStep,
    eventsByStepRef,
    timeline,
    insertArrangementEvent,
    clearArrangementEvents,
    deleteSelectedClip,
    moveClipStep,
    nudgeSelectedClip,
  };
}
