import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppSnackbarProvider } from '../../components/providers/AppSnackbarProvider';
import { LocaleProvider } from '../../components/providers/LocaleProvider';
import AppThemeProvider from '../../components/providers/AppThemeProvider';
import HomePage from '../page';

jest.mock('../../features/generator/components/diagrams/GuitarChordDiagram', () => {
  return function MockGuitarChordDiagram() {
    return <div data-testid="guitar-diagram" />;
  };
});

jest.mock('../../features/generator/components/diagrams/PianoChordDiagram', () => {
  return function MockPianoChordDiagram() {
    return <div data-testid="piano-diagram" />;
  };
});

jest.mock('../../components/ui/ThemeModeToggle', () => {
  return function MockThemeModeToggle() {
    return <div data-testid="theme-mode-toggle" />;
  };
});

jest.mock('../../components/providers/AuthProvider', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    logout: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('../../components/providers/AuthModalProvider', () => ({
  useAuthModal: () => ({
    openAuthModal: jest.fn(),
    closeAuthModal: jest.fn(),
  }),
}));

jest.mock('../../domain/audio/audio', () => ({
  PAD_PATTERN_LABELS: {
    single: 'Single',
    'quarter-pulse': 'Quarter pulse',
    'eighth-pulse': 'Eighth pulse',
    'offbeat-stab': 'Offbeat stab',
    'syncopated-stab': 'Syncopated stab',
  },
  TIME_SIGNATURE_LABELS: {
    '4/4': '4/4',
    '3/4': '3/4',
    '6/8': '6/8',
  },
  playChordVoicing: jest.fn(),
  playChordPattern: jest.fn(),
  playProgression: jest.fn(),
  setChorusDelayTime: jest.fn(),
  setChorusDepth: jest.fn(),
  setChorusEnabled: jest.fn(),
  setChorusFrequency: jest.fn(),
  setChorusWet: jest.fn(),
  setFeedbackDelayEnabled: jest.fn(),
  setFeedbackDelayFeedback: jest.fn(),
  setFeedbackDelayTime: jest.fn(),
  setFeedbackDelayWet: jest.fn(),
  setPhaserEnabled: jest.fn(),
  setPhaserFrequency: jest.fn(),
  setPhaserOctaves: jest.fn(),
  setPhaserQ: jest.fn(),
  setPhaserWet: jest.fn(),
  setReverbEnabled: jest.fn(),
  setReverbRoomSize: jest.fn(),
  setReverbWet: jest.fn(),
  setTremoloDepth: jest.fn(),
  setTremoloEnabled: jest.fn(),
  setTremoloFrequency: jest.fn(),
  setTremoloWet: jest.fn(),
  setVibratoDepth: jest.fn(),
  setVibratoEnabled: jest.fn(),
  setVibratoFrequency: jest.fn(),
  setVibratoWet: jest.fn(),
  stopAllAudio: jest.fn(),
}));

const mockResponse = {
  inputSummary: {
    seedChords: ['Fmaj7', 'F#m7'],
    mood: 'dreamy, emotional, uplifting',
    mode: 'lydian',
    genre: 'piano house',
    styleReference: null,
    instrument: 'both',
    adventurousness: 'balanced',
    language: 'en',
  },
  nextChordSuggestions: [
    {
      chord: 'G7',
      romanNumeral: 'II7',
      functionExplanation: 'Secondary dominant that leads back to C.',
      tensionLevel: 3,
      confidence: 4,
      voicingHint: 'Keep the top note smooth from previous chord.',
      pianoVoicing: {
        leftHand: ['G2', 'D3'],
        rightHand: ['F3', 'B3', 'D4'],
      },
      guitarVoicing: {
        title: 'G7',
        position: 1,
        fingers: [
          { string: 6, fret: 3, finger: '2' },
          { string: 5, fret: 2, finger: '1' },
        ],
        barres: [],
      },
    },
  ],
  progressionIdeas: [
    {
      label: 'Lifted loop',
      chords: ['Fmaj7', 'G7', 'Am7', 'Cmaj7'],
      feel: 'Uplifting and fluid',
      performanceTip: 'Push chord 2 slightly ahead of the beat.',
      pianoVoicings: [],
    },
  ],
  structureSuggestions: [
    {
      section: 'verse',
      bars: 8,
      harmonicIdea: 'Cycle through the progression with a low-pass filter.',
    },
  ],
};

const renderHomePage = () =>
  render(
    <LocaleProvider>
      <AppThemeProvider>
        <AppSnackbarProvider>
          <HomePage />
        </AppSnackbarProvider>
      </AppThemeProvider>
    </LocaleProvider>,
  );

describe('HomePage', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (input === '/api/arrangements') {
        return {
          ok: true,
          json: async () => ({ arrangements: [] }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('shows validation when mode / scale is cleared', async () => {
    const user = userEvent.setup();
    renderHomePage();

    await user.clear(screen.getByRole('combobox', { name: 'Mode / scale' }));
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Mode / scale is required')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Generate Ideas' })).toBeDisabled();
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/chord-suggestions')).toBe(false);
  });

  it('submits and renders API results', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (input === '/api/chord-suggestions') {
        return {
          ok: true,
          json: async () => mockResponse,
        } as Response;
      }

      if (input === '/api/arrangements') {
        return {
          ok: true,
          json: async () => ({ arrangements: [] }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });

    renderHomePage();

    await user.click(screen.getByRole('button', { name: 'Generate Ideas' }));

    await waitFor(() => {
      expect(screen.getByText('Next chord suggestions')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'G7' })[0]).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chord-suggestions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const chordSuggestionsCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/chord-suggestions',
    );

    expect(chordSuggestionsCall).toBeDefined();

    const requestBody = JSON.parse(chordSuggestionsCall?.[1]?.body as string) as {
      seedChords: string[];
      mood: string;
      mode: string;
      genre: string;
      styleReference: string | null;
      voicingProfiles: string[];
      customVoicingInstructions: string;
      instrument: string;
      adventurousness: string;
      language: string;
    };

    expect(requestBody.seedChords.length).toBeGreaterThan(0);
    expect(requestBody.mood.length).toBeGreaterThan(0);
    expect(requestBody.mode.length).toBeGreaterThan(0);
    expect(requestBody.genre.length).toBeGreaterThan(0);
    expect(typeof requestBody.styleReference).toBe('string');
    expect((requestBody.styleReference ?? '').length).toBeGreaterThan(0);
    expect(Array.isArray(requestBody.voicingProfiles)).toBe(true);
    expect(requestBody.customVoicingInstructions).toBe('');
    expect(requestBody.instrument).toBe('both');
    expect(['safe', 'balanced', 'surprising']).toContain(requestBody.adventurousness);
    expect(requestBody.language).toBe('en');
  });

  it('uses the selected locale in the chord suggestions request', async () => {
    const user = userEvent.setup();

    window.localStorage.setItem('app-locale', 'es');
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (input === '/api/chord-suggestions') {
        return {
          ok: true,
          json: async () => mockResponse,
        } as Response;
      }

      if (input === '/api/arrangements') {
        return {
          ok: true,
          json: async () => ({ arrangements: [] }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generar ideas' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Generar ideas' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const chordSuggestionsCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/chord-suggestions',
    );

    expect(chordSuggestionsCall).toBeDefined();

    const requestBody = JSON.parse(chordSuggestionsCall?.[1]?.body as string) as {
      language: string;
    };

    expect(requestBody.language).toBe('es');
  });
});
