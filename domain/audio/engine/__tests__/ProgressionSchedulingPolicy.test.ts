import {
  buildChordPatternScheduledEvents,
  buildProgressionScheduledEvents,
  getBarDurationSeconds,
} from '../ProgressionSchedulingPolicy';

describe('ProgressionSchedulingPolicy', () => {
  it('filters progression events to the in-chord beat window', () => {
    const voicings = [
      { leftHand: ['C3'], rightHand: ['E4', 'G4'] },
      { leftHand: ['F3'], rightHand: ['A4', 'C5'] },
    ];

    const events = buildProgressionScheduledEvents({
      voicings,
      padPattern: 'quarter-pulse',
      timeSignature: '4/4',
      singleBeatSeconds: 0.5,
      chordDurationSeconds: 2,
    });

    expect(events).toHaveLength(4);
    expect(events.map((event) => event.time)).toEqual([0, 0.5, 2, 2.5]);
    expect(events[0].voicing).toBe(voicings[0]);
    expect(events[3].voicing).toBe(voicings[1]);
  });

  it('builds chord pattern events for all beats in the selected pattern', () => {
    const events = buildChordPatternScheduledEvents({
      padPattern: 'offbeat-stab',
      timeSignature: '4/4',
      singleBeatSeconds: 0.5,
    });

    expect(events).toEqual([
      { time: 0.5, velocityScale: 1 },
      { time: 1.5, velocityScale: 1 },
    ]);
  });

  it('computes bar duration by time signature beat count', () => {
    expect(getBarDurationSeconds('4/4', 0.5)).toBe(2);
    expect(getBarDurationSeconds('3/4', 0.5)).toBe(1.5);
    expect(getBarDurationSeconds('6/8', 0.5)).toBe(1.5);
  });
});
