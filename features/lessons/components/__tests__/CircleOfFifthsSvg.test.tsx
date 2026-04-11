import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CircleOfFifthsSvg from '../CircleOfFifthsSvg';
import { COF_KEYS } from '../../data/circleOfFifthsData';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('CircleOfFifthsSvg', () => {
  it('renders 12 outer sector buttons — one per key', () => {
    const handleSelect = jest.fn();
    renderWithTheme(<CircleOfFifthsSvg selectedSemitone={null} onKeySelect={handleSelect} />);

    const majorKeyButtons = screen
      .getAllByRole('button', { hidden: false })
      .filter((b) => b.getAttribute('aria-label')?.endsWith('major'));
    expect(majorKeyButtons).toHaveLength(12);
  });

  it('calls onKeySelect with the correct key data when a sector is clicked', () => {
    const handleSelect = jest.fn();
    renderWithTheme(<CircleOfFifthsSvg selectedSemitone={null} onKeySelect={handleSelect} />);

    const cMajorButton = screen.getByRole('button', { name: 'C major' });
    fireEvent.click(cMajorButton);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ majorKey: 'C', semitone: 0 }),
    );
  });

  it('triggers onKeySelect via keyboard Enter on a sector', () => {
    const handleSelect = jest.fn();
    renderWithTheme(<CircleOfFifthsSvg selectedSemitone={null} onKeySelect={handleSelect} />);

    const gMajorButton = screen.getByRole('button', { name: 'G major' });
    fireEvent.keyDown(gMajorButton, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ majorKey: 'G', semitone: 7 }),
    );
  });

  it('renders all 12 COF_KEYS labels', () => {
    const handleSelect = jest.fn();
    renderWithTheme(<CircleOfFifthsSvg selectedSemitone={null} onKeySelect={handleSelect} />);

    for (const key of COF_KEYS) {
      expect(screen.getByRole('button', { name: `${key.majorKey} major` })).toBeInTheDocument();
    }
  });
});
