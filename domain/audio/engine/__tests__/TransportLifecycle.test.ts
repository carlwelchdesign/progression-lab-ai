jest.mock('tone', () => ({
  context: { state: 'running' },
  start: jest.fn().mockResolvedValue(undefined),
  Transport: {
    stop: jest.fn(),
    cancel: jest.fn(),
  },
}));

import { stopAllAudioPlayback } from '../TransportLifecycle';

describe('TransportLifecycle', () => {
  it('clears state and releases sources on stop', () => {
    const scheduledPlaybackTimeouts = [setTimeout(() => undefined, 5), setTimeout(() => undefined, 5)];
    const activeMetronomePulseTimeouts = [setTimeout(() => undefined, 5)];

    const setScheduledPlaybackTimeouts = jest.fn();
    const setActiveMetronomePulseTimeouts = jest.fn();
    const setActivePart = jest.fn();
    const setMetronomeLoop = jest.fn();
    const setMetronomeClickBeat = jest.fn();
    const releaseInstrumentSamplers = jest.fn();
    const releaseMetronomeSynths = jest.fn();

    const activePart = { dispose: jest.fn() };
    const metronomeLoop = { dispose: jest.fn() };

    stopAllAudioPlayback({
      scheduledPlaybackTimeouts,
      setScheduledPlaybackTimeouts,
      activeMetronomePulseTimeouts,
      setActiveMetronomePulseTimeouts,
      activePart: activePart as never,
      setActivePart,
      metronomeLoop: metronomeLoop as never,
      setMetronomeLoop,
      setMetronomeClickBeat,
      releaseInstrumentSamplers,
      releaseMetronomeSynths,
    });

    expect(setScheduledPlaybackTimeouts).toHaveBeenCalledWith([]);
    expect(setActiveMetronomePulseTimeouts).toHaveBeenCalledWith([]);
    expect(activePart.dispose).toHaveBeenCalledTimes(1);
    expect(setActivePart).toHaveBeenCalledWith(null);
    expect(metronomeLoop.dispose).toHaveBeenCalledTimes(1);
    expect(setMetronomeLoop).toHaveBeenCalledWith(null);
    expect(setMetronomeClickBeat).toHaveBeenCalledWith(0);
    expect(releaseInstrumentSamplers).toHaveBeenCalledTimes(1);
    expect(releaseMetronomeSynths).toHaveBeenCalledTimes(1);
  });
});
