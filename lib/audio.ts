import * as Tone from 'tone';

let polySynth: Tone.PolySynth | null = null;
let bassSynth: Tone.PolySynth | null = null;

const getPolySynth = (): Tone.PolySynth => {
  if (!polySynth) {
    polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 2,
        sustain: 0.01,
        release:0,
      },
    }).toDestination();
  }

  return polySynth;
};

const getBassSynth = (): Tone.PolySynth => {
  if (!bassSynth) {
    bassSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 2,
        sustain: 0.01,
        release: 0,
      },
    }).toDestination();
  }

  return bassSynth;
};

export const startAudio = async (): Promise<void> => {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
};

export const stopAllAudio = (): void => {
  getPolySynth().releaseAll();
  getBassSynth().releaseAll();
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

  const bass = getBassSynth();
  const poly = getPolySynth();

  if (leftHand.length > 0) {
    bass.triggerAttackRelease(leftHand, duration);
  }

  if (rightHand.length > 0) {
    poly.triggerAttackRelease(rightHand, duration);
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
  const bass = getPolySynth();
  const poly = getPolySynth();

  voicings.forEach((voicing, index) => {
    const time = now + index * 1.2;

    if (voicing.leftHand.length > 0) {
      bass.triggerAttackRelease(voicing.leftHand, '1n', time);
    }

    if (voicing.rightHand.length > 0) {
      poly.triggerAttackRelease(voicing.rightHand, '1n', time);
    }
  });
};