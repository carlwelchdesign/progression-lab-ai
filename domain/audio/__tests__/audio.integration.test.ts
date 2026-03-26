jest.mock('tone', () => {
  const NOTE_OFFSETS: Record<string, number> = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
  };
  const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const noteToMidi = (note: string): number => {
    const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note.trim());
    if (!match) {
      return 60;
    }

    const [, pitch, octaveText] = match;
    const offset = NOTE_OFFSETS[pitch] ?? 0;
    const octave = Number(octaveText);
    return (octave + 1) * 12 + offset;
  };

  const midiToNote = (midi: number): string => {
    const rounded = Math.round(midi);
    const pitch = PITCHES[((rounded % 12) + 12) % 12];
    const octave = Math.floor(rounded / 12) - 1;
    return `${pitch}${octave}`;
  };

  const destination = { id: 'destination' };

  class MockNode {
    public connections: unknown[] = [];

    public disconnectCount = 0;

    public disposed = false;

    public settings: Record<string, unknown> = {};

    public decay = 0;

    connect(target: unknown): this {
      this.connections.push(target);
      return this;
    }

    disconnect(): this {
      this.disconnectCount += 1;
      this.connections = [];
      return this;
    }

    set(values: Record<string, unknown>): this {
      this.settings = { ...this.settings, ...values };
      return this;
    }

    start(): this {
      return this;
    }

    dispose(): void {
      this.disposed = true;
    }

    toDestination(): this {
      this.connect(destination);
      return this;
    }
  }

  class MockSampler extends MockNode {
    public attack = 0;

    public release = 0;

    public triggerCalls: Array<{
      notes: unknown;
      duration: unknown;
      time: unknown;
      velocity: unknown;
    }> = [];

    public releaseAll = jest.fn();

    constructor(config: { release?: number }) {
      super();
      this.release = config.release ?? 0;
      toneMockState.samplers.push(this);
    }

    triggerAttackRelease(
      notes: unknown,
      duration: unknown,
      time?: unknown,
      velocity?: unknown,
    ): void {
      this.triggerCalls.push({ notes, duration, time, velocity });
    }
  }

  class MockChorus extends MockNode {
    constructor() {
      super();
      toneMockState.chorus.push(this);
    }
  }

  class MockFeedbackDelay extends MockNode {
    constructor() {
      super();
      toneMockState.feedbackDelays.push(this);
    }
  }

  class MockTremolo extends MockNode {
    constructor() {
      super();
      toneMockState.tremolos.push(this);
    }
  }

  class MockVibrato extends MockNode {
    constructor() {
      super();
      toneMockState.vibratos.push(this);
    }
  }

  class MockPhaser extends MockNode {
    constructor() {
      super();
      toneMockState.phasers.push(this);
    }
  }

  class MockReverb extends MockNode {
    public ready = Promise.resolve();

    constructor() {
      super();
      toneMockState.reverbs.push(this);
    }
  }

  class MockPart<TEvent extends { time: number }> {
    public disposed = false;

    constructor(
      private readonly callback: (time: number, event: TEvent) => void,
      private readonly events: TEvent[],
    ) {
      toneMockState.parts.push(this as unknown as MockPart<{ time: number }>);
    }

    start(offset = 0): this {
      this.events.forEach((event) => {
        setTimeout(
          () => {
            this.callback(event.time, event);
          },
          (offset + event.time) * 1000,
        );
      });
      return this;
    }

    dispose(): void {
      this.disposed = true;
    }
  }

  const Frequency = (value: number | string, unit?: string) => ({
    toMidi: () => {
      if (typeof value === 'number') {
        return value;
      }

      return noteToMidi(value);
    },
    toNote: () => {
      if (unit === 'midi') {
        return midiToNote(Number(value));
      }

      if (typeof value === 'number') {
        return midiToNote(value);
      }

      return value;
    },
  });

  const Time = (value: number | string) => ({
    toSeconds: () => {
      if (typeof value === 'number') {
        return value;
      }

      if (value.startsWith('+')) {
        return Number(value.slice(1));
      }

      return Number(value);
    },
  });

  const toneMockState = {
    destination,
    samplers: [] as MockSampler[],
    chorus: [] as MockChorus[],
    reverbs: [] as MockReverb[],
    feedbackDelays: [] as MockFeedbackDelay[],
    tremolos: [] as MockTremolo[],
    vibratos: [] as MockVibrato[],
    phasers: [] as MockPhaser[],
    parts: [] as MockPart<{ time: number }>[],
    Transport: {
      bpm: { value: 120 },
      timeSignature: 4,
      start: jest.fn(),
      stop: jest.fn(),
      cancel: jest.fn(),
    },
    context: {
      state: 'suspended' as 'suspended' | 'running',
    },
    start: jest.fn(async () => {
      toneMockState.context.state = 'running';
    }),
    loaded: jest.fn(() => Promise.resolve()),
    reset: () => {
      toneMockState.samplers.length = 0;
      toneMockState.chorus.length = 0;
      toneMockState.reverbs.length = 0;
      toneMockState.feedbackDelays.length = 0;
      toneMockState.tremolos.length = 0;
      toneMockState.vibratos.length = 0;
      toneMockState.phasers.length = 0;
      toneMockState.parts.length = 0;
      toneMockState.Transport.bpm.value = 120;
      toneMockState.Transport.timeSignature = 4;
      toneMockState.Transport.start.mockClear();
      toneMockState.Transport.stop.mockClear();
      toneMockState.Transport.cancel.mockClear();
      toneMockState.start.mockClear();
      toneMockState.loaded.mockClear();
      toneMockState.context.state = 'suspended';
    },
  };

  return {
    Sampler: MockSampler,
    Chorus: MockChorus,
    FeedbackDelay: MockFeedbackDelay,
    Tremolo: MockTremolo,
    Vibrato: MockVibrato,
    Phaser: MockPhaser,
    Reverb: MockReverb,
    Part: MockPart,
    Frequency,
    Time,
    getDestination: () => destination,
    Transport: toneMockState.Transport,
    context: toneMockState.context,
    start: toneMockState.start,
    loaded: toneMockState.loaded,
    __toneMockState: toneMockState,
  };
});

