import { applyChordPatternLifecyclePolicy } from '../ChordPatternLifecyclePolicy';

describe('ChordPatternLifecyclePolicy', () => {
  it('configures loop bounds when loop mode is enabled', () => {
    const part = {
      loop: false,
      loopStart: 99,
      loopEnd: 99,
    };
    const scheduleCleanup = jest.fn();

    applyChordPatternLifecyclePolicy({
      loop: true,
      part,
      barDurationSeconds: 2.25,
      scheduleCleanup,
    });

    expect(part.loop).toBe(true);
    expect(part.loopStart).toBe(0);
    expect(part.loopEnd).toBe(2.25);
    expect(scheduleCleanup).not.toHaveBeenCalled();
  });

  it('schedules cleanup with policy padding when loop mode is disabled', () => {
    const part = {
      loop: false,
      loopStart: 0,
      loopEnd: 0,
    };
    const scheduleCleanup = jest.fn();

    applyChordPatternLifecyclePolicy({
      loop: false,
      part,
      barDurationSeconds: 2,
      scheduleCleanup,
    });

    expect(scheduleCleanup).toHaveBeenCalledWith(2150);
    expect(part.loop).toBe(false);
  });
});
