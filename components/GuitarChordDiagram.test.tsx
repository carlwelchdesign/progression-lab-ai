import { render } from '@testing-library/react';

import GuitarChordDiagram from './GuitarChordDiagram';

const mockConfigure = jest.fn();
const mockChord = jest.fn();
const mockDraw = jest.fn();
const mockSVGuitarChord = jest.fn();

jest.mock('svguitar', () => {
  return {
    SVGuitarChord: function MockSVGuitarChord(selector: string) {
      mockSVGuitarChord(selector);
      return {
        configure: (...args: unknown[]) => {
          mockConfigure(...args);
          return {
            chord: (...chordArgs: unknown[]) => {
              mockChord(...chordArgs);
              return {
                draw: () => {
                  mockDraw();
                },
              };
            },
          };
        },
      };
    },
  };
});

describe('GuitarChordDiagram', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    mockSVGuitarChord.mockReset();
    mockConfigure.mockReset();
    mockChord.mockReset();
    mockDraw.mockReset();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('renders and calls svguitar with normalized position', () => {
    render(
      <GuitarChordDiagram
        title="G7"
        fingers={[[6, 3, '2'], [5, 2, '1']]}
        barres={[]}
        position={0}
      />
    );

    expect(mockSVGuitarChord).toHaveBeenCalledWith(
      expect.stringMatching(/^#guitar-chart-/)
    );
    expect(mockConfigure).toHaveBeenCalledWith(
      expect.objectContaining({ position: 2, strings: 6, frets: 6 })
    );
    expect(mockChord).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'G7', position: 2 })
    );
    expect(mockDraw).toHaveBeenCalledTimes(1);
  });

  it('logs an error if svguitar throws', () => {
    mockConfigure.mockImplementationOnce(() => {
      throw new Error('draw failed');
    });

    render(
      <GuitarChordDiagram
        title="Fmaj7"
        fingers={[[6, 1, '1']]}
        position={1}
      />
    );

    expect(console.error).toHaveBeenCalledWith(
      'svguitar render failed',
      expect.objectContaining({ title: 'Fmaj7', position: 1 })
    );
  });

  it('re-renders diagram when props change', () => {
    const { rerender } = render(
      <GuitarChordDiagram
        title="Cmaj7"
        fingers={[[5, 3, '3']]}
        position={3}
      />
    );

    rerender(
      <GuitarChordDiagram
        title="D7"
        fingers={[[5, 5, '3']]}
        position={5}
      />
    );

    expect(mockDraw).toHaveBeenCalledTimes(2);
    expect(mockChord).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'D7', position: 5 })
    );
  });
});
