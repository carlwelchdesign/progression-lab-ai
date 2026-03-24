import type { AudioInstrument, PlaybackRegister, PlaybackStyle } from '../../lib/audio';
import type { PadPattern, TimeSignature } from '../../lib/audio';
import { PAD_PATTERN_LABELS, TIME_SIGNATURE_LABELS } from '../../lib/audio';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import type { PlaybackSettings, PlaybackSettingsChangeHandlers } from './playbackSettingsModel';

export type EffectId = 'reverb' | 'chorus' | 'tremolo' | 'feedbackDelay' | 'vibrato' | 'phaser';

export type EffectSliderConfig = {
  label: string;
  valueText: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
};

export type EffectConfig = {
  id: EffectId;
  title: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  level: number;
  onLevelChange: (value: number) => void;
  levelAriaLabel: string;
  sliders: EffectSliderConfig[];
};

export type SliderRowConfig = {
  key: string;
  label: string;
  valueText: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
};

type ToggleOption<T extends string> = {
  value: T;
  label: string;
  ariaLabel: string;
};

type SettingsButtonPosition = 'inline' | 'modal';

export const OCTAVE_SHIFT_MARKS = [
  { value: -3, label: '-3' },
  { value: 0, label: '0' },
  { value: 3, label: '+3' },
] as const;

export const OCTAVE_SHIFT_RANGE = {
  min: -3,
  max: 3,
  step: 1,
} as const;

export const TEMPO_RANGE = {
  min: 40,
  max: 240,
  step: 1,
} as const;

export const GATE_RANGE = {
  min: 0,
  max: 1,
  step: 0.01,
} as const;

export const PLAYBACK_SETTINGS_COPY = {
  dialogTitle: 'Playback Settings',
  triggerButtonLabel: 'Settings',
  instrumentLabel: 'Instrument',
  octaveShiftLabel: 'Octave shift',
  octaveShiftHelp:
    'Transposes all notes by octaves. Positive values shift higher, negative values shift lower.',
  inversionLockLabel: 'Inversion lock',
  inversionLockHelp:
    'Shifts chord notes to stay in the chosen register using nearest-octave voice leading.',
  playbackStyleLabel: 'Playback style',
  tempoLabel: 'Tempo',
  tempoAriaLabel: 'Tempo in BPM',
  padsLabel: 'Pads',
  envelopeLabel: 'Envelope',
  gateLabel: 'Gate',
  gateAriaLabel: 'Gate (note length)',
  latchModeLabel: 'Latch mode',
  padPatternLabel: 'Pad pattern',
  timeSignatureLabel: 'Time signature',
  metronomeLabel: 'Metronome',
  metronomeAriaLabel: 'Enable metronome click',
  metronomeVolumeLabel: 'Click volume',
  metronomeVolumeAriaLabel: 'Metronome click volume',
  effectsLabel: 'Effects',
  closeButtonLabel: 'Close',
  testSoundButtonLabel: 'Test sound',
} as const;

/**
 * Formats the gate ratio into a user-facing label.
 */
export const formatGateLabel = (gate: number): string => {
  if (gate === 0) {
    return 'staccato';
  }

  if (gate === 1) {
    return 'sustained';
  }

  return `${Math.round(gate * 100)}%`;
};

export const getSettingsTriggerButtonSx = (position: SettingsButtonPosition): SxProps<Theme> => ({
  borderWidth: 1.5,
  color: (theme) => theme.palette.primary.main,
  borderColor: (theme) => alpha(theme.palette.primary.main, 0.9),
  backgroundColor:
    position === 'inline'
      ? (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.5)'
      : 'transparent',
  textTransform: 'none',
  fontWeight: 600,
  backdropFilter: position === 'inline' ? 'blur(10px)' : 'none',
  WebkitBackdropFilter: position === 'inline' ? 'blur(10px)' : 'none',
  '&:hover': {
    borderColor: (theme) => theme.palette.primary.main,
    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
    borderWidth: 1.5,
  },
});

export const INSTRUMENT_OPTIONS: ReadonlyArray<{ value: AudioInstrument; label: string }> = [
  { value: 'piano', label: 'Piano' },
  { value: 'rhodes', label: 'Rhodes' },
];

export const INVERSION_OPTIONS: ToggleOption<PlaybackRegister>[] = [
  { value: 'off', label: 'Off', ariaLabel: 'Off' },
  { value: 'low', label: 'Low', ariaLabel: 'Low register (C2-B3)' },
  { value: 'mid', label: 'Mid', ariaLabel: 'Mid register (C3-B4)' },
  { value: 'high', label: 'High', ariaLabel: 'High register (C4-B5)' },
];

