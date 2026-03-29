import { render, screen } from '@testing-library/react';

import GeneratorPageContent from '../GeneratorPageContent';

const mockUseAuth = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../../components/providers/LocaleProvider', () => ({
  useAppLocale: () => ({ locale: 'en' }),
}));

jest.mock('../../../../components/providers/AppSnackbarProvider', () => ({
  useAppSnackbar: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

jest.mock('../../../../components/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../hooks/useGeneratorSessionCache', () => ({
  __esModule: true,
  default: () => ({
    isRestoringState: false,
    hasRestoredSessionData: false,
    cacheGeneratorResult: jest.fn(),
  }),
}));

jest.mock('../../hooks/usePlaybackSettings', () => ({
  __esModule: true,
  default: () => ({
    settings: {
      playbackStyle: 'block',
      attack: 0,
      decay: 0,
      padVelocity: 96,
      padSwing: 0,
      padLatchMode: false,
      humanize: 0,
      gate: 1,
      inversionRegister: 'off',
      instrument: 'piano',
      octaveShift: 0,
      padPattern: 'single',
      timeSignature: '4/4',
      reverbEnabled: false,
      reverb: 0,
      chorusEnabled: false,
      chorus: 0,
      chorusRate: 1.5,
      chorusDepth: 0.7,
      chorusDelayTime: 3.5,
      feedbackDelayEnabled: false,
      feedbackDelay: 0,
      feedbackDelayTime: 0.25,
      feedbackDelayFeedback: 0.35,
      tremoloEnabled: false,
      tremolo: 0,
      tremoloFrequency: 9,
      tremoloDepth: 0.5,
      vibratoEnabled: false,
      vibrato: 0,
      vibratoFrequency: 5,
      vibratoDepth: 0.1,
      phaserEnabled: false,
      phaser: 0,
      phaserFrequency: 0.5,
      phaserOctaves: 3,
      phaserQ: 10,
      roomSize: 0.25,
      metronomeEnabled: false,
      metronomeVolume: 0.5,
      metronomeSource: 'click',
      metronomeDrumPath: null,
    },
    changeHandlers: {},
    setters: {
      setPlaybackStyle: jest.fn(),
      setAttack: jest.fn(),
      setDecay: jest.fn(),
      setPadVelocity: jest.fn(),
      setPadSwing: jest.fn(),
      setPadLatchMode: jest.fn(),
      setHumanize: jest.fn(),
      setGate: jest.fn(),
      setInversionRegister: jest.fn(),
      setInstrument: jest.fn(),
      setOctaveShift: jest.fn(),
      setPadPattern: jest.fn(),
      setTimeSignature: jest.fn(),
      setMetronomeEnabled: jest.fn(),
      setMetronomeVolume: jest.fn(),
      setMetronomeSource: jest.fn(),
      setMetronomeDrumPath: jest.fn(),
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
    },
  }),
}));

jest.mock('../PlaybackSettingsButton', () => {
  return function MockPlaybackSettingsButton() {
    return null;
  };
});

jest.mock('../GeneratorHeader', () => {
  return function MockGeneratorHeader() {
    return <div>Generator Header</div>;
  };
});

jest.mock('../GeneratorFormCard', () => {
  return function MockGeneratorFormCard() {
    return <div>Generator Form</div>;
  };
});

jest.mock('../../../arrangements/components/ArrangementsList', () => {
  return function MockArrangementsList() {
    return <div>Arrangements List</div>;
  };
});

jest.mock('../GeneratedChordGridDialog', () => {
  return function MockGeneratedChordGridDialog() {
    return null;
  };
});

describe('GeneratorPageContent My Arrangements visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides My Arrangements when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      logout: jest.fn(),
      refresh: jest.fn(),
    });

    render(<GeneratorPageContent />);

    expect(screen.queryByText('My Arrangements')).not.toBeInTheDocument();
  });

  it('shows My Arrangements when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        role: 'USER',
        createdAt: new Date().toISOString(),
      },
      isLoading: false,
      logout: jest.fn(),
      refresh: jest.fn(),
    });

    render(<GeneratorPageContent />);

    expect(screen.getByText('My Arrangements')).toBeInTheDocument();
  });
});
