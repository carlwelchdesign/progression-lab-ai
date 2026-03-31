import * as Tone from 'tone';

export type SamplerInstrument = Pick<Tone.Sampler, 'triggerAttackRelease' | 'attack' | 'release'>;

export type SamplerBank = {
  ensurePianoSamplerLoaded: () => Promise<SamplerInstrument>;
  ensureRhodesSamplerLoaded: () => Promise<SamplerInstrument>;
  releaseAllSamplers: () => void;
};

type CreateSamplerBankParams = {
  connectSamplerToCurrentOutput: (sampler: Tone.Sampler) => Tone.Sampler;
  ensureReverbReady: () => Promise<void>;
};

export const createSamplerBank = ({
  connectSamplerToCurrentOutput,
  ensureReverbReady,
}: CreateSamplerBankParams): SamplerBank => {
  let pianoSampler: Tone.Sampler | null = null;
  let pianoSamplerLoaded: Promise<void> | null = null;
  let rhodesSampler: Tone.Sampler | null = null;
  let rhodesSamplerLoaded: Promise<void> | null = null;

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
      });

      connectSamplerToCurrentOutput(pianoSampler);
      pianoSamplerLoaded = Tone.loaded();
    }

    return pianoSampler;
  };

  const ensurePianoSamplerLoaded = async (): Promise<SamplerInstrument> => {
    const sampler = getPianoSampler();

    await ensureReverbReady();

    if (pianoSamplerLoaded) {
      await pianoSamplerLoaded;
    }

    return sampler;
  };

  const getRhodesSampler = (): Tone.Sampler => {
    if (!rhodesSampler) {
      rhodesSampler = new Tone.Sampler({
        urls: {
          'A#1': 'a%231.mp3',
          'A#2': 'a%232.mp3',
          'A#3': 'a%233.mp3',
          'A#4': 'a%234.mp3',
          'A#5': 'a%235.mp3',
          'A#6': 'a%236.mp3',
          'A#7': 'a%237.mp3',
          A1: 'a1.mp3',
          A2: 'a2.mp3',
          A3: 'a3.mp3',
          A4: 'a4.mp3',
          A5: 'a5.mp3',
          A6: 'a6.mp3',
          A7: 'a7.mp3',
          B1: 'b1.mp3',
          B2: 'b2.mp3',
          B3: 'b3.mp3',
          B4: 'b4.mp3',
          B5: 'b5.mp3',
          B6: 'b6.mp3',
          B7: 'b7.mp3',
          'C#1': 'c%231.mp3',
          'C#2': 'c%232.mp3',
          'C#3': 'c%233.mp3',
          'C#4': 'c%234.mp3',
          'C#5': 'c%235.mp3',
          'C#6': 'c%236.mp3',
          'C#7': 'c%237.mp3',
          C1: 'c1.mp3',
          C2: 'c2.mp3',
          C3: 'c3.mp3',
          C4: 'c4.mp3',
          C5: 'c5.mp3',
          C6: 'c6.mp3',
          C7: 'c7.mp3',
          C8: 'c8.mp3',
          'D#1': 'd%231.mp3',
          'D#2': 'd%232.mp3',
          'D#3': 'd%233.mp3',
          'D#4': 'd%234.mp3',
          'D#5': 'd%235.mp3',
          'D#6': 'd%236.mp3',
          'D#7': 'd%237.mp3',
          D1: 'd1.mp3',
          D2: 'd2.mp3',
          D3: 'd3.mp3',
          D4: 'd4.mp3',
          D5: 'd5.mp3',
          D6: 'd6.mp3',
          D7: 'd7.mp3',
          E1: 'e1.mp3',
          E2: 'e2.mp3',
          E3: 'e3.mp3',
          E4: 'e4.mp3',
          E5: 'e5.mp3',
          E6: 'e6.mp3',
          E7: 'e7.mp3',
          'F#1': 'f%231.mp3',
          'F#2': 'f%232.mp3',
          'F#3': 'f%233.mp3',
          'F#4': 'f%234.mp3',
          'F#5': 'f%235.mp3',
          'F#6': 'f%236.mp3',
          'F#7': 'f%237.mp3',
          F1: 'f1.mp3',
          F2: 'f2.mp3',
          F3: 'f3.mp3',
          F4: 'f4.mp3',
          F5: 'f5.mp3',
          F6: 'f6.mp3',
          F7: 'f7.mp3',
          'G#1': 'g%231.mp3',
          'G#2': 'g%232.mp3',
          'G#3': 'g%233.mp3',
          'G#4': 'g%234.mp3',
          'G#5': 'g%235.mp3',
          'G#6': 'g%236.mp3',
          'G#7': 'g%237.mp3',
          G1: 'g1.mp3',
          G2: 'g2.mp3',
          G3: 'g3.mp3',
          G4: 'g4.mp3',
          G5: 'g5.mp3',
          G6: 'g6.mp3',
          G7: 'g7.mp3',
        },
        release: 0.8,
        baseUrl: '/audio/rhodes/',
      });

      connectSamplerToCurrentOutput(rhodesSampler);
      rhodesSamplerLoaded = Tone.loaded();
    }

    return rhodesSampler;
  };

  const ensureRhodesSamplerLoaded = async (): Promise<SamplerInstrument> => {
    const sampler = getRhodesSampler();

    await ensureReverbReady();

    if (rhodesSamplerLoaded) {
      await rhodesSamplerLoaded;
    }

    return sampler;
  };

  const releaseAllSamplers = (): void => {
    pianoSampler?.releaseAll();
    rhodesSampler?.releaseAll();
  };

  return {
    ensurePianoSamplerLoaded,
    ensureRhodesSamplerLoaded,
    releaseAllSamplers,
  };
};
