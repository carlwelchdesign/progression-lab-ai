'use client';

import { useEffect, useRef, useState } from 'react';

type UseTimelinePlaybackMotionParams = {
  currentStep: number;
  totalSteps: number;
  stepsPerBar: number;
  beatsPerBar: number;
  tempoBpm: number;
  isPlaying: boolean;
  leadInBars?: number;
  scrollToStep?: number;
  scrollRequestKey?: number;
  pixelsPerStep: number;
  playheadAnchorRatio?: number;
  minTrackWidthPx?: number;
};

type UseTimelinePlaybackMotionResult = {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  normalizedLeadInBars: number;
  leadInSteps: number;
  displayCurrentStep: number;
  displayTotalSteps: number;
  totalWidth: number;
  extendedTrackWidth: number;
  playheadAnchorPx: number;
  isCenteredOverlayActive: boolean;
};

export default function useTimelinePlaybackMotion({
  currentStep,
  totalSteps,
  stepsPerBar,
  beatsPerBar,
  tempoBpm,
  isPlaying,
  leadInBars = 0,
  scrollToStep,
  scrollRequestKey,
  pixelsPerStep,
  playheadAnchorRatio = 0.5,
  minTrackWidthPx = 360,
}: UseTimelinePlaybackMotionParams): UseTimelinePlaybackMotionResult {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const playheadRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const currentStepRef = useRef(currentStep);
  const stepTickStartedAtRef = useRef(performance.now());
  const previousStepRef = useRef(currentStep);
  const [viewportWidth, setViewportWidth] = useState(0);

  const normalizedLeadInBars = Math.max(0, leadInBars);
  const leadInSteps = normalizedLeadInBars * stepsPerBar;
  const displayCurrentStep = !isPlaying && currentStep === 0 ? 0 : currentStep + leadInSteps;
  const displayTotalSteps = totalSteps + leadInSteps;
  const stepsPerBeat = stepsPerBar / beatsPerBar;
  const stepDurationMs = Math.max(45, 60_000 / Math.max(tempoBpm, 1) / Math.max(stepsPerBeat, 1));
  const totalWidth = Math.max(displayTotalSteps * pixelsPerStep, minTrackWidthPx);
  const playheadAnchorPx = viewportWidth * playheadAnchorRatio;
  const extendedTrackWidth = totalWidth + playheadAnchorPx;
  const playheadCenterPx = displayCurrentStep * pixelsPerStep + pixelsPerStep / 2;
  const maxScrollLeft = Math.max(0, extendedTrackWidth - viewportWidth);
  const centeredDesiredScroll = playheadCenterPx - playheadAnchorPx;
  const isCenteredOverlayActive =
    viewportWidth > 0 && centeredDesiredScroll > 0 && centeredDesiredScroll < maxScrollLeft;

  const stepDelta = displayCurrentStep - previousStepRef.current;
  const isLoopWrapJump = stepDelta < 0;
  previousStepRef.current = displayCurrentStep;

  const setPlayheadTransform = (step: number) => {
    if (!playheadRef.current) {
      return;
    }

    playheadRef.current.style.transform = `translate3d(${step * pixelsPerStep}px, 0, 0)`;
  };

  useEffect(() => {
    currentStepRef.current = displayCurrentStep;
    stepTickStartedAtRef.current = performance.now();
  }, [displayCurrentStep]);

  useEffect(() => {
    if (isPlaying && !isLoopWrapJump) {
      return;
    }

    setPlayheadTransform(displayCurrentStep);
  }, [displayCurrentStep, isLoopWrapJump, isPlaying]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const updateViewportWidth = () => {
      setViewportWidth(container.clientWidth);
    };

    updateViewportWidth();

    const resizeObserver = new ResizeObserver(updateViewportWidth);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPlaying) {
      return;
    }

    const desiredScrollLeft = Math.max(0, Math.min(maxScrollLeft, centeredDesiredScroll));
    container.scrollLeft = desiredScrollLeft;
  }, [centeredDesiredScroll, isPlaying, maxScrollLeft]);

  useEffect(() => {
    if (!isLoopWrapJump) {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const desiredScrollLeft = Math.max(0, Math.min(maxScrollLeft, centeredDesiredScroll));
    container.scrollLeft = desiredScrollLeft;
  }, [centeredDesiredScroll, isLoopWrapJump, maxScrollLeft]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || scrollToStep === undefined) {
      return;
    }

    const step = Math.max(0, Math.min(displayTotalSteps, scrollToStep));
    const desiredScrollLeft = Math.max(
      0,
      Math.min(maxScrollLeft, step * pixelsPerStep - playheadAnchorPx),
    );
    container.scrollLeft = desiredScrollLeft;
  }, [
    displayTotalSteps,
    maxScrollLeft,
    pixelsPerStep,
    playheadAnchorPx,
    scrollRequestKey,
    scrollToStep,
  ]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPlaying) {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }

      return;
    }

    const animateScroll = () => {
      const container = scrollRef.current;
      if (!container) {
        scrollAnimationFrameRef.current = null;
        return;
      }

      const elapsedSinceTickMs = performance.now() - stepTickStartedAtRef.current;
      const stepProgress = Math.min(1, Math.max(0, elapsedSinceTickMs / stepDurationMs));
      const interpolatedStep = currentStepRef.current + stepProgress;
      setPlayheadTransform(interpolatedStep);

      const animatedPlayheadCenterPx = interpolatedStep * pixelsPerStep + pixelsPerStep / 2;
      const desiredScrollLeft = Math.max(
        0,
        Math.min(maxScrollLeft, animatedPlayheadCenterPx - playheadAnchorPx),
      );
      container.scrollLeft = desiredScrollLeft;

      if (isPlaying) {
        scrollAnimationFrameRef.current = requestAnimationFrame(animateScroll);
        return;
      }

      scrollAnimationFrameRef.current = null;
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
    };
  }, [isPlaying, maxScrollLeft, pixelsPerStep, playheadAnchorPx, stepDurationMs]);

  return {
    scrollRef,
    playheadRef,
    normalizedLeadInBars,
    leadInSteps,
    displayCurrentStep,
    displayTotalSteps,
    totalWidth,
    extendedTrackWidth,
    playheadAnchorPx,
    isCenteredOverlayActive,
  };
}
