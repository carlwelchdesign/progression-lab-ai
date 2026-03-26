import { render } from '@testing-library/react';

import PianoChordChart from '../PianoChordChart';

const mockCreate = jest.fn();
const mockKeyDown = jest.fn();
const mockDestroy = jest.fn();
const mockInstrument = jest.fn();

jest.mock('piano-chart', () => {
  return {
    Instrument: function MockInstrument(container: HTMLDivElement, options: unknown) {
      mockInstrument(container, options);
      return {
        create: () => mockCreate(),
        keyDown: (note: string) => mockKeyDown(note),
        destroy: () => mockDestroy(),
      };
    },
  };
});

describe('PianoChordChart', () => {
  beforeEach(() => {
    mockInstrument.mockReset();
    mockCreate.mockReset();
    mockKeyDown.mockReset();
    mockDestroy.mockReset();
  });

  it('uses custom octave range/highlights and presses provided notes', () => {
    render(
      <PianoChordChart
        notes={['C4', 'E4', 'G4']}
        highlightedNotes={['C', 'E', 'G']}
        rootNote="C"
        startOctave={2}
        endOctave={6}
      />,
    );

    expect(mockInstrument).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        startOctave: 2,
        endOctave: 6,
        highlightedNotes: ['C', 'E', 'G'],
        showNoteNames: 'onpress',
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockKeyDown).toHaveBeenNthCalledWith(1, 'C4');
    expect(mockKeyDown).toHaveBeenNthCalledWith(2, 'E4');
    expect(mockKeyDown).toHaveBeenNthCalledWith(3, 'G4');
  });

  it('destroys instrument on unmount', () => {
    const { unmount } = render(<PianoChordChart notes={['A3', 'C4', 'E4']} />);

    unmount();

    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('uses default octaves and does not press keys when notes are empty', () => {
    render(<PianoChordChart notes={[]} />);

    expect(mockInstrument).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        startOctave: 3,
        endOctave: 5,
      }),
    );
    expect(mockKeyDown).not.toHaveBeenCalled();
  });

  it('recreates instrument when inputs change', () => {
    const { rerender, unmount } = render(<PianoChordChart notes={['C4']} />);

    rerender(<PianoChordChart notes={['D4']} highlightedNotes={['D']} />);

    expect(mockInstrument).toHaveBeenCalledTimes(2);
    expect(mockDestroy).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockDestroy).toHaveBeenCalledTimes(2);
  });
});
