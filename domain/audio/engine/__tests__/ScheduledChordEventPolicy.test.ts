jest.mock('../ChordTrigger', () => ({
  triggerChordByStyle: jest.fn(),
}));

import { triggerScheduledChordEvent } from '../ScheduledChordEventPolicy';
import { triggerChordByStyle } from '../ChordTrigger';

describe('ScheduledChordEventPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies symmetric timing offset when non-zero', () => {
    const getTimingOffset = jest.fn(() => -0.03);
    const getVelocityJitter = jest.fn(() => 4);
    const toEffectiveVelocity = jest.fn(() => 99);

    triggerScheduledChordEvent({
      style: 'strum',
      instrument: {} as never,
      notes: ['C4', 'E4'],
      duration: 1,
      eventTime: 10,
      velocity: 100,
      humanize: 0.6,
      symmetricTiming: true,
      getTimingOffset,
      getVelocityJitter,
      toEffectiveVelocity,
    });

    expect(triggerChordByStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: 9.97,
        velocity: 99,
      }),
    );
    expect(getTimingOffset).toHaveBeenCalledWith({ humanize: 0.6, symmetric: true });
  });

  it('keeps event time when positive timing mode yields zero offset', () => {
    const getTimingOffset = jest.fn(() => 0);

    triggerScheduledChordEvent({
      style: 'block',
      instrument: {} as never,
      notes: ['C4'],
      duration: 1,
      eventTime: 4,
      velocity: 90,
      velocityScale: 0.8,
      humanize: 0.4,
      symmetricTiming: false,
      getTimingOffset,
      getVelocityJitter: () => 2,
      toEffectiveVelocity: () => 72,
    });

    expect(triggerChordByStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: 4,
        velocity: 72,
      }),
    );
  });

  it('skips trigger when there are no notes', () => {
    triggerScheduledChordEvent({
      style: 'block',
      instrument: {} as never,
      notes: [],
      duration: 1,
      eventTime: 4,
      humanize: 0,
      symmetricTiming: false,
      getTimingOffset: () => 0,
      getVelocityJitter: () => 0,
      toEffectiveVelocity: () => undefined,
    });

    expect(triggerChordByStyle).not.toHaveBeenCalled();
  });
});
