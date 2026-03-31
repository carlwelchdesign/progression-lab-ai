export type SchedulablePart = {
  start: (time: number) => void;
  loop: boolean | number;
  loopStart: unknown;
  loopEnd: unknown;
  dispose: () => void;
};

export type SchedulableLoop = {
  start: (time: number) => void;
  setInterval: (interval: number) => void;
  dispose: () => void;
};

export type AudioTimelineState = {
  getScheduledPlaybackTimeouts: () => ReturnType<typeof setTimeout>[];
  setScheduledPlaybackTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  getActiveMetronomePulseTimeouts: () => ReturnType<typeof setTimeout>[];
  setActiveMetronomePulseTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  getActivePart: () => SchedulablePart | null;
  setActivePart: (part: SchedulablePart | null) => void;
  getMetronomeLoop: () => SchedulableLoop | null;
  setMetronomeLoop: (loop: SchedulableLoop | null) => void;
  getMetronomeClickBeat: () => number;
  setMetronomeClickBeat: (beat: number) => void;
};

export const createAudioTimelineState = (): AudioTimelineState => {
  let scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[] = [];
  let activeMetronomePulseTimeouts: ReturnType<typeof setTimeout>[] = [];
  let activePart: SchedulablePart | null = null;
  let metronomeLoop: SchedulableLoop | null = null;
  let metronomeClickBeat = 0;

  return {
    getScheduledPlaybackTimeouts: () => scheduledPlaybackTimeouts,
    setScheduledPlaybackTimeouts: (timeouts) => {
      scheduledPlaybackTimeouts = timeouts;
    },
    getActiveMetronomePulseTimeouts: () => activeMetronomePulseTimeouts,
    setActiveMetronomePulseTimeouts: (timeouts) => {
      activeMetronomePulseTimeouts = timeouts;
    },
    getActivePart: () => activePart,
    setActivePart: (part) => {
      activePart = part;
    },
    getMetronomeLoop: () => metronomeLoop,
    setMetronomeLoop: (loop) => {
      metronomeLoop = loop;
    },
    getMetronomeClickBeat: () => metronomeClickBeat,
    setMetronomeClickBeat: (beat) => {
      metronomeClickBeat = beat;
    },
  };
};
