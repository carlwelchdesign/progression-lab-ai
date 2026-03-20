import * as Tone from 'tone';

let pianoSampler: Tone.Sampler | null = null;
let pianoSamplerLoaded: Promise<void> | null = null;
let scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[] = [];
const DEFAULT_TEMPO_BPM = 100;
const MIN_TEMPO_BPM = 40;
const MAX_TEMPO_BPM = 240;
const CHORD_BEATS = 2;
const STRUM_STEP_SECONDS = 0.025;

export type PlaybackStyle = 'strum' | 'block';
export type PlaybackRegister = 'off' | 'low' | 'mid' | 'high';

const REGISTER_MIDI_RANGES: Record<
  Exclude<PlaybackRegister, 'off'>,
  { min: number; max: number }
> = {
  low: { min: 36, max: 59 }, // C2–B3
  mid: { min: 48, max: 71 }, // C3–B4
  high: { min: 60, max: 83 }, // C4–B5
};

const MAX_HUMANIZE_TIMING_S = 0.05; // 50 ms at 100%
const MAX_HUMANIZE_VELOCITY = 12; // ±12 MIDI velocity units at 100%

const applyInversionLock = (notes: string[], register: PlaybackRegister): string[] => {
  if (register === 'off') return notes;
  const range = REGISTER_MIDI_RANGES[register];
  const center = (range.min + range.max) / 2;

  return notes.map((note) => {
    const baseMidi = Tone.Frequency(note).toMidi();
    let bestMidi: number = baseMidi;
    let bestDist = Infinity;

    for (let shift = -4; shift <= 4; shift++) {
      const candidate = baseMidi + shift * 12;
      if (candidate >= range.min && candidate <= range.max) {
        const dist = Math.abs(candidate - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestMidi = candidate;
        }
      }
    }

    // If no octave shift placed this note in range, pick the nearest boundary
    if (bestDist === Infinity) {
      for (let shift = -4; shift <= 4; shift++) {
        const candidate = baseMidi + shift * 12;
        const clampDist = Math.abs(Math.max(range.min, Math.min(range.max, candidate)) - center);
        if (clampDist < bestDist) {
          bestDist = clampDist;
          bestMidi = candidate;
        }
      }
    }

    return Tone.Frequency(bestMidi, 'midi').toNote() as string;
  });
};

/**
 * gate: 0 = staccato (~10% of chord duration), 1 = sustained (~95%)
 */
const applyGate = (chordDurationSeconds: number, gate: number): number =>
  chordDurationSeconds * (0.1 + gate * 0.85);

const normalizeVelocity = (velocity?: number): number | undefined => {
  if (!Number.isFinite(velocity)) {
    return undefined;
  }

  return Math.min(1, Math.max(0.1, (velocity ?? 96) / 127));
};

const normalizeTempoBpm = (tempoBpm?: number): number => {
  if (!Number.isFinite(tempoBpm)) {
    return DEFAULT_TEMPO_BPM;
  }

  return Math.min(
    MAX_TEMPO_BPM,
    Math.max(MIN_TEMPO_BPM, Math.round(tempoBpm ?? DEFAULT_TEMPO_BPM)),
  );
};

const getChordDurationSeconds = (tempoBpm?: number): number => {
  const normalizedTempo = normalizeTempoBpm(tempoBpm);
  return (60 / normalizedTempo) * CHORD_BEATS;
};

const getPianoSampler = (): Tone.Sampler => {
  if (!pianoSampler) {
    pianoSampler = new Tone.Sampler({
      urls: {
        A0: 'A0.mp3',
        C1: 'C1.mp3',
        'D#1': 'Ds1.mp3',
        'F#1': 'Fs1.mp3',
        A1: 'A1.mp3',
        C2: 'C2.mp3',
        'D#2': 'Ds2.mp3',
        'F#2': 'Fs2.mp3',
        A2: 'A2.mp3',
        C3: 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        A3: 'A3.mp3',
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        A4: 'A4.mp3',
        C5: 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        A5: 'A5.mp3',
        C6: 'C6.mp3',
        'D#6': 'Ds6.mp3',
        'F#6': 'Fs6.mp3',
        A6: 'A6.mp3',
        C7: 'C7.mp3',
        'D#7': 'Ds7.mp3',
        'F#7': 'Fs7.mp3',
        A7: 'A7.mp3',
        C8: 'C8.mp3',
      },
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
    }).toDestination();

    pianoSamplerLoaded = Tone.loaded();
  }

  return pianoSampler;
};

const ensurePianoSamplerLoaded = async (): Promise<Tone.Sampler> => {
  const sampler = getPianoSampler();

  if (pianoSamplerLoaded) {
    await pianoSamplerLoaded;
  }

  return sampler;
};

const sortNotesLowToHigh = (notes: string[]): string[] => {
  return [...notes].sort((a, b) => {
    const midiA = Tone.Frequency(a).toMidi();
    const midiB = Tone.Frequency(b).toMidi();
    return midiA - midiB;
  });
};

const triggerStrummedChord = ({
  sampler,
  notes,
  duration,
  startTime,
  velocity,
}: {
  sampler: Tone.Sampler;
  notes: string[];
  duration: Tone.Unit.Time;
  startTime?: Tone.Unit.Time;
  velocity?: number;
}): void => {
  const orderedNotes = sortNotesLowToHigh(notes);
  const normalizedVelocity = normalizeVelocity(velocity);

  orderedNotes.forEach((note, index) => {
    if (startTime !== undefined) {
      const noteTime = Tone.Time(startTime).toSeconds() + index * STRUM_STEP_SECONDS;
      sampler.triggerAttackRelease(note, duration, noteTime, normalizedVelocity);
      return;
    }

    sampler.triggerAttackRelease(
      note,
      duration,
      `+${index * STRUM_STEP_SECONDS}`,
      normalizedVelocity,
    );
  });
};

