import * as Tone from 'tone';

let pianoSampler: Tone.Sampler | null = null;
let pianoSamplerLoaded: Promise<void> | null = null;
const STRUM_STEP_SECONDS = 0.025;

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
}: {
  sampler: Tone.Sampler;
  notes: string[];
  duration: Tone.Unit.Time;
  startTime?: Tone.Unit.Time;
}): void => {
  const orderedNotes = sortNotesLowToHigh(notes);

  orderedNotes.forEach((note, index) => {
    if (startTime !== undefined) {
      const noteTime = Tone.Time(startTime).toSeconds() + index * STRUM_STEP_SECONDS;
      sampler.triggerAttackRelease(note, duration, noteTime);
      return;
    }

    sampler.triggerAttackRelease(note, duration, `+${index * STRUM_STEP_SECONDS}`);
  });
};

export const startAudio = async (): Promise<void> => {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
};

export const stopAllAudio = (): void => {
  if (pianoSampler) {
    pianoSampler.releaseAll();
  }

  Tone.Transport.stop();
  Tone.Transport.cancel();
};

export const playChordVoicing = async ({
  leftHand,
  rightHand,
  duration = '1n',
}: {
  leftHand: string[];
  rightHand: string[];
  duration?: Tone.Unit.Time;
}): Promise<void> => {
  await startAudio();
  const sampler = await ensurePianoSamplerLoaded();
  const notes = [...leftHand, ...rightHand];

  if (notes.length > 0) {
    triggerStrummedChord({ sampler, notes, duration });
  }
};

export const playProgression = async (
  voicings: Array<{
    leftHand: string[];
    rightHand: string[];
  }>,
): Promise<void> => {
  await startAudio();
  stopAllAudio();

  const now = Tone.now();
  const sampler = await ensurePianoSamplerLoaded();

  voicings.forEach((voicing, index) => {
    const time = now + index * 1.2;
    const notes = [...voicing.leftHand, ...voicing.rightHand];

    if (notes.length > 0) {
      triggerStrummedChord({
        sampler,
        notes,
        duration: '1n',
        startTime: time,
      });
    }
  });
};
