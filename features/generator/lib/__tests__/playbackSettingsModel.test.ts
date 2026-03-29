import {
  PLAYBACK_SETTINGS_DEFAULTS,
  sanitizePlaybackSettings,
  applyPlaybackSettings,
  DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT,
  type PlaybackSettings,
  type PlaybackSettingsChangeHandlers,
  type PlaybackSettingsSetters,
} from '../playbackSettingsModel';

describe('playbackSettingsModel', () => {
  describe('PLAYBACK_SETTINGS_DEFAULTS', () => {
    it('should have rhodes as default instrument', () => {
      expect(PLAYBACK_SETTINGS_DEFAULTS.instrument).toBe('rhodes');
    });

    it('should have rhodes octave shift of -1', () => {
      expect(PLAYBACK_SETTINGS_DEFAULTS.octaveShift).toBe(-1);
    });

    it('should have all required playback settings keys', () => {
      const requiredKeys = [
        'playbackStyle',
        'attack',
        'decay',
        'padVelocity',
        'instrument',
        'octaveShift',
        'reverbEnabled',
        'chorusEnabled',
        'feedbackDelayEnabled',
        'tremoloEnabled',
        'vibratoEnabled',
        'phaserEnabled',
        'metronomeSource',
        'metronomeDrumPath',
      ];

      requiredKeys.forEach((key) => {
        expect(PLAYBACK_SETTINGS_DEFAULTS).toHaveProperty(key);
      });
    });

    it('should have numeric values within expected ranges', () => {
      expect(PLAYBACK_SETTINGS_DEFAULTS.attack).toBeGreaterThanOrEqual(0);
      expect(PLAYBACK_SETTINGS_DEFAULTS.attack).toBeLessThanOrEqual(1);
      expect(PLAYBACK_SETTINGS_DEFAULTS.decay).toBeGreaterThanOrEqual(0);
      expect(PLAYBACK_SETTINGS_DEFAULTS.reverb).toBeGreaterThanOrEqual(0);
      expect(PLAYBACK_SETTINGS_DEFAULTS.reverb).toBeLessThanOrEqual(1);
    });
  });

  describe('DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT', () => {
    it('should have piano at octave 0', () => {
      expect(DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT.piano).toBe(0);
    });

    it('should have rhodes at octave -1', () => {
      expect(DEFAULT_OCTAVE_SHIFT_BY_INSTRUMENT.rhodes).toBe(-1);
    });
  });

  describe('sanitizePlaybackSettings', () => {
    it('should return defaults when called with no input', () => {
      const result = sanitizePlaybackSettings();
      expect(result).toEqual(PLAYBACK_SETTINGS_DEFAULTS);
    });

    it('should return defaults when called with undefined', () => {
      const result = sanitizePlaybackSettings(undefined);
      expect(result).toEqual(PLAYBACK_SETTINGS_DEFAULTS);
    });

    it('should merge partial input with defaults', () => {
      const result = sanitizePlaybackSettings({
        instrument: 'piano',
        attack: 0.5,
      });

      expect(result.instrument).toBe('piano');
      expect(result.attack).toBe(0.5);
      expect(result.decay).toBe(PLAYBACK_SETTINGS_DEFAULTS.decay);
    });

    it('should sanitize metronome source and drum path', () => {
      const result = sanitizePlaybackSettings({
        metronomeSource: 'drum',
        metronomeDrumPath: ' /midi/drums/Rock/Rock13.mid ',
      });

      expect(result.metronomeSource).toBe('drum');
      expect(result.metronomeDrumPath).toBe('/midi/drums/Rock/Rock13.mid');
    });

    it('should clear drum path when source is click', () => {
      const result = sanitizePlaybackSettings({
        metronomeSource: 'click',
        metronomeDrumPath: '/midi/drums/Rock/Rock13.mid',
      });

      expect(result.metronomeSource).toBe('click');
      expect(result.metronomeDrumPath).toBeNull();
    });

    it('should validate and coerce instrument to rhodes by default', () => {
      const result = sanitizePlaybackSettings({
        // @ts-expect-error - Testing invalid input
        instrument: 'invalid-instrument',
      });

      expect(result.instrument).toBe('rhodes');
    });

    it('should validate playback style', () => {
      const result = sanitizePlaybackSettings({
        // @ts-expect-error - Testing invalid input
        playbackStyle: 'invalid-style',
      });

      expect(result.playbackStyle).toBe('strum');
    });

    it('should validate inversion register', () => {
      const result = sanitizePlaybackSettings({
        // @ts-expect-error - Testing invalid input
        inversionRegister: 'invalid-register',
      });

      expect(result.inversionRegister).toBe('off');
    });

    it('should apply instrument-specific octave shift when instrument changes', () => {
      const result = sanitizePlaybackSettings({
        instrument: 'piano',
        octaveShift: undefined,
      });

      expect(result.octaveShift).toBe(0);
    });

    it('should apply rhodes octave shift when instrument is rhodes', () => {
      const result = sanitizePlaybackSettings({
        instrument: 'rhodes',
        octaveShift: undefined,
      });

      expect(result.octaveShift).toBe(-1);
    });

    it('should preserve explicit octaveShift value when provided', () => {
      const result = sanitizePlaybackSettings({
        instrument: 'piano',
        octaveShift: 2,
      });

      expect(result.octaveShift).toBe(2);
    });

    it('should clamp numeric values to valid ranges', () => {
      const result = sanitizePlaybackSettings({
        attack: 5, // Should clamp to 1
        decay: -1, // Should clamp to 0
        reverb: 2, // Should clamp to 1
        octaveShift: 10, // Should clamp to 3
      });

      expect(result.attack).toBe(1);
      expect(result.decay).toBe(0);
      expect(result.reverb).toBe(1);
      expect(result.octaveShift).toBe(3);
    });

    it('should round numeric integer values', () => {
      const result = sanitizePlaybackSettings({
        padVelocity: 96.7,
        padSwing: 50.3,
      });

      expect(Number.isInteger(result.padVelocity)).toBe(true);
      expect(Number.isInteger(result.padSwing)).toBe(true);
      expect(result.padVelocity).toBe(97);
      expect(result.padSwing).toBe(50);
    });

    it('should coerce booleans from truthy/falsy values', () => {
      const result = sanitizePlaybackSettings({
        reverbEnabled: 1 as unknown as boolean,
        chorusEnabled: '' as unknown as boolean,
        padLatchMode: null as unknown as boolean,
      });

      expect(result.reverbEnabled).toBe(true);
      expect(result.chorusEnabled).toBe(false);
      expect(result.padLatchMode).toBe(false);
    });

    it('should clamp chorus rate correctly', () => {
      const result = sanitizePlaybackSettings({
        chorusRate: 0.05, // Below minimum 0.1
      });

      expect(result.chorusRate).toBe(0.1);
    });

    it('should clamp feedback delay feedback correctly', () => {
      const result = sanitizePlaybackSettings({
        feedbackDelayFeedback: 1.5, // Above maximum 0.95
      });

      expect(result.feedbackDelayFeedback).toBe(0.95);
    });

    it('should handle complex partial updates', () => {
      const customDefaults = {
        instrument: 'piano' as const,
        attack: 0.1,
        decay: 1.2,
        reverb: 0.5,
        octaveShift: undefined,
      };

      const result = sanitizePlaybackSettings(customDefaults);

      expect(result.instrument).toBe('piano');
      expect(result.attack).toBe(0.1);
      expect(result.octaveShift).toBe(0); // Piano default
    });
  });

  describe('applyPlaybackSettings', () => {
    it('should call all setters with correct values', () => {
      const setters: Partial<PlaybackSettingsSetters> = {
        setPlaybackStyle: jest.fn(),
        setAttack: jest.fn(),
        setDecay: jest.fn(),
        setInstrument: jest.fn(),
        setOctaveShift: jest.fn(),
        setReverbEnabled: jest.fn(),
        setReverb: jest.fn(),
        setChorusEnabled: jest.fn(),
        setChorus: jest.fn(),
        setChorusRate: jest.fn(),
        setChorusDepth: jest.fn(),
        setChorusDelayTime: jest.fn(),
        setFeedbackDelayEnabled: jest.fn(),
        setFeedbackDelay: jest.fn(),
        setFeedbackDelayTime: jest.fn(),
        setFeedbackDelayFeedback: jest.fn(),
        setTremoloEnabled: jest.fn(),
        setTremolo: jest.fn(),
        setTremoloFrequency: jest.fn(),
        setTremoloDepth: jest.fn(),
        setVibratoEnabled: jest.fn(),
        setVibrato: jest.fn(),
        setVibratoFrequency: jest.fn(),
        setVibratoDepth: jest.fn(),
        setPhaserEnabled: jest.fn(),
        setPhaser: jest.fn(),
        setPhaserFrequency: jest.fn(),
        setPhaserOctaves: jest.fn(),
        setPhaserQ: jest.fn(),
        setRoomSize: jest.fn(),
        setPadVelocity: jest.fn(),
        setPadSwing: jest.fn(),
        setPadLatchMode: jest.fn(),
        setPadPattern: jest.fn(),
        setTimeSignature: jest.fn(),
        setHumanize: jest.fn(),
        setGate: jest.fn(),
        setInversionRegister: jest.fn(),
        setMetronomeEnabled: jest.fn(),
        setMetronomeVolume: jest.fn(),
        setMetronomeSource: jest.fn(),
        setMetronomeDrumPath: jest.fn(),
      };

      const settings = PLAYBACK_SETTINGS_DEFAULTS;

      applyPlaybackSettings(setters as PlaybackSettingsSetters, settings);

      expect(setters.setPlaybackStyle).toHaveBeenCalledWith(settings.playbackStyle);
      expect(setters.setAttack).toHaveBeenCalledWith(settings.attack);
      expect(setters.setInstrument).toHaveBeenCalledWith(settings.instrument);
      expect(setters.setOctaveShift).toHaveBeenCalledWith(settings.octaveShift);
      expect(setters.setReverb).toHaveBeenCalledWith(settings.reverb);
      expect(setters.setMetronomeSource).toHaveBeenCalledWith(settings.metronomeSource);
      expect(setters.setMetronomeDrumPath).toHaveBeenCalledWith(settings.metronomeDrumPath);
    });

    it('should apply all settings from a custom object', () => {
      const customSettings: PlaybackSettings = {
        ...PLAYBACK_SETTINGS_DEFAULTS,
        instrument: 'piano',
        octaveShift: 1,
        attack: 0.05,
        reverb: 0.8,
      };

      const setters: Partial<PlaybackSettingsSetters> = {
        setInstrument: jest.fn(),
        setOctaveShift: jest.fn(),
        setAttack: jest.fn(),
        setReverb: jest.fn(),
        setPlaybackStyle: jest.fn(),
        setDecay: jest.fn(),
        setPadVelocity: jest.fn(),
        setPadSwing: jest.fn(),
        setPadLatchMode: jest.fn(),
        setPadPattern: jest.fn(),
        setTimeSignature: jest.fn(),
        setHumanize: jest.fn(),
        setGate: jest.fn(),
        setInversionRegister: jest.fn(),
        setMetronomeEnabled: jest.fn(),
        setMetronomeVolume: jest.fn(),
        setMetronomeSource: jest.fn(),
        setMetronomeDrumPath: jest.fn(),
        setReverbEnabled: jest.fn(),
        setChorusEnabled: jest.fn(),
        setChorus: jest.fn(),
        setChorusRate: jest.fn(),
        setChorusDepth: jest.fn(),
        setChorusDelayTime: jest.fn(),
        setFeedbackDelayEnabled: jest.fn(),
        setFeedbackDelay: jest.fn(),
        setFeedbackDelayTime: jest.fn(),
        setFeedbackDelayFeedback: jest.fn(),
        setTremoloEnabled: jest.fn(),
        setTremolo: jest.fn(),
        setTremoloFrequency: jest.fn(),
        setTremoloDepth: jest.fn(),
        setVibratoEnabled: jest.fn(),
        setVibrato: jest.fn(),
        setVibratoFrequency: jest.fn(),
        setVibratoDepth: jest.fn(),
        setPhaserEnabled: jest.fn(),
        setPhaser: jest.fn(),
        setPhaserFrequency: jest.fn(),
        setPhaserOctaves: jest.fn(),
        setPhaserQ: jest.fn(),
        setRoomSize: jest.fn(),
      };

      applyPlaybackSettings(setters as PlaybackSettingsSetters, customSettings);

      expect(setters.setInstrument).toHaveBeenCalledWith('piano');
      expect(setters.setOctaveShift).toHaveBeenCalledWith(1);
      expect(setters.setAttack).toHaveBeenCalledWith(0.05);
      expect(setters.setReverb).toHaveBeenCalledWith(0.8);
    });
  });

  describe('Type system (mapped types)', () => {
    it('should have ChangeHandlers type with correct names', () => {
      // This is a compile-time type check, but we can verify at runtime
      const handlers: PlaybackSettingsChangeHandlers = {
        onPlaybackStyleChange: jest.fn(),
        onAttackChange: jest.fn(),
        onDecayChange: jest.fn(),
        onPadVelocityChange: jest.fn(),
        onPadSwingChange: jest.fn(),
        onPadLatchModeChange: jest.fn(),
        onPadPatternChange: jest.fn(),
        onTimeSignatureChange: jest.fn(),
        onHumanizeChange: jest.fn(),
        onGateChange: jest.fn(),
        onInversionRegisterChange: jest.fn(),
        onInstrumentChange: jest.fn(),
        onOctaveShiftChange: jest.fn(),
        onReverbEnabledChange: jest.fn(),
        onReverbChange: jest.fn(),
        onChorusEnabledChange: jest.fn(),
        onChorusChange: jest.fn(),
        onChorusRateChange: jest.fn(),
        onChorusDepthChange: jest.fn(),
        onChorusDelayTimeChange: jest.fn(),
        onFeedbackDelayEnabledChange: jest.fn(),
        onFeedbackDelayChange: jest.fn(),
        onFeedbackDelayTimeChange: jest.fn(),
        onFeedbackDelayFeedbackChange: jest.fn(),
        onTremoloEnabledChange: jest.fn(),
        onTremoloChange: jest.fn(),
        onTremoloFrequencyChange: jest.fn(),
        onTremoloDepthChange: jest.fn(),
        onVibratoEnabledChange: jest.fn(),
        onVibratoChange: jest.fn(),
        onVibratoFrequencyChange: jest.fn(),
        onVibratoDepthChange: jest.fn(),
        onPhaserEnabledChange: jest.fn(),
        onPhaserChange: jest.fn(),
        onPhaserFrequencyChange: jest.fn(),
        onPhaserOctavesChange: jest.fn(),
        onPhaserQChange: jest.fn(),
        onRoomSizeChange: jest.fn(),
        onMetronomeEnabledChange: jest.fn(),
        onMetronomeVolumeChange: jest.fn(),
        onMetronomeSourceChange: jest.fn(),
        onMetronomeDrumPathChange: jest.fn(),
      };

      expect(handlers).toBeDefined();
    });

    it('should have Setters type with correct names', () => {
      const setters: PlaybackSettingsSetters = {
        setPlaybackStyle: jest.fn(),
        setAttack: jest.fn(),
        setDecay: jest.fn(),
        setPadVelocity: jest.fn(),
        setPadSwing: jest.fn(),
        setPadLatchMode: jest.fn(),
        setPadPattern: jest.fn(),
        setTimeSignature: jest.fn(),
        setHumanize: jest.fn(),
        setGate: jest.fn(),
        setInversionRegister: jest.fn(),
        setInstrument: jest.fn(),
        setOctaveShift: jest.fn(),
        setReverbEnabled: jest.fn(),
        setReverb: jest.fn(),
        setChorusEnabled: jest.fn(),
        setChorus: jest.fn(),
        setChorusRate: jest.fn(),
        setChorusDepth: jest.fn(),
        setChorusDelayTime: jest.fn(),
        setFeedbackDelayEnabled: jest.fn(),
        setFeedbackDelay: jest.fn(),
        setFeedbackDelayTime: jest.fn(),
        setFeedbackDelayFeedback: jest.fn(),
        setTremoloEnabled: jest.fn(),
        setTremolo: jest.fn(),
        setTremoloFrequency: jest.fn(),
        setTremoloDepth: jest.fn(),
        setVibratoEnabled: jest.fn(),
        setVibrato: jest.fn(),
        setVibratoFrequency: jest.fn(),
        setVibratoDepth: jest.fn(),
        setPhaserEnabled: jest.fn(),
        setPhaser: jest.fn(),
        setPhaserFrequency: jest.fn(),
        setPhaserOctaves: jest.fn(),
        setPhaserQ: jest.fn(),
        setRoomSize: jest.fn(),
        setMetronomeEnabled: jest.fn(),
        setMetronomeVolume: jest.fn(),
        setMetronomeSource: jest.fn(),
        setMetronomeDrumPath: jest.fn(),
      };

      expect(setters).toBeDefined();
    });
  });
});
