import { useEffect, useRef, useState } from 'react';

import { isTypingTarget } from '../components/chordGridUtils';
import type { ChordGridEntry } from '../components/chordGridTypes';

type UseChordGridKeyboardProps = {
  open: boolean;
  saveArrangementDialogOpen: boolean;
  isDesktopKeyboardUi: boolean;
  selectedStepIndex: number | null;
  setSelectedStepIndex: (index: number | null) => void;
  padHotkeyMap: Map<string, ChordGridEntry>;
  onPlayToggle: () => void;
  onRecordToggle: () => void;
  onDeleteClip: () => void;
  onNudgeClip: (delta: number) => void;
  onPadPress: (entry: ChordGridEntry) => void;
};

export type UseChordGridKeyboardReturn = {
  hasDetectedHardwareKeyboardInput: boolean;
};

/**
 * Registers and manages the global keydown listener for chord-grid shortcuts.
 * Stores all action callbacks in refs internally so re-subscription is minimal.
 * SRP: changes when keyboard shortcut bindings change.
 */
export function useChordGridKeyboard({
  open,
  saveArrangementDialogOpen,
  isDesktopKeyboardUi,
  selectedStepIndex,
  setSelectedStepIndex,
  padHotkeyMap,
  onPlayToggle,
  onRecordToggle,
  onDeleteClip,
  onNudgeClip,
  onPadPress,
}: UseChordGridKeyboardProps): UseChordGridKeyboardReturn {
  const [hasDetectedHardwareKeyboardInput, setHasDetectedHardwareKeyboardInput] = useState(false);

  // Store callbacks in refs so the listener can always call the latest version
  // without needing to re-add the event listener on every render.
  const onPlayToggleRef = useRef(onPlayToggle);
  const onRecordToggleRef = useRef(onRecordToggle);
  const onDeleteClipRef = useRef(onDeleteClip);
  const onNudgeClipRef = useRef(onNudgeClip);
  const onPadPressRef = useRef(onPadPress);

  useEffect(() => {
    onPlayToggleRef.current = onPlayToggle;
  });
  useEffect(() => {
    onRecordToggleRef.current = onRecordToggle;
  });
  useEffect(() => {
    onDeleteClipRef.current = onDeleteClip;
  });
  useEffect(() => {
    onNudgeClipRef.current = onNudgeClip;
  });
  useEffect(() => {
    onPadPressRef.current = onPadPress;
  });

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
        onPlayToggleRef.current();
        return;
      }

      if (event.key === 'Shift') {
        event.preventDefault();
        onRecordToggleRef.current();
        return;
      }

      if ((key === 'delete' || key === 'backspace') && selectedStepIndex !== null) {
        event.preventDefault();
        onDeleteClipRef.current();
        return;
      }

      if (key === 'escape') {
        setSelectedStepIndex(null);
        return;
      }

      if ((key === 'arrowleft' || key === 'arrowright') && selectedStepIndex !== null) {
        event.preventDefault();
        onNudgeClipRef.current(key === 'arrowleft' ? -1 : 1);
        return;
      }

      const matchedEntry = padHotkeyMap.get(key);
      if (!matchedEntry) {
        return;
      }

      event.preventDefault();
      onPadPressRef.current(matchedEntry);
    };

    window.addEventListener('keydown', onWindowKeyDown);

    return () => {
      window.removeEventListener('keydown', onWindowKeyDown);
    };
  }, [
    hasDetectedHardwareKeyboardInput,
    isDesktopKeyboardUi,
    open,
    padHotkeyMap,
    saveArrangementDialogOpen,
    selectedStepIndex,
    setSelectedStepIndex,
  ]);

  return { hasDetectedHardwareKeyboardInput };
}