export const PLAYBACK_STYLE_OPTIONS: ToggleOption<PlaybackStyle>[] = [
  { value: 'strum', label: 'Strum', ariaLabel: 'Strum playback' },
  { value: 'block', label: 'Block', ariaLabel: 'Block playback' },
];

export const PAD_PATTERN_OPTIONS: ReadonlyArray<{ value: PadPattern; label: string }> = (
  Object.entries(PAD_PATTERN_LABELS) as Array<[PadPattern, string]>
).map(([value, label]) => ({ value, label }));

export const TIME_SIGNATURE_OPTIONS: ToggleOption<TimeSignature>[] = (
  Object.entries(TIME_SIGNATURE_LABELS) as Array<[TimeSignature, string]>
).map(([value, label]) => ({ value, label, ariaLabel: `${label} time signature` }));

/**
 * Builds the card/advanced slider configuration for all effect controls.
 */
export const createEffectConfigs = (
  settings: PlaybackSettings,
  onChange: PlaybackSettingsChangeHandlers,
): EffectConfig[] => {
  const {
    reverb,
    reverbEnabled,
    chorus,
    chorusEnabled,
    chorusRate,
    chorusDepth,
    chorusDelayTime,
    feedbackDelayEnabled,
    feedbackDelay,
    feedbackDelayTime,
    feedbackDelayFeedback,
    tremoloEnabled,
    tremolo,
    tremoloFrequency,
    tremoloDepth,
    vibratoEnabled,
    vibrato,
    vibratoFrequency,
    vibratoDepth,
    phaserEnabled,
    phaser,
    phaserFrequency,
    phaserOctaves,
    phaserQ,
    roomSize,
  } = settings;

  const {
    onReverbChange,
    onReverbEnabledChange,
    onChorusChange,
    onChorusEnabledChange,
    onChorusRateChange,
    onChorusDepthChange,
    onChorusDelayTimeChange,
    onFeedbackDelayEnabledChange,
    onFeedbackDelayChange,
    onFeedbackDelayTimeChange,
    onFeedbackDelayFeedbackChange,
    onTremoloEnabledChange,
    onTremoloChange,
    onTremoloFrequencyChange,
    onTremoloDepthChange,
    onVibratoEnabledChange,
    onVibratoChange,
    onVibratoFrequencyChange,
    onVibratoDepthChange,
    onPhaserEnabledChange,
    onPhaserChange,
    onPhaserFrequencyChange,
    onPhaserOctavesChange,
    onPhaserQChange,
    onRoomSizeChange,
  } = onChange;

  return [
    {
      id: 'reverb',
      title: 'Reverb',
      enabled: reverbEnabled,
      onEnabledChange: onReverbEnabledChange,
      level: reverb,
      onLevelChange: onReverbChange,
      levelAriaLabel: 'Reverb level',
      sliders: [
        {
          label: 'Room size',
          valueText: `${Math.round(roomSize * 100)}%`,
          value: roomSize,
          onChange: onRoomSizeChange,
          min: 0,
          max: 1,
          step: 0.01,
          ariaLabel: 'Reverb room size',
        },
      ],
    },
    {
      id: 'chorus',
      title: 'Chorus',
      enabled: chorusEnabled,
      onEnabledChange: onChorusEnabledChange,
      level: chorus,
      onLevelChange: onChorusChange,
      levelAriaLabel: 'Chorus level',
      sliders: [
        {
          label: 'Rate',
          valueText: `${chorusRate.toFixed(1)} Hz`,
          value: chorusRate,
          onChange: onChorusRateChange,
          min: 0.1,
          max: 8,
          step: 0.1,
          ariaLabel: 'Chorus rate',
        },
        {
          label: 'Depth',
          valueText: `${Math.round(chorusDepth * 100)}%`,
          value: chorusDepth,
          onChange: onChorusDepthChange,
          min: 0,
          max: 1,
          step: 0.01,
          ariaLabel: 'Chorus depth',
        },
        {
          label: 'Delay time',
          valueText: `${chorusDelayTime.toFixed(1)} ms`,
          value: chorusDelayTime,
          onChange: onChorusDelayTimeChange,
          min: 0.1,
          max: 20,
          step: 0.1,
          ariaLabel: 'Chorus delay time',
        },
      ],
    },
    {
      id: 'tremolo',
      title: 'Tremolo',
      enabled: tremoloEnabled,
      onEnabledChange: onTremoloEnabledChange,
      level: tremolo,
      onLevelChange: onTremoloChange,
      levelAriaLabel: 'Tremolo level',
      sliders: [
        {
          label: 'Rate',
          valueText: `${tremoloFrequency.toFixed(1)} Hz`,
          value: tremoloFrequency,
          onChange: onTremoloFrequencyChange,
          min: 0.1,
          max: 20,
          step: 0.1,
          ariaLabel: 'Tremolo rate',
        },
        {
          label: 'Depth',
          valueText: `${Math.round(tremoloDepth * 100)}%`,
          value: tremoloDepth,
          onChange: onTremoloDepthChange,
          min: 0,
          max: 1,
          step: 0.01,
          ariaLabel: 'Tremolo depth',
        },
      ],
    },
    {
      id: 'feedbackDelay',
      title: 'Feedback delay',
      enabled: feedbackDelayEnabled,
      onEnabledChange: onFeedbackDelayEnabledChange,
      level: feedbackDelay,
      onLevelChange: onFeedbackDelayChange,
      levelAriaLabel: 'Feedback delay level',
      sliders: [
        {
          label: 'Delay time',
          valueText: `${feedbackDelayTime.toFixed(2)} s`,
          value: feedbackDelayTime,
          onChange: onFeedbackDelayTimeChange,
          min: 0.01,
          max: 1.5,
          step: 0.01,
          ariaLabel: 'Feedback delay time',
        },
        {
          label: 'Feedback',
          valueText: `${Math.round(feedbackDelayFeedback * 100)}%`,
          value: feedbackDelayFeedback,
          onChange: onFeedbackDelayFeedbackChange,
          min: 0,
          max: 0.95,
          step: 0.01,
          ariaLabel: 'Feedback delay feedback',
        },
      ],
    },
    {
      id: 'vibrato',
      title: 'Vibrato',
      enabled: vibratoEnabled,
      onEnabledChange: onVibratoEnabledChange,
      level: vibrato,
      onLevelChange: onVibratoChange,
      levelAriaLabel: 'Vibrato level',
      sliders: [
        {
          label: 'Frequency',
          valueText: `${vibratoFrequency.toFixed(1)} Hz`,
          value: vibratoFrequency,
          onChange: onVibratoFrequencyChange,
          min: 0.1,
          max: 12,
          step: 0.1,
          ariaLabel: 'Vibrato frequency',
        },
        {
          label: 'Depth',
          valueText: `${Math.round(vibratoDepth * 100)}%`,
          value: vibratoDepth,
          onChange: onVibratoDepthChange,
          min: 0,
          max: 1,
          step: 0.01,
          ariaLabel: 'Vibrato depth',
        },
      ],
    },
    {
      id: 'phaser',
      title: 'Phaser',
      enabled: phaserEnabled,
      onEnabledChange: onPhaserEnabledChange,
      level: phaser,
      onLevelChange: onPhaserChange,
      levelAriaLabel: 'Phaser level',
      sliders: [
        {
          label: 'Frequency',
          valueText: `${phaserFrequency.toFixed(1)} Hz`,
          value: phaserFrequency,
          onChange: onPhaserFrequencyChange,
          min: 0.1,
          max: 8,
          step: 0.1,
          ariaLabel: 'Phaser frequency',
        },
        {
          label: 'Octaves',
          valueText: phaserOctaves.toFixed(1),
          value: phaserOctaves,
          onChange: onPhaserOctavesChange,
          min: 0.1,
          max: 6,
          step: 0.1,
          ariaLabel: 'Phaser octaves',
        },
        {
          label: 'Q',
          valueText: phaserQ.toFixed(1),
          value: phaserQ,
          onChange: onPhaserQChange,
          min: 0.1,
          max: 20,
          step: 0.1,
          ariaLabel: 'Phaser Q',
        },
      ],
    },
  ];
};

/**
 * Builds row configuration for pad-related sliders.
 */
export const createPadSliderConfigs = (
  settings: PlaybackSettings,
  onChange: PlaybackSettingsChangeHandlers,
): SliderRowConfig[] => {
  const { padVelocity, humanize, padSwing } = settings;
  const { onPadVelocityChange, onHumanizeChange, onPadSwingChange } = onChange;

  return [
    {
      key: 'velocity',
      label: 'Velocity',
      valueText: `${Math.round(padVelocity)}`,
      value: padVelocity,
      onChange: onPadVelocityChange,
      min: 20,
      max: 127,
      step: 1,
      ariaLabel: 'Pad velocity',
    },
    {
      key: 'humanize',
      label: 'Humanize',
      valueText: `${Math.round(humanize * 100)}%`,
      value: humanize,
      onChange: onHumanizeChange,
      min: 0,
      max: 1,
      step: 0.01,
      ariaLabel: 'Humanize amount',
    },
    {
      key: 'swing',
      label: 'Swing',
      valueText: `${padSwing}%`,
      value: padSwing,
      onChange: onPadSwingChange,
      min: 0,
      max: 100,
      step: 1,
      ariaLabel: 'Pad swing',
    },
  ];
};
