import { render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import type { ComponentProps } from 'react';

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

const renderTrack = (props?: Partial<ComponentProps<typeof SequencerTrack>>) =>
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
        {...props}
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

  it('maps dropped pad coordinates to timeline steps', () => {
    setMatchMedia({ mobile: false });
    const onPadDropAtStep = jest.fn();

    renderTrack({ onPadDropAtStep });

    const lane = screen.getByLabelText('Chord timeline lane');
    Object.defineProperty(lane, 'getBoundingClientRect', {
      writable: true,
      value: () => ({ left: 0 }),
    });

    const dataTransfer = {
      getData: (key: string) =>
        key === 'application/x-ai-musician-pad' || key === 'text/plain' ? 'pad:pad-1' : '',
      dropEffect: 'none',
    } as unknown as DataTransfer;

    act(() => {
      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
      Object.defineProperty(dragOverEvent, 'clientX', { value: 325 });
      Object.defineProperty(dragOverEvent, 'dataTransfer', { value: dataTransfer });
      lane.dispatchEvent(dragOverEvent);
    });

    act(() => {
      const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, 'clientX', { value: 325 });
      Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
      lane.dispatchEvent(dropEvent);
    });

    expect(onPadDropAtStep).toHaveBeenCalledWith('pad-1', 2);
  });

  it('ignores pad drops while playback is active', () => {
    setMatchMedia({ mobile: false });
    const onPadDropAtStep = jest.fn();

    renderTrack({ onPadDropAtStep, isPlaying: true });

    const lane = screen.getByLabelText('Chord timeline lane');
    Object.defineProperty(lane, 'getBoundingClientRect', {
      writable: true,
      value: () => ({ left: 0 }),
    });

    const dataTransfer = {
      getData: (key: string) =>
        key === 'application/x-ai-musician-pad' || key === 'text/plain' ? 'pad:pad-1' : '',
      dropEffect: 'none',
    } as unknown as DataTransfer;

    act(() => {
      const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, 'clientX', { value: 325 });
      Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
      lane.dispatchEvent(dropEvent);
    });

    expect(onPadDropAtStep).not.toHaveBeenCalled();
  });

  it('maps empty-lane click to timeline step', () => {
    setMatchMedia({ mobile: false });
    const onLaneClickStep = jest.fn();

    renderTrack({ onLaneClickStep });

    const lane = screen.getByLabelText('Chord timeline lane');
    Object.defineProperty(lane, 'getBoundingClientRect', {
      writable: true,
      value: () => ({ left: 0 }),
    });

    act(() => {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 360 });
      lane.dispatchEvent(clickEvent);
    });

    expect(onLaneClickStep).toHaveBeenCalledWith(4);
  });
});
