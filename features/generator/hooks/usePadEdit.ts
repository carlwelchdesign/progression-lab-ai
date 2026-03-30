import { useEffect, useMemo, useState } from 'react';

import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import {
  getChordRootSemitone,
  getCircleOfFifthsSuggestedSemitones,
} from '../../../domain/music/circleOfFifths';
import type { CircleOfFifthsSuggestionMode } from '../../../domain/music/circleOfFifths';
import { CHORD_OPTIONS } from '../../../lib/formOptions';
import { PAD_TRIGGER_KEYS } from '../components/chordGridTypes';
import type { ChordGridEntry } from '../components/chordGridTypes';

type UsePadEditProps = {
  chords: ChordGridEntry[];
  open: boolean;
};

export type UsePadEditReturn = {
  editableChords: ChordGridEntry[];
  isEditMode: boolean;
  editingPadKey: string | null;
  setEditingPadKey: React.Dispatch<React.SetStateAction<string | null>>;
  cofFocusPadKey: string | null;
  setCofFocusPadKey: React.Dispatch<React.SetStateAction<string | null>>;
  cofSuggestionMode: CircleOfFifthsSuggestionMode;
  setCofSuggestionMode: React.Dispatch<React.SetStateAction<CircleOfFifthsSuggestionMode>>;
  isSuggestionAccordionExpanded: boolean;
  setIsSuggestionAccordionExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  cofHighlightedKeys: Set<string>;
  editableChordOptions: Array<{ value: string; label: string }>;
  padHotkeyBindings: Array<{ entry: ChordGridEntry; hotkey: string | null }>;
  padHotkeyMap: Map<string, ChordGridEntry>;
  onPadChordChange: (padKey: string, chord: string) => void;
  handleStartEditing: () => void;
  handleSaveEditing: () => void;
  resetCofFocus: () => void;
};

/**
 * Manages pad chord editing, edit mode state, and Circle of Fifths suggestion
 * highlighting. SRP: changes when the editing UX or CoF suggestion feature changes.
 */
export function usePadEdit({ chords, open }: UsePadEditProps): UsePadEditReturn {
  const [editableChords, setEditableChords] = useState<ChordGridEntry[]>(chords);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPadKey, setEditingPadKey] = useState<string | null>(null);
  const [cofFocusPadKey, setCofFocusPadKey] = useState<string | null>(null);
  const [cofSuggestionMode, setCofSuggestionMode] =
    useState<CircleOfFifthsSuggestionMode>('neighbors');
  const [isSuggestionAccordionExpanded, setIsSuggestionAccordionExpanded] = useState(false);

  // Sync editable chords when the input prop changes, and reset edit state on dialog open/close.
  useEffect(() => {
    setEditableChords(chords);
    setEditingPadKey(null);
  }, [chords, open]);

  // Clear CoF focus when dialog closes.
  useEffect(() => {
    if (!open) {
      setCofFocusPadKey(null);
    }
  }, [open]);

  const cofHighlightedKeys = useMemo<Set<string>>(() => {
    if (!cofFocusPadKey || cofSuggestionMode === 'none') {
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

    const suggestedSemitones = getCircleOfFifthsSuggestedSemitones(rootSemitone, cofSuggestionMode);
    const highlighted = new Set<string>();
    for (const entry of editableChords) {
      if (entry.key === cofFocusPadKey) {
        continue;
      }

      const entrySemitone = getChordRootSemitone(entry.chord);
      if (entrySemitone !== null && suggestedSemitones.has(entrySemitone)) {
        highlighted.add(entry.key);
      }
    }

    return highlighted;
  }, [cofFocusPadKey, cofSuggestionMode, editableChords]);

  const editableChordOptions = useMemo(() => {
    const values = Array.from(
      new Set([...CHORD_OPTIONS, ...editableChords.map((entry) => entry.chord)]),
    );
    return values.map((value) => ({ value, label: value }));
  }, [editableChords]);

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

  const handleStartEditing = () => {
    setIsEditMode(true);
  };

  const handleSaveEditing = () => {
    setIsEditMode(false);
    setEditingPadKey(null);
  };

  const resetCofFocus = () => {
    setCofFocusPadKey(null);
  };

  return {
    editableChords,
    isEditMode,
    editingPadKey,
    setEditingPadKey,
    cofFocusPadKey,
    setCofFocusPadKey,
    cofSuggestionMode,
    setCofSuggestionMode,
    isSuggestionAccordionExpanded,
    setIsSuggestionAccordionExpanded,
    cofHighlightedKeys,
    editableChordOptions,
    padHotkeyBindings,
    padHotkeyMap,
    onPadChordChange,
    handleStartEditing,
    handleSaveEditing,
    resetCofFocus,
  };
}