const triggerBlockChord = ({
  sampler,
  notes,
  duration,
  startTime,
  velocity,
}: {
  sampler: Tone.Sampler;
  notes: string[];
  duration: Tone.Unit.Time;
  startTime?: Tone.Unit.Time;
  velocity?: number;
}): void => {
  const orderedNotes = sortNotesLowToHigh(notes);
  const normalizedVelocity = normalizeVelocity(velocity);

  if (orderedNotes.length === 0) {
    return;
  }

  if (startTime !== undefined) {
    sampler.triggerAttackRelease(orderedNotes, duration, startTime, normalizedVelocity);
    return;
  }

  sampler.triggerAttackRelease(orderedNotes, duration, undefined, normalizedVelocity);
};

const triggerChordByStyle = ({
  style,
  sampler,
  notes,
  duration,
  startTime,
  attack,
  decay,
  velocity,
}: {
  style: PlaybackStyle;
  sampler: Tone.Sampler;
  notes: string[];
  duration: Tone.Unit.Time;
  startTime?: Tone.Unit.Time;
  attack?: number;
  decay?: number;
  velocity?: number;
}): void => {
  if (attack !== undefined) {
    sampler.attack = attack;
  }
  if (decay !== undefined) {
    sampler.release = decay;
  }

  if (style === 'block') {
    triggerBlockChord({ sampler, notes, duration, startTime, velocity });
    return;
  }

  triggerStrummedChord({ sampler, notes, duration, startTime, velocity });
};

export const startAudio = async (): Promise<void> => {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
};

export const stopAllAudio = (): void => {
  scheduledPlaybackTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  scheduledPlaybackTimeouts = [];

  if (pianoSampler) {
    pianoSampler.releaseAll();
  }

  Tone.Transport.stop();
  Tone.Transport.cancel();
};

export const playChordVoicing = async ({
  leftHand,
  rightHand,
  duration,
  tempoBpm,
  playbackStyle = 'strum',
  attack,
  decay,
  velocity,
  humanize = 0,
  gate = 1,
  inversionRegister = 'off',
}: {
  leftHand: string[];
  rightHand: string[];
  duration?: Tone.Unit.Time;
  tempoBpm?: number;
  playbackStyle?: PlaybackStyle;
  attack?: number;
  decay?: number;
  velocity?: number;
  humanize?: number;
  gate?: number;
  inversionRegister?: PlaybackRegister;
}): Promise<void> => {
  await startAudio();
  stopAllAudio();
  const sampler = await ensurePianoSamplerLoaded();
  const chordDurSeconds = getChordDurationSeconds(tempoBpm);
  const noteDuration =
    gate !== 1 ? applyGate(chordDurSeconds, gate) : (duration ?? chordDurSeconds);

  const lockedNotes = applyInversionLock([...leftHand, ...rightHand], inversionRegister);

  if (lockedNotes.length > 0) {
    const timingDelay = humanize > 0 ? Math.random() * humanize * MAX_HUMANIZE_TIMING_S : 0;
    const velJitter = humanize > 0 ? (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_VELOCITY : 0;
    const effectiveVelocity =
      velocity !== undefined
        ? Math.round(Math.max(20, Math.min(127, velocity + velJitter)))
        : undefined;

    triggerChordByStyle({
      style: playbackStyle,
      sampler,
      notes: lockedNotes,
      duration: noteDuration,
      startTime: timingDelay > 0 ? `+${timingDelay}` : undefined,
      attack,
      decay,
      velocity: effectiveVelocity,
    });
  }
};

export const playProgression = async (
  voicings: Array<{
    leftHand: string[];
    rightHand: string[];
  }>,
  tempoBpm?: number,
  playbackStyle: PlaybackStyle = 'strum',
  attack?: number,
  decay?: number,
  opts?: {
    velocity?: number;
    humanize?: number;
    gate?: number;
    inversionRegister?: PlaybackRegister;
  },
): Promise<void> => {
  await startAudio();
  stopAllAudio();

  const sampler = await ensurePianoSamplerLoaded();
  const { velocity, humanize = 0, gate = 1, inversionRegister = 'off' } = opts ?? {};
  const chordDurationSeconds = getChordDurationSeconds(tempoBpm);
  const noteDuration = applyGate(chordDurationSeconds, gate);

  voicings.forEach((voicing, index) => {
    const lockedNotes = applyInversionLock(
      [...voicing.leftHand, ...voicing.rightHand],
      inversionRegister,
    );

    if (lockedNotes.length > 0) {
      const timingJitter =
        humanize > 0 ? (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_TIMING_S : 0;
      const velJitter =
        humanize > 0 ? (Math.random() * 2 - 1) * humanize * MAX_HUMANIZE_VELOCITY : 0;
      const effectiveVelocity =
        velocity !== undefined
          ? Math.round(Math.max(20, Math.min(127, velocity + velJitter)))
          : undefined;

      const timeoutId = setTimeout(
        () => {
          triggerChordByStyle({
            style: playbackStyle,
            sampler,
            notes: lockedNotes,
            duration: noteDuration,
            attack,
            decay,
            velocity: effectiveVelocity,
          });
        },
        Math.max(0, (index * chordDurationSeconds + timingJitter) * 1000),
      );

      scheduledPlaybackTimeouts.push(timeoutId);
    }
  });
};
