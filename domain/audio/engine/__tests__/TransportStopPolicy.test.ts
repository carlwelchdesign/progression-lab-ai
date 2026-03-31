import { applyTransportStopPolicy } from '../TransportStopPolicy';

describe('TransportStopPolicy', () => {
  it('handles missing disposable resources and still clears/release', () => {
    const scheduledPlaybackTimeouts = [setTimeout(() => undefined, 5)];
    const activeMetronomePulseTimeouts = [setTimeout(() => undefined, 5)];

    const setScheduledPlaybackTimeouts = jest.fn();
    const setActiveMetronomePulseTimeouts = jest.fn();
    const setActivePart = jest.fn();
    const setMetronomeLoop = jest.fn();
    const setMetronomeClickBeat = jest.fn();
    const stopTransport = jest.fn();
    const cancelTransport = jest.fn();
    const releaseInstrumentSamplers = jest.fn();
    const releaseMetronomeSynths = jest.fn();

    applyTransportStopPolicy({
      scheduledPlaybackTimeouts,
      setScheduledPlaybackTimeouts,
      activeMetronomePulseTimeouts,
      setActiveMetronomePulseTimeouts,
      activePart: null,
      setActivePart,
      metronomeLoop: null,
      setMetronomeLoop,
      setMetronomeClickBeat,
      stopTransport,
      cancelTransport,
      releaseInstrumentSamplers,
      releaseMetronomeSynths,
    });

    expect(setScheduledPlaybackTimeouts).toHaveBeenCalledWith([]);
    expect(setActiveMetronomePulseTimeouts).toHaveBeenCalledWith([]);
    expect(setActivePart).not.toHaveBeenCalled();
    expect(setMetronomeLoop).not.toHaveBeenCalled();
    expect(setMetronomeClickBeat).not.toHaveBeenCalled();
    expect(stopTransport).toHaveBeenCalledTimes(1);
    expect(cancelTransport).toHaveBeenCalledTimes(1);
    expect(releaseInstrumentSamplers).toHaveBeenCalledTimes(1);
    expect(releaseMetronomeSynths).toHaveBeenCalledTimes(1);
  });
});
