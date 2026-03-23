import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HomePage from './page';

jest.mock('../components/GuitarChordDiagram', () => {
  return function MockGuitarChordDiagram() {
    return <div data-testid="guitar-diagram" />;
  };
});

jest.mock('../components/PianoChordDiagram', () => {
  return function MockPianoChordDiagram() {
    return <div data-testid="piano-diagram" />;
  };
});

jest.mock('../components/ui/ThemeModeToggle', () => {
  return function MockThemeModeToggle() {
    return <div data-testid="theme-mode-toggle" />;
  };
});

jest.mock('../lib/audio', () => ({
  playChordVoicing: jest.fn(),
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
}));

const mockResponse = {
  inputSummary: {
    seedChords: ['Fmaj7', 'F#m7'],
    mood: 'dreamy, emotional, uplifting',
    mode: 'lydian',
    genre: 'piano house',
    instrument: 'both',
    adventurousness: 'balanced',
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

describe('HomePage', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('shows an error when custom mode is selected without input', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.selectOptions(screen.getByLabelText(/Mode \/ scale/i), 'custom');
    await waitFor(() => {
      expect(screen.getByLabelText('Custom mode / scale')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Generate Ideas' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a custom mode or scale')).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an error when custom genre is selected without input', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.selectOptions(screen.getByLabelText('Genre'), 'custom');
    await waitFor(() => {
      expect(screen.getByLabelText('Custom genre')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Generate Ideas' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a custom genre')).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits and renders API results', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<HomePage />);

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

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      seedChords: string[];
      mood: string;
      mode: string;
      genre: string;
      instrument: string;
      adventurousness: string;
    };

    expect(requestBody.seedChords.length).toBeGreaterThan(0);
    expect(requestBody.mood.length).toBeGreaterThan(0);
    expect(requestBody.mode.length).toBeGreaterThan(0);
    expect(requestBody.genre.length).toBeGreaterThan(0);
    expect(requestBody.instrument).toBe('both');
    expect(['safe', 'balanced', 'surprising']).toContain(requestBody.adventurousness);
  });
});
