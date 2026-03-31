jest.mock('../ChordTrigger', () => ({
  triggerChordByStyle: jest.fn(),
}));

import { triggerChordByStyle } from '../ChordTrigger';
import { triggerOneShotChordEvent } from '../OneShotChordEventPolicy';

describe('OneShotChordEventPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses positive delay as relative start time string', () => {
    triggerOneShotChordEvent({
      style: 'strum',
      instrument: {} as never,
      notes: ['C4', 'E4'],
      duration: 1,
      velocity: 98,
      humanize: 0.7,
      getTimingOffset: () => 0.024,
      getVelocityJitter: () => 3,
      toEffectiveVelocity: () => 96,
    });

    expect(triggerChordByStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: '+0.024',
        velocity: 96,
      }),
    );
  });

  it('omits start time when delay is zero or negative', () => {
    triggerOneShotChordEvent({
      style: 'block',
      instrument: {} as never,
      notes: ['C4'],
      duration: 1,
      humanize: 0.2,
      getTimingOffset: () => -0.01,
      getVelocityJitter: () => 0,
      toEffectiveVelocity: () => 80,
    });

    expect(triggerChordByStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: undefined,
        velocity: 80,
      }),
    );
  });

  it('does nothing when there are no notes', () => {
    triggerOneShotChordEvent({
      style: 'strum',
      instrument: {} as never,
      notes: [],
      duration: 1,
      humanize: 0,
      getTimingOffset: () => 0,
      getVelocityJitter: () => 0,
      toEffectiveVelocity: () => undefined,
    });

    expect(triggerChordByStyle).not.toHaveBeenCalled();
  });
});
