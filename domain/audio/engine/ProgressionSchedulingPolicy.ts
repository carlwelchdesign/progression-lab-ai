import { getPadPatternBeats, TIME_SIGNATURE_BEATS_PER_BAR } from '../../music/padPattern';
import type { PadPattern, TimeSignature } from '../../music/padPattern';
import { CHORD_BEATS } from './AudioMath';
import type { ProgressionVoicing } from '../audioEngine';

type BuildProgressionEventsParams = {
  voicings: ProgressionVoicing[];
  padPattern: PadPattern;
  timeSignature: TimeSignature;
  singleBeatSeconds: number;
  chordDurationSeconds: number;
};

type BuildChordPatternEventsParams = {
  padPattern: PadPattern;
  timeSignature: TimeSignature;
  singleBeatSeconds: number;
};

export type ProgressionScheduledEvent = {
  time: number;
  voicing: ProgressionVoicing;
  velocityScale: number;
};

export type ChordPatternScheduledEvent = {
  time: number;
  velocityScale: number;
};

export const buildProgressionScheduledEvents = ({
  voicings,
  padPattern,
  timeSignature,
  singleBeatSeconds,
  chordDurationSeconds,
}: BuildProgressionEventsParams): ProgressionScheduledEvent[] => {
  const inChordPatternBeats = getPadPatternBeats(padPattern, timeSignature).filter(
    (beat) => beat.offsetBeats < CHORD_BEATS,
  );

  return voicings.flatMap((voicing, index) =>
    inChordPatternBeats.map((beat) => ({
      time: index * chordDurationSeconds + beat.offsetBeats * singleBeatSeconds,
      voicing,
      velocityScale: beat.velocityScale,
    })),
  );
};

export const buildChordPatternScheduledEvents = ({
  padPattern,
  timeSignature,
  singleBeatSeconds,
}: BuildChordPatternEventsParams): ChordPatternScheduledEvent[] => {
  return getPadPatternBeats(padPattern, timeSignature).map((beat) => ({
    time: beat.offsetBeats * singleBeatSeconds,
    velocityScale: beat.velocityScale,
  }));
};

export const getBarDurationSeconds = (
  timeSignature: TimeSignature,
  singleBeatSeconds: number,
): number => {
  return TIME_SIGNATURE_BEATS_PER_BAR[timeSignature] * singleBeatSeconds;
};
