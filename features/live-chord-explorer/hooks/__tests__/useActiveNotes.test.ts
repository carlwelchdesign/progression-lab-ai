import { renderHook, act } from '@testing-library/react';
import { useActiveNotes } from '../useActiveNotes';

type MidiHandler = (event: MIDIMessageEvent) => void;

function makeInput(): { input: MIDIInput; fire: MidiHandler } {
  let handler: MidiHandler | null = null;

  const input = {
    set onmidimessage(h: ((event: Event) => void) | null) {
      handler = h as MidiHandler | null;
    },
    get onmidimessage() {
      return handler as ((event: Event) => void) | null;
    },
  } as unknown as MIDIInput;

  function fire(event: MIDIMessageEvent) {
    if (handler) handler(event);
  }

  return { input, fire };
}

function makeMidiEvent(status: number, note: number, velocity: number): MIDIMessageEvent {
  return { data: new Uint8Array([status, note, velocity]) } as unknown as MIDIMessageEvent;
}

function makeInputMap(...inputs: MIDIInput[]): MIDIInputMap {
  const map = new Map<string, MIDIInput>();
  inputs.forEach((input, i) => map.set(`input-${i}`, input));
  return map as unknown as MIDIInputMap;
}

describe('useActiveNotes', () => {
  it('starts with no active notes', () => {
    const { result } = renderHook(() => useActiveNotes(null));
    expect(result.current.activeNotes).toHaveLength(0);
    expect(result.current.lowestMidiNote).toBeNull();
  });

  it('adds a note on note-on event', () => {
    const { input, fire } = makeInput();
    const inputs = makeInputMap(input);
    const { result } = renderHook(() => useActiveNotes(inputs));

    act(() => {
      fire(makeMidiEvent(0x90, 60, 100)); // C4, velocity 100
    });

    expect(result.current.activeNotes).toHaveLength(1);
    expect(result.current.activeNotes[0].midiNumber).toBe(60);
    expect(result.current.activeNotes[0].noteNameWithOctave).toBe('C4');
    expect(result.current.activeNotes[0].pitchClass).toBe(0);
  });

  it('removes a note on note-off event (status 0x80)', () => {
    const { input, fire } = makeInput();
    const inputs = makeInputMap(input);
    const { result } = renderHook(() => useActiveNotes(inputs));

    act(() => {
      fire(makeMidiEvent(0x90, 60, 100));
    });
    act(() => {
      fire(makeMidiEvent(0x80, 60, 0)); // note-off
    });

    expect(result.current.activeNotes).toHaveLength(0);
  });

  it('treats velocity-0 note-on as note-off', () => {
    const { input, fire } = makeInput();
    const inputs = makeInputMap(input);
    const { result } = renderHook(() => useActiveNotes(inputs));

    act(() => {
      fire(makeMidiEvent(0x90, 60, 100));
    });
    act(() => {
      fire(makeMidiEvent(0x90, 60, 0)); // velocity 0 = note-off
    });

    expect(result.current.activeNotes).toHaveLength(0);
  });

  it('tracks multiple simultaneous notes', () => {
    const { input, fire } = makeInput();
    const inputs = makeInputMap(input);
    const { result } = renderHook(() => useActiveNotes(inputs));

    act(() => {
      fire(makeMidiEvent(0x90, 60, 100)); // C4
      fire(makeMidiEvent(0x90, 64, 90)); // E4
      fire(makeMidiEvent(0x90, 67, 80)); // G4
    });

    expect(result.current.activeNotes).toHaveLength(3);
    expect(result.current.pitchClasses).toEqual(expect.arrayContaining([0, 4, 7]));
  });

  it('returns the lowest midi note', () => {
    const { input, fire } = makeInput();
    const inputs = makeInputMap(input);
    const { result } = renderHook(() => useActiveNotes(inputs));

    act(() => {
      fire(makeMidiEvent(0x90, 60, 100));
      fire(makeMidiEvent(0x90, 67, 90));
    });

    expect(result.current.lowestMidiNote).toBe(60);
  });

  it('handles duplicate note-on without duplicating', () => {
    const { input, fire } = makeInput();
    const inputs = makeInputMap(input);
    const { result } = renderHook(() => useActiveNotes(inputs));

    act(() => {
      fire(makeMidiEvent(0x90, 60, 100));
      fire(makeMidiEvent(0x90, 60, 110)); // same note again
    });

    expect(result.current.activeNotes).toHaveLength(1);
  });
});
