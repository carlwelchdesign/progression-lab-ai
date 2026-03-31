type DisposableResource = {
  dispose: () => void;
};

export type TransportStopPolicyParams = {
  scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[];
  setScheduledPlaybackTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  activeMetronomePulseTimeouts: ReturnType<typeof setTimeout>[];
  setActiveMetronomePulseTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  activePart: DisposableResource | null;
  setActivePart: (part: null) => void;
  metronomeLoop: DisposableResource | null;
  setMetronomeLoop: (loop: null) => void;
  setMetronomeClickBeat: (beat: number) => void;
  stopTransport: () => void;
  cancelTransport: () => void;
  releaseInstrumentSamplers: () => void;
  releaseMetronomeSynths: () => void;
};

const clearTimeoutGroup = (
  timeoutIds: ReturnType<typeof setTimeout>[],
  setTimeoutIds: (timeouts: ReturnType<typeof setTimeout>[]) => void,
): void => {
  timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  setTimeoutIds([]);
};

export const applyTransportStopPolicy = ({
  scheduledPlaybackTimeouts,
  setScheduledPlaybackTimeouts,
  activeMetronomePulseTimeouts,
  setActiveMetronomePulseTimeouts,
  activePart,
  setActivePart,
  metronomeLoop,
  setMetronomeLoop,
  setMetronomeClickBeat,
  stopTransport,
  cancelTransport,
  releaseInstrumentSamplers,
  releaseMetronomeSynths,
}: TransportStopPolicyParams): void => {
  clearTimeoutGroup(scheduledPlaybackTimeouts, setScheduledPlaybackTimeouts);
  clearTimeoutGroup(activeMetronomePulseTimeouts, setActiveMetronomePulseTimeouts);

  stopTransport();
  cancelTransport();

  if (activePart) {
    activePart.dispose();
    setActivePart(null);
  }

  if (metronomeLoop) {
    metronomeLoop.dispose();
    setMetronomeLoop(null);
    setMetronomeClickBeat(0);
  }

  releaseInstrumentSamplers();
  releaseMetronomeSynths();
};
