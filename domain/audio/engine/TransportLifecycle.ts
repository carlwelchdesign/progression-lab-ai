import * as Tone from 'tone';

export type StopAllAudioParams = {
  scheduledPlaybackTimeouts: ReturnType<typeof setTimeout>[];
  setScheduledPlaybackTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  activeMetronomePulseTimeouts: ReturnType<typeof setTimeout>[];
  setActiveMetronomePulseTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
  activePart: Tone.Part | null;
  setActivePart: (part: Tone.Part | null) => void;
  metronomeLoop: Tone.Loop | null;
  setMetronomeLoop: (loop: Tone.Loop | null) => void;
  setMetronomeClickBeat: (beat: number) => void;
  releaseInstrumentSamplers: () => void;
  releaseMetronomeSynths: () => void;
};

export const ensureAudioStarted = async (): Promise<void> => {
  if (Tone.context.state !== 'running') {
    await Tone.start();
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
}: StopAllAudioParams): void => {
  scheduledPlaybackTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  setScheduledPlaybackTimeouts([]);
  activeMetronomePulseTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  setActiveMetronomePulseTimeouts([]);

  Tone.Transport.stop();
  Tone.Transport.cancel();

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
