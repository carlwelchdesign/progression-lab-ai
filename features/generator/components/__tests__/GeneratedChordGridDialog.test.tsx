import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { LocaleProvider } from '../../../../components/providers/LocaleProvider';
import AppThemeProvider from '../../../../components/providers/AppThemeProvider';
import GeneratedChordGridDialog from '../GeneratedChordGridDialog';
import {
  PLAYBACK_SETTINGS_DEFAULTS,
  type PlaybackSettingsChangeHandlers,
} from '../../lib/playbackSettingsModel';

jest.mock('../../../../domain/audio/audio', () => ({
  getAudioClockSeconds: jest.fn(() => 0),
  playChordPattern: jest.fn(() => Promise.resolve()),
  playMetronomeClick: jest.fn(() => Promise.resolve()),
  startAudio: jest.fn(() => Promise.resolve()),
  stopAllAudio: jest.fn(),
}));

jest.mock('../../hooks/usePlaybackToggle', () => ({
  stopGlobalPlayback: jest.fn(),
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
  return function MockSequencerTrack() {
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
    value: jest.fn().mockImplementation((query: string) => ({
      matches:
        query === '(hover: hover) and (pointer: fine)'
          ? desktop
          : query.includes('max-width')
            ? false
            : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('GeneratedChordGridDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    const trigger = screen.getByRole('button', { name: 'Keyboard shortcuts' });
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

    expect(screen.queryByRole('button', { name: 'Keyboard shortcuts' })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Alt', altKey: true });

    const trigger = await waitFor(() => screen.getByRole('button', { name: 'Keyboard shortcuts' }));
    await user.hover(trigger);

    expect(await screen.findByText('Pads: 1-0, then A-Z.')).toBeInTheDocument();
    expect(screen.getByText('Space: play or stop the track.')).toBeInTheDocument();
    expect(screen.getByText('Shift: toggle recording.')).toBeInTheDocument();
    expect(screen.queryByText('Desktop clip editing')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Delete / Backspace: remove all events at the selected step.'),
    ).not.toBeInTheDocument();
  });
});
