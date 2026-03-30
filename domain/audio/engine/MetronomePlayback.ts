import type { MetronomeSource, PlayMetronomePulseOptions } from '../audioEngine';
import type { TimeSignature } from '../../music/padPattern';
import { TIME_SIGNATURE_BEATS_PER_BAR } from '../../music/padPattern';
import { clampUnitValue, getBeatDurationSeconds } from './AudioMath';
import type { DrumPattern } from './DrumPatternRepository';
import { createMetronomePulsePolicy } from './MetronomePulsePolicy';
import type { MetronomeSynthBank } from './MetronomeSynthBank';
import type { SchedulableLoop } from './AudioTimelineState';

type LoopState = {
  getMetronomeLoop: () => SchedulableLoop | null;
  setMetronomeLoop: (loop: SchedulableLoop | null) => void;
  getMetronomeClickBeat: () => number;
  setMetronomeClickBeat: (beat: number) => void;
  getActiveMetronomePulseTimeouts: () => ReturnType<typeof setTimeout>[];
  setActiveMetronomePulseTimeouts: (timeouts: ReturnType<typeof setTimeout>[]) => void;
};

type CreateMetronomePlaybackParams = {
  startAudio: () => Promise<void>;
  synthBank: MetronomeSynthBank;
  normalizeDrumPatternPath: (path: string | null | undefined) => string | null;
  loadPattern: (path: string) => Promise<DrumPattern | null>;
  loopState: LoopState;
  createLoop: (callback: (time: number) => void, interval: number) => SchedulableLoop;
  getTransportNow: () => number;
};

export type MetronomePlayback = {
  playMetronomePulse: (
    volume: number,
    isDownbeat: boolean,
    opts?: PlayMetronomePulseOptions,
  ) => Promise<void>;
  playMetronomeClick: (volume: number, isDownbeat: boolean) => Promise<void>;
  startMetronomeLoop: (
    tempoBpm: number,
    timeSignature: TimeSignature,
    volume: number,
    totalDurationSeconds: number,
    source: MetronomeSource,
    drumPath: string | null,
  ) => void;
};

export const createMetronomePlayback = ({
  startAudio,
  synthBank,
  normalizeDrumPatternPath,
  loadPattern,
  loopState,
  createLoop,
  getTransportNow,
}: CreateMetronomePlaybackParams): MetronomePlayback => {
  const { triggerClickPulse, playDrumPulse } = createMetronomePulsePolicy({
    synthBank,
    loadPattern,
  });

  const playMetronomePulse = async (
    volume: number,
    isDownbeat: boolean,
    opts?: PlayMetronomePulseOptions,
  ): Promise<void> => {
    await startAudio();

    const source: MetronomeSource = opts?.source ?? 'click';
    const normalizedVolume = clampUnitValue(volume);
    if (normalizedVolume <= 0) {
      return;
    }

    if (source === 'click') {
      triggerClickPulse({ volume: normalizedVolume, isDownbeat, time: getTransportNow() });
      return;
    }

    const drumPath = normalizeDrumPatternPath(opts?.drumPath);
    const played = await playDrumPulse({
      volume: normalizedVolume,
      drumPath,
      timeSignature: opts?.timeSignature ?? '4/4',
      tempoBpm: opts?.tempoBpm,
      beatIndex: opts?.beatIndex ?? 0,
    });

    if (!played) {
      triggerClickPulse({ volume: normalizedVolume, isDownbeat, time: getTransportNow() });
    }
  };

  const playMetronomeClick = async (volume: number, isDownbeat: boolean): Promise<void> => {
    await playMetronomePulse(volume, isDownbeat, { source: 'click' });
  };

  const startMetronomeLoop = (
    tempoBpm: number,
    timeSignature: TimeSignature,
    volume: number,
    totalDurationSeconds: number,
    source: MetronomeSource,
    drumPath: string | null,
  ): void => {
    const singleBeatSeconds = getBeatDurationSeconds(tempoBpm);
    const beatsPerBar = TIME_SIGNATURE_BEATS_PER_BAR[timeSignature];
    const totalBeats = Math.ceil(totalDurationSeconds / singleBeatSeconds);
    loopState.setMetronomeClickBeat(0);

    if (source === 'drum' && drumPath) {
      void loadPattern(drumPath);
    }

    const metronomeLoop = createLoop((time) => {
      const currentBeat = loopState.getMetronomeClickBeat();
      if (currentBeat >= totalBeats) {
        return;
      }

      const isDownbeat = currentBeat % beatsPerBar === 0;
      if (source === 'click') {
        triggerClickPulse({ volume, isDownbeat, time });
      } else {
        const beatIndex = currentBeat;
        const delayMs = Math.max(0, (time - getTransportNow()) * 1000);
        const timeoutId = setTimeout(() => {
          loopState.setActiveMetronomePulseTimeouts(
            loopState.getActiveMetronomePulseTimeouts().filter((id) => id !== timeoutId),
          );
          void playMetronomePulse(volume, isDownbeat, {
            source,
            drumPath,
            timeSignature,
            tempoBpm,
            beatIndex,
          });
        }, delayMs);

        loopState.setActiveMetronomePulseTimeouts([
          ...loopState.getActiveMetronomePulseTimeouts(),
          timeoutId,
        ]);
      }

      loopState.setMetronomeClickBeat(currentBeat + 1);
    }, singleBeatSeconds);

    loopState.setMetronomeLoop(metronomeLoop);
    metronomeLoop.start(0);
  };

  return {
    playMetronomePulse,
    playMetronomeClick,
    startMetronomeLoop,
  };
};
