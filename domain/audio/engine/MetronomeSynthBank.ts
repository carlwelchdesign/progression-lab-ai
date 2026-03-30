import * as Tone from 'tone';

export type MetronomeSynthBank = {
  getClickSynth: () => Tone.Synth;
  triggerDrumHit: (midi: number, time: number, durationSeconds: number, velocity: number) => void;
  releaseAll: () => void;
};

export const createMetronomeSynthBank = (): MetronomeSynthBank => {
  let metronomeSynth: Tone.Synth | null = null;
  let metronomeKickSynth: Tone.MembraneSynth | null = null;
  let metronomeSnareSynth: Tone.NoiseSynth | null = null;
  let metronomeHatSynth: Tone.MetalSynth | null = null;
  let metronomeTomSynth: Tone.MembraneSynth | null = null;
  let metronomeCrashSynth: Tone.MetalSynth | null = null;

  const getClickSynth = (): Tone.Synth => {
    if (!metronomeSynth) {
      metronomeSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 },
      }).toDestination();
    }
    return metronomeSynth;
  };

  const getKickSynth = (): Tone.MembraneSynth => {
    if (!metronomeKickSynth) {
      metronomeKickSynth = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 8,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
      }).toDestination();
    }

    return metronomeKickSynth;
  };

  const getTomSynth = (): Tone.MembraneSynth => {
    if (!metronomeTomSynth) {
      metronomeTomSynth = new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 5,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.08 },
      }).toDestination();
    }

    return metronomeTomSynth;
  };

  const getSnareSynth = (): Tone.NoiseSynth => {
    if (!metronomeSnareSynth) {
      metronomeSnareSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.03 },
      }).toDestination();
    }

    return metronomeSnareSynth;
  };

  const getHatSynth = (): Tone.MetalSynth => {
    if (!metronomeHatSynth) {
      metronomeHatSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
        harmonicity: 5.1,
        modulationIndex: 18,
        resonance: 3000,
        octaves: 1.5,
      }).toDestination();
    }

    return metronomeHatSynth;
  };

  const getCrashSynth = (): Tone.MetalSynth => {
    if (!metronomeCrashSynth) {
      metronomeCrashSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.18 },
        harmonicity: 4.3,
        modulationIndex: 20,
        resonance: 2200,
        octaves: 1.7,
      }).toDestination();
    }

    return metronomeCrashSynth;
  };

  const triggerDrumHit = (
    midi: number,
    time: number,
    durationSeconds: number,
    velocity: number,
  ): void => {
    const normalizedVelocity = Math.min(1, Math.max(0.05, velocity));

    if (midi <= 36) {
      const kick = getKickSynth();
      kick.volume.value = Tone.gainToDb(Math.max(0.0001, normalizedVelocity * 0.7));
      kick.triggerAttackRelease('C1', Math.max(0.03, durationSeconds * 0.8), time);
      return;
    }

    if (midi === 38 || midi === 40) {
      const snare = getSnareSynth();
      snare.volume.value = Tone.gainToDb(Math.max(0.0001, normalizedVelocity * 0.6));
      snare.triggerAttackRelease(Math.max(0.05, durationSeconds * 0.5), time, normalizedVelocity);
      return;
    }

    if (midi === 49 || midi === 57) {
      const crash = getCrashSynth();
      crash.volume.value = Tone.gainToDb(Math.max(0.0001, normalizedVelocity * 0.45));
      crash.triggerAttackRelease('16n', time, normalizedVelocity);
      return;
    }

    if (midi === 42 || midi === 44 || midi === 46) {
      const hat = getHatSynth();
      hat.volume.value = Tone.gainToDb(Math.max(0.0001, normalizedVelocity * 0.38));
      hat.triggerAttackRelease('32n', time, normalizedVelocity);
      return;
    }

    if (midi >= 41 && midi <= 48) {
      const tom = getTomSynth();
      tom.volume.value = Tone.gainToDb(Math.max(0.0001, normalizedVelocity * 0.45));
      tom.triggerAttackRelease('G2', Math.max(0.04, durationSeconds * 0.7), time);
      return;
    }

    const hat = getHatSynth();
    hat.volume.value = Tone.gainToDb(Math.max(0.0001, normalizedVelocity * 0.35));
    hat.triggerAttackRelease('32n', time, normalizedVelocity);
  };

  const releaseAll = (): void => {
    metronomeKickSynth?.triggerRelease();
    metronomeTomSynth?.triggerRelease();
    metronomeSnareSynth?.triggerRelease();
    metronomeHatSynth?.triggerRelease();
    metronomeCrashSynth?.triggerRelease();
  };

  return {
    getClickSynth,
    triggerDrumHit,
    releaseAll,
  };
};
