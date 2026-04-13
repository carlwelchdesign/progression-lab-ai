export type MidiNoteEvent = {
  note: string;
  velocity: number;
  timestamp: number;
};

export type MidiSubscription = {
  unsubscribe: () => void;
};

export interface MidiService {
  isSupported(): boolean;
  requestAccess(): Promise<boolean>;
  subscribeToNotes(handler: (event: MidiNoteEvent) => void): MidiSubscription;
}

const SEMITONE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BASE_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function normalizeMidiNoteName(note: string): string {
  const trimmed = note.trim();
  const parsed = trimmed.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);

  if (!parsed) {
    return trimmed.toUpperCase();
  }

  const [, letterRaw, accidental, octaveRaw] = parsed;
  const letter = letterRaw.toUpperCase();
  let semitone = BASE_SEMITONES[letter] ?? 0;
  let octave = Number.parseInt(octaveRaw, 10);

  if (accidental === '#') {
    semitone += 1;
  }

  if (accidental === 'b') {
    semitone -= 1;
  }

  while (semitone < 0) {
    semitone += 12;
    octave -= 1;
  }

  while (semitone >= 12) {
    semitone -= 12;
    octave += 1;
  }

  return `${SEMITONE_NAMES[semitone]}${octave}`;
}

const toNoteName = (noteNumber: number): string => {
  const names = SEMITONE_NAMES;
  const octave = Math.floor(noteNumber / 12) - 1;
  return normalizeMidiNoteName(`${names[noteNumber % 12]}${octave}`);
};

export class WebMidiService implements MidiService {
  private readonly listeners = new Set<(event: MidiNoteEvent) => void>();
  private attachedInputs = new Set<MIDIInput>();

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
  }

  async requestAccess(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    const access = await navigator.requestMIDIAccess();
    this.attachedInputs.forEach((input) => {
      input.onmidimessage = null;
    });
    this.attachedInputs = new Set(access.inputs.values());

    this.attachedInputs.forEach((input) => {
      input.onmidimessage = (message) => {
        if (!message.data || message.data.length < 3) {
          return;
        }

        const [status, noteNumber, velocity] = message.data;
        const command = status & 0xf0;

        if (command !== 0x90 || velocity === 0) {
          return;
        }

        const event: MidiNoteEvent = {
          note: toNoteName(noteNumber),
          velocity,
          timestamp: Date.now(),
        };

        this.listeners.forEach((listener) => listener(event));
      };
    });

    return this.attachedInputs.size > 0;
  }

  subscribeToNotes(handler: (event: MidiNoteEvent) => void): MidiSubscription {
    this.listeners.add(handler);

    return {
      unsubscribe: () => {
        this.listeners.delete(handler);
      },
    };
  }
}

export class MockMidiService implements MidiService {
  private readonly listeners = new Set<(event: MidiNoteEvent) => void>();

  isSupported(): boolean {
    return true;
  }

  async requestAccess(): Promise<boolean> {
    return true;
  }

  subscribeToNotes(handler: (event: MidiNoteEvent) => void): MidiSubscription {
    this.listeners.add(handler);

    return {
      unsubscribe: () => {
        this.listeners.delete(handler);
      },
    };
  }

  emit(event: MidiNoteEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
