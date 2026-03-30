import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { LocaleProvider } from '../../../../components/providers/LocaleProvider';
import AppThemeProvider from '../../../../components/providers/AppThemeProvider';
import GeneratedChordGridDialog from '../GeneratedChordGridDialog';
import {
  PLAYBACK_SETTINGS_DEFAULTS,
  type PlaybackSettingsChangeHandlers,
} from '../../lib/playbackSettingsModel';

const mockOpenAuthModal = jest.fn();
let mockIsAuthenticated = true;
let mockOnPadDropAtStep: ((padKey: string, stepIndex: number) => void) | undefined;
let mockOnLaneClickStep: ((stepIndex: number) => void) | undefined;

jest.mock('../../../../domain/audio/audio', () => ({
  getAudioClockSeconds: jest.fn(() => 0),
  playChordPattern: jest.fn(() => Promise.resolve()),
  playMetronomePulse: jest.fn(() => Promise.resolve()),
  startAudio: jest.fn(() => Promise.resolve()),
  stopAllAudio: jest.fn(),
}));

jest.mock('../../hooks/usePlaybackToggle', () => ({
  stopGlobalPlayback: jest.fn(),
}));

jest.mock('../../../../components/providers/AuthProvider', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      createdAt: new Date().toISOString(),
    },
    isLoading: false,
    logout: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('../../../../components/providers/AuthModalProvider', () => ({
  useAuthModal: () => ({
    openAuthModal: mockOpenAuthModal,
    closeAuthModal: jest.fn(),
  }),
}));

jest.mock('../PlaybackSettingsButton', () => {
  return function MockPlaybackSettingsButton() {
    return <div data-testid="playback-settings-button" />;
  };
});

jest.mock('../PlaybackToggleButton', () => {
  return function MockPlaybackToggleButton({
    isPlaying,
    onClick,
  }: {
    isPlaying: boolean;
    onClick: () => void;
  }) {
    return <button onClick={onClick}>{isPlaying ? 'Stop playback' : 'Play playback'}</button>;
  };
});

jest.mock('../SequencerTrack', () => {
  return function MockSequencerTrack({
    onPadDropAtStep,
    onLaneClickStep,
  }: {
    onPadDropAtStep?: (padKey: string, stepIndex: number) => void;
    onLaneClickStep?: (stepIndex: number) => void;
  }) {
    mockOnPadDropAtStep = onPadDropAtStep;
    mockOnLaneClickStep = onLaneClickStep;
    return <div data-testid="sequencer-track" />;
  };
});

jest.mock('../../../arrangements/components/SaveArrangementDialog', () => {
  return function MockSaveArrangementDialog() {
    return null;
  };
});

jest.mock('../../../../components/ui/SelectField', () => {
  return function MockSelectField({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    options: Array<{ value: string; label: string }>;
  }) {
    return (
      <label>
        <span>{label}</span>
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange({ target: { value: event.target.value } })}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  };
});

const mockChord = {
  key: 'pad-1',
  chord: 'Cmaj7',
  source: 'generated',
  leftHand: ['C3', 'G3'],
  rightHand: ['B3', 'E4', 'G4'],
};

const mockHandlers = {
  onMetronomeEnabledChange: jest.fn(),
} as unknown as PlaybackSettingsChangeHandlers;

const renderWithProviders = (ui: ReactElement) =>
  render(
    <LocaleProvider>
      <AppThemeProvider>{ui}</AppThemeProvider>
    </LocaleProvider>,
  );

const setMatchMedia = ({ desktop }: { desktop: boolean }) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      const normalizedQuery = query.replace(/\s+/g, '').toLowerCase();
      const isDesktopPointerQuery =
        normalizedQuery.includes('hover:hover') && normalizedQuery.includes('pointer:fine');

      return {
        matches: isDesktopPointerQuery ? desktop : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });
};

