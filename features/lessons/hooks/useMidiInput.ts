'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Note conversion ───────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function midiNoteToName(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1; // MIDI 60 = C4
  const name = NOTE_NAMES[noteNumber % 12];
  return `${name}${octave}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MidiStatus = 'unsupported' | 'pending' | 'connected' | 'no-device';

export type UseMidiInputResult = {
  /** Notes currently held down, in piano-chart format e.g. "C4", "F#3" */
  pressedNotes: Set<string>;
  status: MidiStatus;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMidiInput(): UseMidiInputResult {
  const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<MidiStatus>('pending');

  // Keep stable ref to the MIDI access object so we can clean up listeners
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  // Map from input id → handler function, so we can remove them precisely
  const handlersRef = useRef<Map<string, (e: MIDIMessageEvent) => void>>(new Map());

  const handleMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const type = data[0] & 0xf0;
    const noteNumber = data[1];
    const velocity = data[2];

    const isNoteOn = type === 0x90 && velocity > 0;
    const isNoteOff = type === 0x80 || (type === 0x90 && velocity === 0);

    if (!isNoteOn && !isNoteOff) return;

    const noteName = midiNoteToName(noteNumber);

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
      // Remove old handlers first
      handlersRef.current.forEach((handler, id) => {
        const input = access.inputs.get(id);
        if (input) input.removeEventListener('midimessage', handler as EventListener);
      });
      handlersRef.current.clear();

      if (access.inputs.size === 0) {
        setStatus('no-device');
        return;
      }

      setStatus('connected');

      access.inputs.forEach((input) => {
        const handler = (e: MIDIMessageEvent) => handleMessage(e);
        handlersRef.current.set(input.id, handler);
        input.addEventListener('midimessage', handler as EventListener);
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
          // Clear any notes that were held when a device disconnected
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
        handlersRef.current.forEach((handler, id) => {
          const input = access.inputs.get(id);
          if (input) input.removeEventListener('midimessage', handler as EventListener);
        });
        access.onstatechange = null;
      }

      handlersRef.current.clear();
      midiAccessRef.current = null;
    };
  }, [attachInputs]);

  return { pressedNotes, status };
}
