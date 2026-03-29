jest.mock('tone', () => ({}));

import {
  createAudioEngineScope,
  getAudioEngine,
  playChordVoicing,
  playProgression,
  resetAudioEngine,
  setAudioEngine,
  setReverbWet,
  type AudioEngine,
  type PlayChordVoicingParams,
  type PlayProgressionOptions,
  type PlaybackStyle,
  type ProgressionVoicing,
} from '../audio';

const createMockAudioEngine = (): jest.Mocked<AudioEngine> => ({
  setReverbWet: jest.fn(),
  setChorusWet: jest.fn(),
  setReverbRoomSize: jest.fn(),
  setReverbEnabled: jest.fn(),
  setChorusEnabled: jest.fn(),
  setChorusFrequency: jest.fn(),
  setChorusDelayTime: jest.fn(),
  setChorusDepth: jest.fn(),
  setFeedbackDelayEnabled: jest.fn(),
  setFeedbackDelayWet: jest.fn(),
  setFeedbackDelayTime: jest.fn(),
  setFeedbackDelayFeedback: jest.fn(),
  setTremoloEnabled: jest.fn(),
  setTremoloWet: jest.fn(),
  setTremoloFrequency: jest.fn(),
  setTremoloDepth: jest.fn(),
  setVibratoEnabled: jest.fn(),
  setVibratoWet: jest.fn(),
  setVibratoFrequency: jest.fn(),
  setVibratoDepth: jest.fn(),
  setPhaserEnabled: jest.fn(),
  setPhaserWet: jest.fn(),
  setPhaserFrequency: jest.fn(),
  setPhaserOctaves: jest.fn(),
  setPhaserQ: jest.fn(),
  startAudio: jest.fn().mockResolvedValue(undefined),
  playMetronomeClick: jest.fn().mockResolvedValue(undefined),
  playMetronomePulse: jest.fn().mockResolvedValue(undefined),
  stopAllAudio: jest.fn(),
  playChordVoicing: jest.fn().mockResolvedValue(undefined),
  playProgression: jest.fn().mockResolvedValue(undefined),
  playChordPattern: jest.fn().mockResolvedValue(undefined),
});

describe('audio engine abstraction', () => {
  afterEach(() => {
    resetAudioEngine();
    jest.clearAllMocks();
  });

  it('delegates effect setters to the active engine', () => {
    const mockEngine = createMockAudioEngine();
    setAudioEngine(mockEngine);

    setReverbWet(0.42);

    expect(mockEngine.setReverbWet).toHaveBeenCalledWith(0.42);
  });

  it('delegates playback calls with unchanged argument shape', async () => {
    const mockEngine = createMockAudioEngine();
    setAudioEngine(mockEngine);

    const voicingParams: PlayChordVoicingParams = {
      leftHand: ['C3'],
      rightHand: ['E4', 'G4'],
      playbackStyle: 'strum',
      instrument: 'piano',
    };

    const voicings: ProgressionVoicing[] = [
      { leftHand: ['C3'], rightHand: ['E4', 'G4'] },
      { leftHand: ['F3'], rightHand: ['A4', 'C5'] },
    ];
    const style: PlaybackStyle = 'block';
    const opts: PlayProgressionOptions = { instrument: 'rhodes', gate: 0.8 };

    await playChordVoicing(voicingParams);
    await playProgression(voicings, 120, style, 0.02, 0.4, opts);

    expect(mockEngine.playChordVoicing).toHaveBeenCalledWith(voicingParams);
    expect(mockEngine.playProgression).toHaveBeenCalledWith(voicings, 120, style, 0.02, 0.4, opts);
  });

  it('lazily creates and reuses the default engine instance', () => {
    const firstEngine = getAudioEngine();
    const secondEngine = getAudioEngine();

    expect(firstEngine).toBe(secondEngine);
  });

  it('supports scoped engine attachment and detach semantics', () => {
    const defaultEngine = createMockAudioEngine();
    setAudioEngine(defaultEngine);

    const scopedEngine = createMockAudioEngine();
    const scope = createAudioEngineScope(scopedEngine);

    scope.attach();
    setReverbWet(0.3);
    expect(scopedEngine.setReverbWet).toHaveBeenCalledWith(0.3);

    scope.detach();
    setReverbWet(0.7);
    expect(defaultEngine.setReverbWet).toHaveBeenCalledWith(0.7);
  });

  it('runs scoped work and restores previous global engine', async () => {
    const defaultEngine = createMockAudioEngine();
    setAudioEngine(defaultEngine);

    const scopedEngine = createMockAudioEngine();
    const scope = createAudioEngineScope(scopedEngine);

    scope.run(() => {
      setReverbWet(0.11);
    });

    await scope.runAsync(async () => {
      await playChordVoicing({ leftHand: ['C3'], rightHand: ['E4', 'G4'] });
    });

    setReverbWet(0.22);

    expect(scopedEngine.setReverbWet).toHaveBeenCalledWith(0.11);
    expect(scopedEngine.playChordVoicing).toHaveBeenCalledTimes(1);
    expect(defaultEngine.setReverbWet).toHaveBeenCalledWith(0.22);
  });
});
