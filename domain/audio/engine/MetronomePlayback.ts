import * as Tone from 'tone';
import type { MetronomeSource, PlayMetronomePulseOptions } from '../audioEngine';
import type { TimeSignature } from '../../music/padPattern';
import { TIME_SIGNATURE_BEATS_PER_BAR } from '../../music/padPattern';
import {
  clampUnitValue,
  getBeatDurationSeconds,
  inferFallbackDrumDurationBeats,
  normalizeTempoBpm,
} from './AudioMath';
import type { DrumPattern } from './DrumPatternRepository';
import type { MetronomeSynthBank } from './MetronomeSynthBank';

type LoopState = {
  getMetronomeLoop: () => Tone.Loop | null;
  setMetronomeLoop: (loop: Tone.Loop | null) => void;
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
}: CreateMetronomePlaybackParams): MetronomePlayback => {
  const triggerClickPulse = ({
    volume,
    isDownbeat,
    time,
  }: {
    volume: number;
    isDownbeat: boolean;
    time: number;
  }): void => {
    const synth = synthBank.getClickSynth();
    synth.volume.value = volume > 0 ? Tone.gainToDb(volume * 0.45) : -Infinity;
    synth.triggerAttackRelease(isDownbeat ? 'C6' : 'A5', '32n', time);
  };

  const playDrumPulse = async ({
    volume,
    isDownbeat,
    drumPath,
    timeSignature,
    tempoBpm,
    beatIndex,
  }: {
    volume: number;
    isDownbeat: boolean;
    drumPath: string | null;
    timeSignature: TimeSignature;
    tempoBpm?: number;
    beatIndex: number;
  }): Promise<boolean> => {
    if (!drumPath) {
      return false;
    }

    const pattern = await loadPattern(drumPath);
    if (!pattern) {
      return false;
    }

    const tempo = normalizeTempoBpm(tempoBpm);
    const beatDurationSeconds = getBeatDurationSeconds(tempo);
    const safeBeatIndex = Math.max(0, beatIndex);
    const patternDuration = Math.max(
      pattern.durationBeats,
      inferFallbackDrumDurationBeats(timeSignature),
    );
    const beatStartInPattern = safeBeatIndex % patternDuration;
    const now = Tone.now();

    pattern.events.forEach((event) => {
      const eventBeatInPattern =
        ((event.beat % patternDuration) + patternDuration) % patternDuration;
      if (eventBeatInPattern < beatStartInPattern || eventBeatInPattern >= beatStartInPattern + 1) {
        return;
      }

      const offsetBeats = eventBeatInPattern - beatStartInPattern;
      const eventTime = now + offsetBeats * beatDurationSeconds;
      const eventDurationSeconds = Math.max(0.02, event.durationBeats * beatDurationSeconds);
      synthBank.triggerDrumHit(
        event.midi,
        eventTime,
        eventDurationSeconds,
        event.velocity * volume,
      );
    });

    return true;
  };

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
      triggerClickPulse({ volume: normalizedVolume, isDownbeat, time: Tone.now() });
      return;
    }

    const drumPath = normalizeDrumPatternPath(opts?.drumPath);
    const played = await playDrumPulse({
      volume: normalizedVolume,
      isDownbeat,
      drumPath,
      timeSignature: opts?.timeSignature ?? '4/4',
      tempoBpm: opts?.tempoBpm,
      beatIndex: opts?.beatIndex ?? 0,
    });

    if (!played) {
      triggerClickPulse({ volume: normalizedVolume, isDownbeat, time: Tone.now() });
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

    const metronomeLoop = new Tone.Loop((time) => {
      const currentBeat = loopState.getMetronomeClickBeat();
      if (currentBeat >= totalBeats) {
        return;
      }

      const isDownbeat = currentBeat % beatsPerBar === 0;
      if (source === 'click') {
        triggerClickPulse({ volume, isDownbeat, time });
      } else {
        const beatIndex = currentBeat;
        const delayMs = Math.max(0, (time - Tone.now()) * 1000);
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
