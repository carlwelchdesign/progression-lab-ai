'use client';

import { useEffect, useState } from 'react';
import type { MidiConnectionStatus } from '../types';

export type UseMidiInputResult = {
  status: MidiConnectionStatus;
  inputs: MIDIInputMap | null;
};

/**
 * Requests Web MIDI API access and returns the connection status and input map.
 * Gracefully handles browsers without MIDI support.
 */
export function useMidiInput(): UseMidiInputResult {
  const [status, setStatus] = useState<MidiConnectionStatus>('connecting');
  const [inputs, setInputs] = useState<MIDIInputMap | null>(null);

  useEffect(() => {
    if (typeof navigator.requestMIDIAccess !== 'function') {
      setStatus('unavailable');
      return;
    }

    let midiAccess: MIDIAccess | null = null;

    function handleStateChange() {
      if (!midiAccess) return;
      const hasInputs = midiAccess.inputs.size > 0;
      setStatus(hasInputs ? 'connected' : 'connecting');
      setInputs(midiAccess.inputs);
    }

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        midiAccess = access;
        access.onstatechange = handleStateChange;
        handleStateChange();
      })
      .catch(() => {
        setStatus('denied');
      });

    return () => {
      if (midiAccess) {
        midiAccess.onstatechange = null;
      }
    };
  }, []);

  return { status, inputs };
}
