jest.mock('tone', () => ({
  now: jest.fn(() => 10),
  gainToDb: jest.fn((v: number) => v),
}));

import { createMetronomePulsePolicy } from '../MetronomePulsePolicy';

const createMockSynthBank = () => {
  const clickSynth = {
    volume: { value: 0 },
    triggerAttackRelease: jest.fn(),
  };

  return {
    getClickSynth: jest.fn(() => clickSynth),
    triggerDrumHit: jest.fn(),
    releaseAll: jest.fn(),
    clickSynth,
  };
};

describe('MetronomePulsePolicy', () => {
  it('returns false when drum path is not provided', async () => {
    const synthBank = createMockSynthBank();
    const loadPattern = jest.fn();
    const policy = createMetronomePulsePolicy({
      synthBank: synthBank as never,
      loadPattern,
    });

    const played = await policy.playDrumPulse({
      volume: 0.8,
      drumPath: null,
      timeSignature: '4/4',
      tempoBpm: 120,
      beatIndex: 0,
    });

    expect(played).toBe(false);
    expect(loadPattern).not.toHaveBeenCalled();
    expect(synthBank.triggerDrumHit).not.toHaveBeenCalled();
  });

  it('returns false when pattern cannot be loaded', async () => {
    const synthBank = createMockSynthBank();
    const loadPattern = jest.fn().mockResolvedValue(null);
    const policy = createMetronomePulsePolicy({
      synthBank: synthBank as never,
      loadPattern,
    });

    const played = await policy.playDrumPulse({
      volume: 0.8,
      drumPath: '/kit.json',
      timeSignature: '4/4',
      tempoBpm: 120,
      beatIndex: 0,
    });

    expect(played).toBe(false);
    expect(loadPattern).toHaveBeenCalledWith('/kit.json');
    expect(synthBank.triggerDrumHit).not.toHaveBeenCalled();
  });

  it('triggers only events in the selected beat window', async () => {
    const synthBank = createMockSynthBank();
    const loadPattern = jest.fn().mockResolvedValue({
      durationBeats: 4,
      events: [
        { beat: 0, durationBeats: 0.5, midi: 36, velocity: 1 },
        { beat: 1.2, durationBeats: 0.25, midi: 42, velocity: 0.6 },
        { beat: 2, durationBeats: 0.5, midi: 38, velocity: 0.9 },
      ],
    });

    const policy = createMetronomePulsePolicy({
      synthBank: synthBank as never,
      loadPattern,
    });

    const played = await policy.playDrumPulse({
      volume: 0.5,
      drumPath: '/kit.json',
      timeSignature: '4/4',
      tempoBpm: 120,
      beatIndex: 1,
    });

    expect(played).toBe(true);
    expect(synthBank.triggerDrumHit).toHaveBeenCalledTimes(1);
    expect(synthBank.triggerDrumHit).toHaveBeenCalledWith(42, 10 + 0.2 * 0.5, 0.125, 0.6 * 0.5);
  });

  it('triggers click pulse with downbeat note', () => {
    const synthBank = createMockSynthBank();
    const policy = createMetronomePulsePolicy({
      synthBank: synthBank as never,
      loadPattern: jest.fn(),
    });

    policy.triggerClickPulse({ volume: 0.7, isDownbeat: true, time: 5 });

    expect(synthBank.getClickSynth).toHaveBeenCalledTimes(1);
    expect(synthBank.clickSynth.triggerAttackRelease).toHaveBeenCalledWith('C6', '32n', 5);
  });
});
