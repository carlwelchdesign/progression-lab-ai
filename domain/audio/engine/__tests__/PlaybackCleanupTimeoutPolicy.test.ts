import { schedulePlaybackCleanupTimeout } from '../PlaybackCleanupTimeoutPolicy';

describe('PlaybackCleanupTimeoutPolicy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('appends timeout id and triggers stop callback after delay', () => {
    const timeoutState: ReturnType<typeof setTimeout>[] = [];
    const stopAllAudio = jest.fn();

    const timeoutId = schedulePlaybackCleanupTimeout({
      cleanupDelayMs: 120,
      stopAllAudio,
      getScheduledPlaybackTimeouts: () => timeoutState,
      setScheduledPlaybackTimeouts: (timeouts) => {
        timeoutState.splice(0, timeoutState.length, ...timeouts);
      },
    });

    expect(timeoutState).toContain(timeoutId);
    expect(stopAllAudio).not.toHaveBeenCalled();

    jest.advanceTimersByTime(120);

    expect(stopAllAudio).toHaveBeenCalledTimes(1);
  });

  it('preserves existing timeout entries when adding cleanup timeout', () => {
    const existingTimeout = setTimeout(() => undefined, 500);
    const timeoutState: ReturnType<typeof setTimeout>[] = [existingTimeout];

    schedulePlaybackCleanupTimeout({
      cleanupDelayMs: 80,
      stopAllAudio: jest.fn(),
      getScheduledPlaybackTimeouts: () => timeoutState,
      setScheduledPlaybackTimeouts: (timeouts) => {
        timeoutState.splice(0, timeoutState.length, ...timeouts);
      },
    });

    expect(timeoutState[0]).toBe(existingTimeout);
    expect(timeoutState).toHaveLength(2);
  });
});
