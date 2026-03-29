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
      humanize: 0,
      gate: 100,
      inversionRegister: 'root',
      instrument: 'piano',
      octaveShift: 0,
      padPattern: 'quarter',
      timeSignature: '4/4',
      metronomeEnabled: false,
      metronomeVolume: 0.5,
    },
    changeHandlers: {},
    setters: {
      setPlaybackStyle: jest.fn(),
      setAttack: jest.fn(),
      setDecay: jest.fn(),
      setPadVelocity: jest.fn(),
      setHumanize: jest.fn(),
      setGate: jest.fn(),
      setInversionRegister: jest.fn(),
      setInstrument: jest.fn(),
      setOctaveShift: jest.fn(),
      setPadPattern: jest.fn(),
      setTimeSignature: jest.fn(),
      setMetronomeEnabled: jest.fn(),
      setMetronomeVolume: jest.fn(),
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
