import { applyTransportStopPolicy } from './TransportStopPolicy';
import type { SchedulablePart, SchedulableLoop } from './AudioTimelineState';

export type EnsureAudioStartedDeps = {
  isContextRunning: () => boolean;
  startContext: () => Promise<void>;
};

export type StopAllAudioParams = {
  scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[];
  setScheduledPlaybackTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  activeMetronomePulseTimeouts: ReturnType<typeof setTimeout>[];
  setActiveMetronomePulseTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  activePart: SchedulablePart | null;
  setActivePart: (part: SchedulablePart | null) => void;
  metronomeLoop: SchedulableLoop | null;
  setMetronomeLoop: (loop: SchedulableLoop | null) => void;
  setMetronomeClickBeat: (beat: number) => void;
  releaseInstrumentSamplers: () => void;
  releaseMetronomeSynths: () => void;
  stopTransport: () => void;
  cancelTransport: () => void;
};

export const ensureAudioStarted = async ({
  isContextRunning,
  startContext,
}: EnsureAudioStartedDeps): Promise<void> => {
  if (!isContextRunning()) {
    await startContext();
  }
};

export const stopAllAudioPlayback = ({
  scheduledPlaybackTimeouts,
  setScheduledPlaybackTimeouts,
  activeMetronomePulseTimeouts,
  setActiveMetronomePulseTimeouts,
  activePart,
  setActivePart,
  metronomeLoop,
  setMetronomeLoop,
  setMetronomeClickBeat,
  releaseInstrumentSamplers,
  releaseMetronomeSynths,
  stopTransport,
  cancelTransport,
}: StopAllAudioParams): void => {
  applyTransportStopPolicy({
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
  });
};
