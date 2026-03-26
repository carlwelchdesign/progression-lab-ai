import { render } from '@testing-library/react';

import PianoChordDiagram from '../PianoChordDiagram';

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

describe('PianoChordDiagram', () => {
  beforeEach(() => {
    mockInstrument.mockReset();
    mockCreate.mockReset();
    mockKeyDown.mockReset();
    mockDestroy.mockReset();
  });

  it('creates piano-chart instrument and presses all notes', () => {
    render(<PianoChordDiagram leftHand={['F2', 'C3']} rightHand={['A3', 'C4', 'E4']} />);

    expect(mockInstrument).toHaveBeenCalledTimes(1);
    expect(mockInstrument).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        startOctave: 2,
        endOctave: 6,
        showNoteNames: 'always',
      }),
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockKeyDown).toHaveBeenNthCalledWith(1, 'F2');
    expect(mockKeyDown).toHaveBeenNthCalledWith(2, 'C3');
    expect(mockKeyDown).toHaveBeenNthCalledWith(3, 'A3');
    expect(mockKeyDown).toHaveBeenNthCalledWith(4, 'C4');
    expect(mockKeyDown).toHaveBeenNthCalledWith(5, 'E4');
  });

  it('destroys instrument on unmount', () => {
    const { unmount } = render(<PianoChordDiagram leftHand={['C3']} rightHand={['E4', 'G4']} />);

    unmount();

    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('creates instrument but presses no keys when note arrays are empty', () => {
    render(<PianoChordDiagram leftHand={[]} rightHand={[]} />);

    expect(mockInstrument).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockKeyDown).not.toHaveBeenCalled();
  });

  it('recreates instrument when props change', () => {
    const { rerender, unmount } = render(
      <PianoChordDiagram leftHand={['C3']} rightHand={['E4']} />,
    );

    rerender(<PianoChordDiagram leftHand={['D3']} rightHand={['F4']} />);

    expect(mockInstrument).toHaveBeenCalledTimes(2);
    expect(mockDestroy).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockDestroy).toHaveBeenCalledTimes(2);
  });
});
