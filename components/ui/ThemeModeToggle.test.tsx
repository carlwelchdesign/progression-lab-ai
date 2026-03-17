import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ThemeModeToggle from './ThemeModeToggle';

const mockToggleMode = jest.fn();

jest.mock('../../lib/themeMode', () => ({
  useThemeMode: jest.fn(),
}));

import { useThemeMode } from '../../lib/themeMode';

const mockUseThemeMode = useThemeMode as jest.MockedFunction<typeof useThemeMode>;

describe('ThemeModeToggle', () => {
  beforeEach(() => {
    mockToggleMode.mockClear();
    mockUseThemeMode.mockClear();
  });

  it('renders button when in light mode', () => {
    mockUseThemeMode.mockReturnValue({
      mode: 'light',
      toggleMode: mockToggleMode,
    });

    render(<ThemeModeToggle />);
    const button = screen.getByRole('button', {
      name: 'Switch to dark mode',
    });
    expect(button).toBeInTheDocument();
  });

  it('renders button when in dark mode', () => {
    mockUseThemeMode.mockReturnValue({
      mode: 'dark',
      toggleMode: mockToggleMode,
    });

    render(<ThemeModeToggle />);
    const button = screen.getByRole('button', {
      name: 'Switch to light mode',
    });
    expect(button).toBeInTheDocument();
  });

  it('calls toggleMode when button is clicked', async () => {
    const user = userEvent.setup();
    mockUseThemeMode.mockReturnValue({
      mode: 'light',
      toggleMode: mockToggleMode,
    });

    render(<ThemeModeToggle />);
    const button = screen.getByRole('button');
    await user.click(button);
    expect(mockToggleMode).toHaveBeenCalledTimes(1);
  });

  it('shows correct aria-label for light mode', () => {
    mockUseThemeMode.mockReturnValue({
      mode: 'light',
      toggleMode: mockToggleMode,
    });

    render(<ThemeModeToggle />);
    const button = screen.getByRole('button', {
      name: 'Switch to dark mode',
    });
    expect(button).toBeInTheDocument();
  });

  it('shows correct aria-label for dark mode', () => {
    mockUseThemeMode.mockReturnValue({
      mode: 'dark',
      toggleMode: mockToggleMode,
    });

    render(<ThemeModeToggle />);
    const button = screen.getByRole('button', {
      name: 'Switch to light mode',
    });
    expect(button).toBeInTheDocument();
  });

  it('displays correct tooltip text for light mode', async () => {
    mockUseThemeMode.mockReturnValue({
      mode: 'light',
      toggleMode: mockToggleMode,
    });

    render(<ThemeModeToggle />);
    const button = screen.getByRole('button');
    
    // Hover to show tooltip
    await userEvent.hover(button);
    await screen.findByText('Switch to dark mode');
  });

  it('displays correct tooltip text for dark mode', async () => {
    mockUseThemeMode.mockReturnValue({
      mode: 'dark',
      toggleMode: mockToggleMode,
    });

    render(<ThemeModeToggle />);
    const button = screen.getByRole('button');
    
    // Hover to show tooltip
    await userEvent.hover(button);
    await screen.findByText('Switch to light mode');
  });

  it('updates aria-label when mode changes', () => {
    const { rerender } = render(<ThemeModeToggle />);
    
    mockUseThemeMode.mockReturnValue({
      mode: 'light',
      toggleMode: mockToggleMode,
    });
    rerender(<ThemeModeToggle />);
    
    let button = screen.getByRole('button', {
      name: 'Switch to dark mode',
    });
    expect(button).toBeInTheDocument();

    mockUseThemeMode.mockReturnValue({
      mode: 'dark',
      toggleMode: mockToggleMode,
    });
    rerender(<ThemeModeToggle />);

    button = screen.getByRole('button', {
      name: 'Switch to light mode',
    });
    expect(button).toBeInTheDocument();
  });
});
