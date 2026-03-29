import { render, screen } from '@testing-library/react';

import AppThemeProvider from '../../../../components/providers/AppThemeProvider';
import SequencerTrack from '../SequencerTrack';

const mockCanvasContext = {
  beginPath: jest.fn(),
  clearRect: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  lineTo: jest.fn(),
  measureText: jest.fn(() => ({ width: 24 })),
  moveTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  setTransform: jest.fn(),
  stroke: jest.fn(),
};

const setMatchMedia = ({ mobile }: { mobile: boolean }) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width') ? mobile : false,
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

const renderTrack = () =>
  render(
    <AppThemeProvider>
      <SequencerTrack
        currentStep={0}
        totalSteps={16}
        stepsPerBar={16}
        beatsPerBar={4}
        tempoBpm={120}
        isPlaying={false}
        loopLengthBars={2}
        leadInBars={1}
        events={[]}
      />
    </AppThemeProvider>,
  );

describe('SequencerTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
      writable: true,
      value: jest.fn(() => mockCanvasContext),
    });

    class ResizeObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverMock,
    });

    Object.defineProperty(globalThis, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverMock,
    });
  });

  it('keeps full labels on desktop', () => {
    setMatchMedia({ mobile: false });

    renderTrack();

    expect(screen.getByText('Arrange')).toBeInTheDocument();
    expect(screen.getByText('Chord Track')).toBeInTheDocument();
    expect(screen.getByText('2 bars')).toBeInTheDocument();
    expect(screen.getByText('+1 bar lead-in')).toBeInTheDocument();
  });

  it('moves the track summary to the top on mobile', () => {
    setMatchMedia({ mobile: true });

    renderTrack();

    expect(screen.getByText('Chord Track')).toBeInTheDocument();
    expect(screen.getByText('120 BPM')).toBeInTheDocument();
    expect(screen.getByText('2 bars')).toBeInTheDocument();
    expect(screen.getByText('+1 bar lead-in')).toBeInTheDocument();
    expect(screen.queryByText('Arrange')).not.toBeInTheDocument();
  });
});
