import { useEffect, useRef, useState } from 'react';

import { TOUCH_LONG_PRESS_MS, TOUCH_MOVE_CANCEL_THRESHOLD_PX } from '../components/chordGridTypes';
import type { ChordGridEntry } from '../components/chordGridTypes';
import type { PlayEntryArg, PlayEntryOptions } from './useSequencerEngine';

type UsePadInteractionProps = {
  open: boolean;
  isSequencerPlaying: boolean;
  isRecording: boolean;
  padLatchMode: boolean;
  onPlayEntry: (entry: PlayEntryArg, options?: PlayEntryOptions) => void;
};

export type UsePadInteractionReturn = {
  activePadKey: string | null;
  mobileTimelineInsertPadKey: string | null;
  setMobileTimelineInsertPadKey: React.Dispatch<React.SetStateAction<string | null>>;
  triggerPad: (entry: ChordGridEntry) => void;
  /**
   * Arm long-press detection for a touch pad event.
   * `onShortPress` is called (with the entry) when the user releases without triggering
   * the long-press, matching the same behaviour as a direct pad tap.
   */
  armMobileTimelineInsert: (
    entry: ChordGridEntry,
    pointerDownEvent: React.PointerEvent<HTMLButtonElement>,
    onShortPress: (entry: ChordGridEntry) => void,
  ) => void;
  clearMobilePadLongPressTimer: () => void;
};

/**
 * Manages the visual feedback for active pads and mobile long-press gesture
 * detection for timeline insertion. SRP: changes when pad UX or gesture handling changes.
 */
export function usePadInteraction({
  open,
  isSequencerPlaying,
  isRecording,
  padLatchMode,
  onPlayEntry,
}: UsePadInteractionProps): UsePadInteractionReturn {
  const [activePadKey, setActivePadKey] = useState<string | null>(null);
  const [mobileTimelineInsertPadKey, setMobileTimelineInsertPadKey] = useState<string | null>(null);

  const activePadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobilePadLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobilePadLongPressTriggeredRef = useRef(false);

  const clearMobilePadLongPressTimer = () => {
    if (mobilePadLongPressTimerRef.current) {
      clearTimeout(mobilePadLongPressTimerRef.current);
      mobilePadLongPressTimerRef.current = null;
    }
  };

  // Cleanup timers on unmount.
  useEffect(() => {
    return () => {
      if (activePadTimeout.current) clearTimeout(activePadTimeout.current);
      clearMobilePadLongPressTimer();
    };
  }, []);

  // Cancel mobile state when dialog closes.
  useEffect(() => {
    if (!open) {
      setMobileTimelineInsertPadKey(null);
      clearMobilePadLongPressTimer();
    }
  }, [open]);

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
    onPlayEntry(entry, {
      stopBefore: !playInSequencerContext,
      loop: playInSequencerContext ? false : padLatchMode,
      useCurrentPadPattern: !playInSequencerContext,
    });
  };

  const armMobileTimelineInsert = (
    entry: ChordGridEntry,
    pointerDownEvent: React.PointerEvent<HTMLButtonElement>,
    onShortPress: (entry: ChordGridEntry) => void,
  ) => {
    const pointerId = pointerDownEvent.pointerId;
    const startX = pointerDownEvent.clientX;
    const startY = pointerDownEvent.clientY;
    mobilePadLongPressTriggeredRef.current = false;
    clearMobilePadLongPressTimer();

    const clearPointerListeners = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUpOrCancel);
      window.removeEventListener('pointercancel', handlePointerUpOrCancel);
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || mobilePadLongPressTriggeredRef.current) {
        return;
      }

      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (distance > TOUCH_MOVE_CANCEL_THRESHOLD_PX) {
        clearMobilePadLongPressTimer();
      }
    };

    const handlePointerUpOrCancel = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) {
        return;
      }

      const wasLongPress = mobilePadLongPressTriggeredRef.current;
      clearPointerListeners();
      clearMobilePadLongPressTimer();
      mobilePadLongPressTriggeredRef.current = false;

      if (!wasLongPress) {
        onShortPress(entry);
      }
    };

    mobilePadLongPressTimerRef.current = setTimeout(() => {
      mobilePadLongPressTimerRef.current = null;
      mobilePadLongPressTriggeredRef.current = true;
      setMobileTimelineInsertPadKey(entry.key);
    }, TOUCH_LONG_PRESS_MS);

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUpOrCancel, { passive: false });
    window.addEventListener('pointercancel', handlePointerUpOrCancel, { passive: false });
  };

  return {
    activePadKey,
    mobileTimelineInsertPadKey,
    setMobileTimelineInsertPadKey,
    triggerPad,
    armMobileTimelineInsert,
    clearMobilePadLongPressTimer,
  };
}
