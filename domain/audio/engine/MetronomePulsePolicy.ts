import * as Tone from 'tone';
import type { TimeSignature } from '../../music/padPattern';
import {
  getBeatDurationSeconds,
  inferFallbackDrumDurationBeats,
  normalizeTempoBpm,
} from './AudioMath';
import type { DrumPattern } from './DrumPatternRepository';
import type { MetronomeSynthBank } from './MetronomeSynthBank';

type PlayDrumPulseParams = {
  volume: number;
  drumPath: string | null;
  timeSignature: TimeSignature;
  tempoBpm?: number;
  beatIndex: number;
};

type TriggerClickPulseParams = {
  volume: number;
  isDownbeat: boolean;
  time: number;
};

type MetronomePulsePolicyDeps = {
  synthBank: MetronomeSynthBank;
  loadPattern: (path: string) => Promise<DrumPattern | null>;
};

export type MetronomePulsePolicy = {
  triggerClickPulse: (params: TriggerClickPulseParams) => void;
  playDrumPulse: (params: PlayDrumPulseParams) => Promise<boolean>;
};

export const createMetronomePulsePolicy = ({
  synthBank,
  loadPattern,
}: MetronomePulsePolicyDeps): MetronomePulsePolicy => {
  const triggerClickPulse = ({ volume, isDownbeat, time }: TriggerClickPulseParams): void => {
    const synth = synthBank.getClickSynth();
    synth.volume.value = volume > 0 ? Tone.gainToDb(volume * 0.45) : -Infinity;
    synth.triggerAttackRelease(isDownbeat ? 'C6' : 'A5', '32n', time);
  };

  const playDrumPulse = async ({
    volume,
    drumPath,
    timeSignature,
    tempoBpm,
    beatIndex,
  }: PlayDrumPulseParams): Promise<boolean> => {
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

  return {
    triggerClickPulse,
    playDrumPulse,
  };
};
