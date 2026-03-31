import {
  computeEffectiveVelocity,
  computeOneShotStartTime,
  computeScheduledStartTime,
} from '../ChordEventComputationPolicy';

describe('ChordEventComputationPolicy', () => {
  it('computes effective velocity using jitter from humanize', () => {
    const getVelocityJitter = jest.fn(() => 5);
    const toEffectiveVelocity = jest.fn(() => 92);

    const velocity = computeEffectiveVelocity({
      velocity: 90,
      velocityScale: 0.8,
      humanize: 0.6,
      getVelocityJitter,
      toEffectiveVelocity,
    });

    expect(velocity).toBe(92);
    expect(getVelocityJitter).toHaveBeenCalledWith(0.6);
    expect(toEffectiveVelocity).toHaveBeenCalledWith({
      velocity: 90,
      velocityScale: 0.8,
      velocityJitter: 5,
    });
  });

  it('computes scheduled start time according to timing mode', () => {
    expect(
      computeScheduledStartTime({ eventTime: 10, timingOffset: -0.03, symmetricTiming: true }),
    ).toBe(9.97);
    expect(
      computeScheduledStartTime({ eventTime: 10, timingOffset: 0.04, symmetricTiming: false }),
    ).toBe(10.04);
    expect(
      computeScheduledStartTime({ eventTime: 10, timingOffset: -0.04, symmetricTiming: false }),
    ).toBe(10);
  });

  it('computes one-shot relative start string only for positive delays', () => {
    expect(computeOneShotStartTime(0.02)).toBe('+0.02');
    expect(computeOneShotStartTime(0)).toBeUndefined();
    expect(computeOneShotStartTime(-0.02)).toBeUndefined();
  });
});
