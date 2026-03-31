type PlaybackTimeoutState = {
  getScheduledPlaybackTimeouts: () => ReturnType<typeof setTimeout>[];
  setScheduledPlaybackTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
};

type SchedulePlaybackCleanupTimeoutParams = PlaybackTimeoutState & {
  cleanupDelayMs: number;
  stopAllAudio: () => void;
};

export const schedulePlaybackCleanupTimeout = ({
  cleanupDelayMs,
  stopAllAudio,
  getScheduledPlaybackTimeouts,
  setScheduledPlaybackTimeouts,
}: SchedulePlaybackCleanupTimeoutParams): ReturnType<typeof setTimeout> => {
  const cleanupTimeout = setTimeout(() => {
    stopAllAudio();
  }, cleanupDelayMs);

  setScheduledPlaybackTimeouts([...getScheduledPlaybackTimeouts(), cleanupTimeout]);
  return cleanupTimeout;
};