describe('GeneratedChordGridDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockOnPadDropAtStep = undefined;
    mockOnLaneClickStep = undefined;
  });

  it('shows base and desktop shortcuts inside the tooltip on desktop', async () => {
    setMatchMedia({ desktop: true });
    const user = userEvent.setup();

    renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Tips' });
    await user.hover(trigger);

    expect(await screen.findByText('Pads: 1-0, then A-Z.')).toBeInTheDocument();
    expect(screen.getByText('Space: play or stop the track.')).toBeInTheDocument();
    expect(screen.getByText('Shift: toggle recording.')).toBeInTheDocument();
    expect(screen.getByText('Desktop clip editing')).toBeInTheDocument();
    expect(
      screen.getByText('Delete / Backspace: remove all events at the selected step.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Escape: clear the current selection.')).toBeInTheDocument();
    expect(
      screen.getByText('Left / Right arrows: nudge the selected clip within the loop.'),
    ).toBeInTheDocument();
  });

  it('shows only the base tooltip content after hardware keyboard input on non-desktop devices', async () => {
    setMatchMedia({ desktop: false });
    const user = userEvent.setup();

    renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Tips' })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Alt', altKey: true });

    const trigger = await waitFor(() => screen.getByRole('button', { name: 'Tips' }));
    await user.hover(trigger);

    expect(await screen.findByText('Pads: 1-0, then A-Z.')).toBeInTheDocument();
    expect(screen.getByText('Space: play or stop the track.')).toBeInTheDocument();
    expect(screen.getByText('Shift: toggle recording.')).toBeInTheDocument();
    expect(screen.queryByText('Desktop clip editing')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Delete / Backspace: remove all events at the selected step.'),
    ).not.toBeInTheDocument();
  });

  it('disables record until a chord pad is pressed', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
      />,
    );

    const recordButton = screen.getByRole('button', { name: 'Record arrangement' });
    expect(recordButton).toBeDisabled();

    await user.pointer({
      target: screen.getByRole('button', { name: mockChord.chord }),
      keys: '[MouseLeft]',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record arrangement' })).toBeEnabled();
    });
  });

  it('re-disables record when the dialog is reopened', async () => {
    const user = userEvent.setup();
    const view = renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
      />,
    );

    await user.pointer({
      target: screen.getByRole('button', { name: mockChord.chord }),
      keys: '[MouseLeft]',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record arrangement' })).toBeEnabled();
    });

    view.unmount();

    renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Record arrangement' })).toBeDisabled();
  });

  it('renders suggestion mode buttons and allows switching modes', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Suggestion modes' }));

    const offButton = screen.getByRole('button', { name: 'Off' });
    const currentButton = screen.getByRole('button', { name: 'Both directions' });
    const dominantFlowButton = screen.getByRole('button', { name: 'Dominant flow' });
    const subdominantFlowButton = screen.getByRole('button', { name: 'Subdominant flow' });

    expect(currentButton).toHaveAttribute('aria-pressed', 'true');
    expect(offButton).toHaveAttribute('aria-pressed', 'false');
    expect(dominantFlowButton).toHaveAttribute('aria-pressed', 'false');
    expect(subdominantFlowButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(dominantFlowButton);
    expect(dominantFlowButton).toHaveAttribute('aria-pressed', 'true');
    expect(currentButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(subdominantFlowButton);
    expect(subdominantFlowButton).toHaveAttribute('aria-pressed', 'true');
    expect(dominantFlowButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(offButton);
    expect(offButton).toHaveAttribute('aria-pressed', 'true');
    expect(subdominantFlowButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('prompts login modal when unauthenticated user tries to save arrangement', async () => {
    mockIsAuthenticated = false;
    const user = userEvent.setup();

    renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
        pendingLoad={{
          key: 'pending-1',
          loopLengthBars: 1,
          events: [
            {
              id: 'event-1',
              padKey: mockChord.key,
              chord: mockChord.chord,
              source: mockChord.source,
              leftHand: mockChord.leftHand,
              rightHand: mockChord.rightHand,
              stepIndex: 0,
            },
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save arrangement' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Save arrangement' }));

    expect(mockOpenAuthModal).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'login',
        reason: 'save-arrangement',
      }),
    );
  });

  it('inserts a one-step event when a pad is dropped on the timeline', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GeneratedChordGridDialog
        open={true}
        onClose={jest.fn()}
        tempoBpm={120}
        settings={PLAYBACK_SETTINGS_DEFAULTS}
        onSettingsChange={mockHandlers}
        onTempoBpmChange={jest.fn()}
        chords={[mockChord]}
      />,
    );

    await user.pointer({
      target: screen.getByRole('button', { name: mockChord.chord }),
      keys: '[MouseLeft]',
    });

    expect(mockOnPadDropAtStep).toBeDefined();
    await act(async () => {
      mockOnPadDropAtStep?.(mockChord.key, 3);
    });

    expect(screen.getByText(/1 event/i)).toBeInTheDocument();
  });
});
