'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SHARP_NOTE_NAMES } from '../../../domain/music/musicNoteConstants';
import type { ActiveNote } from '../types';

function midiNumberToActiveNote(midiNumber: number): ActiveNote {
  const pitchClass = ((midiNumber % 12) + 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = SHARP_NOTE_NAMES[pitchClass];
  return {
    midiNumber,
    noteNameWithOctave: `${noteName}${octave}`,
    pitchClass,
  };
}

export type UseActiveNotesResult = {
  activeNotes: ActiveNote[];
  pitchClasses: number[];
  lowestMidiNote: number | null;
};

/**
 * Tracks active MIDI notes by subscribing to note-on / note-off events
 * across all connected MIDI inputs. Handles velocity-0 as note-off.
 */
export function useActiveNotes(inputs: MIDIInputMap | null): UseActiveNotesResult {
  // Keyed by MIDI note number → ActiveNote
  const activeMap = useRef(new Map<number, ActiveNote>());
  const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);

  const sync = useCallback(() => {
    setActiveNotes([...activeMap.current.values()]);
  }, []);

  useEffect(() => {
    if (!inputs) return;

    function handleMessage(event: MIDIMessageEvent) {
      const data = event.data;
      if (!data || data.length < 2) return;

      const status = data[0] & 0xf0; // strip channel nibble
      const noteNumber = data[1];
      const velocity = data[2] ?? 0;

      const isNoteOn = status === 0x90 && velocity > 0;
      const isNoteOff = status === 0x80 || (status === 0x90 && velocity === 0);

      if (isNoteOn) {
        activeMap.current.set(noteNumber, midiNumberToActiveNote(noteNumber));
        sync();
      } else if (isNoteOff) {
        activeMap.current.delete(noteNumber);
        sync();
      }
    }

    const ports: MIDIInput[] = [];
    inputs.forEach((input) => {
      input.onmidimessage = handleMessage as (event: Event) => void;
      ports.push(input);
    });

    return () => {
      for (const port of ports) {
        port.onmidimessage = null;
      }
    };
  }, [inputs, sync]);

  const notes = activeNotes;
  const pitchClasses = [...new Set(notes.map((n) => n.pitchClass))];
  const lowestMidiNote = notes.length > 0 ? Math.min(...notes.map((n) => n.midiNumber)) : null;

  return { activeNotes: notes, pitchClasses, lowestMidiNote };
}
