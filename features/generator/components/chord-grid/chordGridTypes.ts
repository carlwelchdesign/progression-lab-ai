import type {
  PlaybackSettings,
  PlaybackSettingsChangeHandlers,
} from '../../lib/playbackSettingsModel';
import type { ArrangementEvent, VocalFeatureEntitlements } from '../../../../lib/types';

/**
 * Render-ready chord data for each playable grid pad.
 */
export type ChordGridEntry = {
  key: string;
  chord: string;
  source: string;
  leftHand: string[];
  rightHand: string[];
};

export type RecordingMode = 'continuous' | 'single-shot';

export type PendingArrangementLoad = {
  /** Unique value that changes each time a load is triggered (use arrangement id or a counter). */
  key: string;
  events: ArrangementEvent[];
  loopLengthBars: number;
};

export type GeneratedChordGridDialogProps = {
  open: boolean;
  onClose: () => void;
  tempoBpm: number;
  settings: PlaybackSettings;
  onSettingsChange: PlaybackSettingsChangeHandlers;
  onTempoBpmChange: (value: number) => void;
  chords: ChordGridEntry[];
  /** When non-null, the dialog seeds its timeline from this value on mount / key change. */
  pendingLoad?: PendingArrangementLoad | null;
  /** Called after an arrangement is successfully saved, so callers can refresh lists. */
  onSaveSuccess?: () => void;
  vocalEntitlements?: VocalFeatureEntitlements;
};

export const STEPS_PER_BEAT = 4;
export const RECORDING_LEAD_IN_BARS = 1;
export const TOUCH_LONG_PRESS_MS = 360;
export const TOUCH_MOVE_CANCEL_THRESHOLD_PX = 14;
export const LOOP_LENGTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const PAD_TRIGGER_KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
] as const;