import * as Tone from 'tone';

import { createToneAudioEngine } from '../audio';

type ToneMockState = {
  destination: unknown;
  samplers: Array<{
    connections: unknown[];
    triggerCalls: Array<{
      notes: unknown;
      duration: unknown;
      time: unknown;
      velocity: unknown;
    }>;
  }>;
  chorus: Array<{ connections: unknown[] }>;
  reverbs: Array<{ connections: unknown[] }>;
  context: { state: 'suspended' | 'running' };
  start: jest.Mock<Promise<void>, []>;
  reset: () => void;
};

const getToneMockState = (): ToneMockState =>
  (Tone as unknown as { __toneMockState: ToneMockState }).__toneMockState;

describe('createToneAudioEngine integration paths', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getToneMockState().reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('routes sampler through enabled effects in order', async () => {
    const engine = createToneAudioEngine();

    await engine.playChordVoicing({
      leftHand: ['C3'],
      rightHand: ['E4', 'G4'],
      playbackStyle: 'block',
      instrument: 'piano',
      humanize: 0,
    });

    engine.setChorusEnabled(true);
    engine.setReverbEnabled(true);

    const toneState = getToneMockState();
    const sampler = toneState.samplers[0];
    const chorus = toneState.chorus[0];
    const reverb = toneState.reverbs[0];

    expect(sampler.connections[0]).toBe(chorus);
    expect(chorus.connections[0]).toBe(reverb);
    expect(reverb.connections[0]).toBe(toneState.destination);
  });

  it('schedules progression playback using tempo-derived delays', async () => {
    const engine = createToneAudioEngine();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    await engine.playProgression(
      [
        { leftHand: ['C3'], rightHand: ['E4', 'G4'] },
        { leftHand: ['F3'], rightHand: ['A4', 'C5'] },
      ],
      120,
      'block',
      undefined,
      undefined,
      { humanize: 0, gate: 1, instrument: 'piano' },
    );

    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 0);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 1000);

    jest.runOnlyPendingTimers();

    const toneState = getToneMockState();
    const sampler = toneState.samplers[0];

    expect(sampler.triggerCalls).toHaveLength(2);
    expect(sampler.triggerCalls[0].duration).toBeCloseTo(0.95, 5);
    setTimeoutSpy.mockRestore();
  });

  it('starts audio context when not running', async () => {
    const engine = createToneAudioEngine();
    const toneState = getToneMockState();

    toneState.context.state = 'suspended';
    await engine.startAudio();

    expect(toneState.start).toHaveBeenCalledTimes(1);
    expect(toneState.context.state).toBe('running');
  });
});
