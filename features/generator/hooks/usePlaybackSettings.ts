'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { applyAudioEffectsState } from '../../../domain/audio/audio';
import {
  DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT,
  PLAYBACK_SETTINGS_DEFAULTS,
  type PlaybackSettings,
  type PlaybackSettingsChangeHandlers,
  type PlaybackSettingsSetters,
} from '../lib/playbackSettingsModel';

type UsePlaybackSettingsResult = {
  settings: PlaybackSettings;
  changeHandlers: PlaybackSettingsChangeHandlers;
  setters: PlaybackSettingsSetters;
};

/**
 * Owns playback settings state and keeps the audio engine synchronized with UI changes.
 */
export default function usePlaybackSettings(): UsePlaybackSettingsResult {
  const [playbackStyle, setPlaybackStyle] = useState(PLAYBACK_SETTINGS_DEFAULTS.playbackStyle);
  const [instrument, setInstrument] = useState(PLAYBACK_SETTINGS_DEFAULTS.instrument);
  const [attack, setAttack] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.attack);
  const [decay, setDecay] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.decay);
  const [padVelocity, setPadVelocity] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.padVelocity);
  const [padSwing, setPadSwing] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.padSwing);
  const [padLatchMode, setPadLatchMode] = useState(PLAYBACK_SETTINGS_DEFAULTS.padLatchMode);
  const [padPattern, setPadPattern] = useState(PLAYBACK_SETTINGS_DEFAULTS.padPattern);
  const [timeSignature, setTimeSignature] = useState(PLAYBACK_SETTINGS_DEFAULTS.timeSignature);
  const [humanize, setHumanize] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.humanize);
  const [gate, setGate] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.gate);
  const [inversionRegister, setInversionRegister] = useState(
    PLAYBACK_SETTINGS_DEFAULTS.inversionRegister,
  );
  const [octaveShift, setOctaveShift] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.octaveShift);
  const [reverbEnabled, setReverbEnabledState] = useState(PLAYBACK_SETTINGS_DEFAULTS.reverbEnabled);
  const [reverb, setReverb] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.reverb);
  const [chorusEnabled, setChorusEnabledState] = useState(PLAYBACK_SETTINGS_DEFAULTS.chorusEnabled);
  const [chorus, setChorus] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.chorus);
  const [chorusRate, setChorusRate] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.chorusRate);
  const [chorusDepth, setChorusDepthState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.chorusDepth,
  );
  const [chorusDelayTime, setChorusDelayTimeState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.chorusDelayTime,
  );
  const [feedbackDelayEnabled, setFeedbackDelayEnabledState] = useState(
    PLAYBACK_SETTINGS_DEFAULTS.feedbackDelayEnabled,
  );
  const [feedbackDelay, setFeedbackDelay] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.feedbackDelay,
  );
  const [feedbackDelayTime, setFeedbackDelayTimeState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.feedbackDelayTime,
  );
  const [feedbackDelayFeedback, setFeedbackDelayFeedbackState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.feedbackDelayFeedback,
  );
  const [tremoloEnabled, setTremoloEnabledState] = useState(
    PLAYBACK_SETTINGS_DEFAULTS.tremoloEnabled,
  );
  const [tremolo, setTremolo] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.tremolo);
  const [tremoloFrequency, setTremoloFrequencyState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.tremoloFrequency,
  );
  const [tremoloDepth, setTremoloDepthState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.tremoloDepth,
  );
  const [vibratoEnabled, setVibratoEnabledState] = useState(
    PLAYBACK_SETTINGS_DEFAULTS.vibratoEnabled,
  );
  const [vibrato, setVibrato] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.vibrato);
  const [vibratoFrequency, setVibratoFrequencyState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.vibratoFrequency,
  );
  const [vibratoDepth, setVibratoDepthState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.vibratoDepth,
  );
  const [phaserEnabled, setPhaserEnabledState] = useState(PLAYBACK_SETTINGS_DEFAULTS.phaserEnabled);
  const [phaser, setPhaser] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.phaser);
  const [phaserFrequency, setPhaserFrequencyState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.phaserFrequency,
  );
  const [phaserOctaves, setPhaserOctavesState] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.phaserOctaves,
  );
  const [phaserQ, setPhaserQState] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.phaserQ);
  const [roomSize, setRoomSize] = useState<number>(PLAYBACK_SETTINGS_DEFAULTS.roomSize);
  const [metronomeEnabled, setMetronomeEnabled] = useState(
    PLAYBACK_SETTINGS_DEFAULTS.metronomeEnabled,
  );
  const [metronomeVolume, setMetronomeVolume] = useState<number>(
    PLAYBACK_SETTINGS_DEFAULTS.metronomeVolume,
  );
  const [metronomeSource, setMetronomeSource] = useState<PlaybackSettings['metronomeSource']>(
    PLAYBACK_SETTINGS_DEFAULTS.metronomeSource,
  );
  const [metronomeDrumPath, setMetronomeDrumPath] = useState<PlaybackSettings['metronomeDrumPath']>(
    PLAYBACK_SETTINGS_DEFAULTS.metronomeDrumPath,
  );

  const handleReverbChange = useCallback((value: number) => {
    setReverb(value);
  }, []);

  const handleRoomSizeChange = useCallback((value: number) => {
    const normalizedValue = Math.min(1, Math.max(0, value));
    setRoomSize(normalizedValue);
  }, []);

  const handleChorusChange = useCallback((value: number) => {
    const normalizedValue = Math.min(1, Math.max(0, value));
    setChorus(normalizedValue);
  }, []);

  const handleFeedbackDelayChange = useCallback((value: number) => {
    const normalizedValue = Math.min(1, Math.max(0, value));
    setFeedbackDelay(normalizedValue);
  }, []);

  const handleInstrumentChange = useCallback((value: PlaybackSettings['instrument']) => {
    setInstrument(value);
    setOctaveShift(DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT[value]);
  }, []);

  const handleEffectToggle = useCallback(
    (setState: (value: boolean) => void) => (value: boolean) => {
      setState(value);
    },
    [],
  );

  const settings: PlaybackSettings = useMemo(
    () => ({
      playbackStyle,
      attack,
      decay,
      padVelocity,
      padSwing,
      padLatchMode,
      padPattern,
      timeSignature,
      humanize,
      gate,
      inversionRegister,
      instrument,
      octaveShift,
      reverbEnabled,
      reverb,
      chorusEnabled,
      chorus,
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
      metronomeEnabled,
      metronomeVolume,
      metronomeSource,
      metronomeDrumPath,
    }),
    [
      playbackStyle,
      attack,
      decay,
      padVelocity,
      padSwing,
      padLatchMode,
      padPattern,
      timeSignature,
      humanize,
      gate,
      inversionRegister,
      instrument,
      octaveShift,
      reverbEnabled,
      reverb,
      chorusEnabled,
      chorus,
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
      metronomeEnabled,
      metronomeVolume,
      metronomeSource,
      metronomeDrumPath,
    ],
  );

  const changeHandlers: PlaybackSettingsChangeHandlers = useMemo(
    () => ({
      onPlaybackStyleChange: setPlaybackStyle,
      onAttackChange: setAttack,
      onDecayChange: setDecay,
      onPadVelocityChange: setPadVelocity,
      onPadSwingChange: setPadSwing,
      onPadLatchModeChange: setPadLatchMode,
      onPadPatternChange: setPadPattern,
      onTimeSignatureChange: setTimeSignature,
      onHumanizeChange: setHumanize,
      onGateChange: setGate,
      onInversionRegisterChange: setInversionRegister,
      onInstrumentChange: handleInstrumentChange,
      onOctaveShiftChange: setOctaveShift,
      onReverbChange: handleReverbChange,
      onReverbEnabledChange: handleEffectToggle(setReverbEnabledState),
      onChorusChange: handleChorusChange,
      onChorusEnabledChange: handleEffectToggle(setChorusEnabledState),
      onChorusRateChange: setChorusRate,
      onChorusDepthChange: setChorusDepthState,
      onChorusDelayTimeChange: setChorusDelayTimeState,
      onFeedbackDelayEnabledChange: handleEffectToggle(setFeedbackDelayEnabledState),
      onFeedbackDelayChange: handleFeedbackDelayChange,
      onFeedbackDelayTimeChange: setFeedbackDelayTimeState,
      onFeedbackDelayFeedbackChange: setFeedbackDelayFeedbackState,
      onTremoloEnabledChange: handleEffectToggle(setTremoloEnabledState),
      onTremoloChange: setTremolo,
      onTremoloFrequencyChange: setTremoloFrequencyState,
      onTremoloDepthChange: setTremoloDepthState,
      onVibratoEnabledChange: handleEffectToggle(setVibratoEnabledState),
      onVibratoChange: setVibrato,
      onVibratoFrequencyChange: setVibratoFrequencyState,
      onVibratoDepthChange: setVibratoDepthState,
      onPhaserEnabledChange: handleEffectToggle(setPhaserEnabledState),
      onPhaserChange: setPhaser,
      onPhaserFrequencyChange: setPhaserFrequencyState,
      onPhaserOctavesChange: setPhaserOctavesState,
      onPhaserQChange: setPhaserQState,
      onRoomSizeChange: handleRoomSizeChange,
      onMetronomeEnabledChange: setMetronomeEnabled,
      onMetronomeVolumeChange: setMetronomeVolume,
      onMetronomeSourceChange: setMetronomeSource,
      onMetronomeDrumPathChange: setMetronomeDrumPath,
    }),
    [
      handleChorusChange,
      handleEffectToggle,
      handleFeedbackDelayChange,
      handleInstrumentChange,
      handleReverbChange,
      handleRoomSizeChange,
    ],
  );

  const setters: PlaybackSettingsSetters = useMemo(
    () => ({
      setPlaybackStyle,
      setAttack,
      setDecay,
      setPadVelocity,
      setPadSwing,
      setPadLatchMode,
      setPadPattern,
      setTimeSignature,
      setHumanize,
      setGate,
      setInversionRegister,
      setInstrument,
      setOctaveShift,
      setReverbEnabled: setReverbEnabledState,
      setReverb,
      setChorusEnabled: setChorusEnabledState,
      setChorus,
      setChorusRate,
      setChorusDepth: setChorusDepthState,
      setChorusDelayTime: setChorusDelayTimeState,
      setFeedbackDelayEnabled: setFeedbackDelayEnabledState,
      setFeedbackDelay,
      setFeedbackDelayTime: setFeedbackDelayTimeState,
      setFeedbackDelayFeedback: setFeedbackDelayFeedbackState,
      setTremoloEnabled: setTremoloEnabledState,
      setTremolo,
      setTremoloFrequency: setTremoloFrequencyState,
      setTremoloDepth: setTremoloDepthState,
      setVibratoEnabled: setVibratoEnabledState,
      setVibrato,
      setVibratoFrequency: setVibratoFrequencyState,
      setVibratoDepth: setVibratoDepthState,
      setPhaserEnabled: setPhaserEnabledState,
      setPhaser,
      setPhaserFrequency: setPhaserFrequencyState,
      setPhaserOctaves: setPhaserOctavesState,
      setPhaserQ: setPhaserQState,
      setRoomSize,
      setMetronomeEnabled,
      setMetronomeVolume,
      setMetronomeSource,
      setMetronomeDrumPath,
    }),
    [],
  );

  useEffect(() => {
    applyAudioEffectsState({
      reverbEnabled,
      reverbWet: reverb,
      reverbRoomSize: roomSize,
      chorusEnabled,
      chorusWet: chorus,
      chorusFrequency: chorusRate,
      chorusDepth,
      chorusDelayTime,
      feedbackDelayEnabled,
      feedbackDelayWet: feedbackDelay,
      feedbackDelayTime,
      feedbackDelayFeedback,
      tremoloEnabled,
      tremoloWet: tremolo,
      tremoloFrequency,
      tremoloDepth,
      vibratoEnabled,
      vibratoWet: vibrato,
      vibratoFrequency,
      vibratoDepth,
      phaserEnabled,
      phaserWet: phaser,
      phaserFrequency,
      phaserOctaves,
      phaserQ,
    });
  }, [
    reverbEnabled,
    reverb,
    roomSize,
    chorusEnabled,
    chorus,
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
  ]);

  return {
    settings,
    changeHandlers,
    setters,
  };
}
