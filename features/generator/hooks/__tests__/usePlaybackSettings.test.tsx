import { act, renderHook } from '@testing-library/react';

import usePlaybackSettings from '../usePlaybackSettings';

jest.mock('../../../../domain/audio/audio', () => ({
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

describe('usePlaybackSettings', () => {
  it('defaults rhodes to octave -1 and resets piano to octave 0 on instrument switch', () => {
    const { result } = renderHook(() => usePlaybackSettings());

    expect(result.current.settings.instrument).toBe('rhodes');
    expect(result.current.settings.octaveShift).toBe(-1);

    act(() => {
      result.current.changeHandlers.onOctaveShiftChange(2);
    });

    expect(result.current.settings.octaveShift).toBe(2);

    act(() => {
      result.current.changeHandlers.onInstrumentChange('piano');
    });

    expect(result.current.settings.instrument).toBe('piano');
    expect(result.current.settings.octaveShift).toBe(0);

    act(() => {
      result.current.changeHandlers.onInstrumentChange('rhodes');
    });

    expect(result.current.settings.instrument).toBe('rhodes');
    expect(result.current.settings.octaveShift).toBe(-1);
  });
});
