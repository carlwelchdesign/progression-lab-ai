'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Note conversion ───────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export function midiNoteToName(noteNumber: number, transposeSemitones = 0): string {
  // Standard MIDI: note 60 = C4 (middle C)
  const shifted = noteNumber + transposeSemitones;
  const octave = Math.floor(shifted / 12) - 1;
  const name = NOTE_NAMES[((shifted % 12) + 12) % 12];
  return `${name}${octave}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MidiStatus = 'unsupported' | 'pending' | 'connected' | 'no-device';

export type UseMidiInputResult = {
  /** Notes currently held down, in piano-chart format e.g. "C4", "F#3" */
  pressedNotes: Set<string>;
  /** Last individual note received (note-on), for diagnostics */
  lastNote: string | null;
  status: MidiStatus;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

type Options = {
  /**
   * Shift every incoming MIDI note by N semitones.
   * Use +2 if pressing C shows A# (keyboard is transposed −2 semitones).
   * Use −2 if pressing C shows D.
   */
  transposeSemitones?: number;
};

export function useMidiInput({ transposeSemitones = 0 }: Options = {}): UseMidiInputResult {
  const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set());
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [status, setStatus] = useState<MidiStatus>('pending');

  // Keep stable ref to the MIDI access object for cleanup
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const transposeRef = useRef(transposeSemitones);
  transposeRef.current = transposeSemitones;

  const handleMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const type = data[0] & 0xf0;
    const noteNumber = data[1];
    const velocity = data[2];

    const isNoteOn = type === 0x90 && velocity > 0;
    const isNoteOff = type === 0x80 || (type === 0x90 && velocity === 0);

    if (!isNoteOn && !isNoteOff) return;

    const noteName = midiNoteToName(noteNumber, transposeRef.current);

    if (isNoteOn) {
      setLastNote(noteName);
    }

    setPressedNotes((prev) => {
      const next = new Set(prev);
      if (isNoteOn) {
        next.add(noteName);
      } else {
        next.delete(noteName);
      }
      return next;
    });
  }, []);

  const attachInputs = useCallback(
    (access: MIDIAccess) => {
      // Detach all existing onmidimessage handlers
      access.inputs.forEach((input) => {
        input.onmidimessage = null;
      });

      if (access.inputs.size === 0) {
        setStatus('no-device');
        return;
      }

      setStatus('connected');

      access.inputs.forEach((input) => {
        input.onmidimessage = handleMessage;
      });
    },
    [handleMessage],
  );

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;

    void navigator.requestMIDIAccess({ sysex: false }).then(
      (access) => {
        if (cancelled) return;
        midiAccessRef.current = access;
        attachInputs(access);

        access.onstatechange = () => {
          if (cancelled) return;
          setPressedNotes(new Set());
          attachInputs(access);
        };
      },
      () => {
        if (!cancelled) setStatus('unsupported');
      },
    );

    return () => {
      cancelled = true;
      const access = midiAccessRef.current;
      if (access) {
        access.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
        access.onstatechange = null;
      }
      midiAccessRef.current = null;
    };
  }, [attachInputs]);

  return { pressedNotes, lastNote, status };
}
