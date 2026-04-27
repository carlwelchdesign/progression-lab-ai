import { renderHook, act } from '@testing-library/react';
import { useMidiInput } from '../useMidiInput';

function makeMockMidiAccess(inputCount = 1): MIDIAccess {
  const inputs = new Map();
  for (let i = 0; i < inputCount; i++) {
    inputs.set(`input-${i}`, { id: `input-${i}`, name: `Keyboard ${i}`, onmidimessage: null });
  }
  return {
    inputs: inputs as unknown as MIDIInputMap,
    outputs: new Map() as unknown as MIDIOutputMap,
    onstatechange: null,
    sysexEnabled: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  } as unknown as MIDIAccess;
}

// JSDOM does not implement Web MIDI — define it so we can mock it per-test.
function defineMidiAccess(impl: MIDIAccess['constructor'] | null) {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    writable: true,
    configurable: true,
    value: impl,
  });
}

describe('useMidiInput', () => {
  afterEach(() => {
    // Reset to undefined between tests
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    jest.restoreAllMocks();
  });

  it('returns "unavailable" when Web MIDI API is not present', async () => {
    defineMidiAccess(null);
    const { result } = renderHook(() => useMidiInput());
    await act(async () => {});
    expect(result.current.status).toBe('unavailable');
  });

  it('returns "denied" when MIDI access is rejected', async () => {
    defineMidiAccess(jest.fn().mockRejectedValue(new Error('Permission denied')));
    const { result } = renderHook(() => useMidiInput());
    await act(async () => {});
    expect(result.current.status).toBe('denied');
  });

  it('returns "connected" and inputs when MIDI access is granted with inputs', async () => {
    const mockAccess = makeMockMidiAccess(1);
    defineMidiAccess(jest.fn().mockResolvedValue(mockAccess));
    const { result } = renderHook(() => useMidiInput());
    await act(async () => {});
    expect(result.current.status).toBe('connected');
    expect(result.current.inputs).not.toBeNull();
  });

  it('returns "connecting" when MIDI access is granted but no inputs are connected', async () => {
    const mockAccess = makeMockMidiAccess(0);
    defineMidiAccess(jest.fn().mockResolvedValue(mockAccess));
    const { result } = renderHook(() => useMidiInput());
    await act(async () => {});
    expect(result.current.status).toBe('connecting');
  });
});
