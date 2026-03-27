import { act, renderHook } from '@testing-library/react';

import { stopAllAudio } from '../../../../domain/audio/audio';
import { stopGlobalPlayback, usePlaybackToggle } from '../usePlaybackToggle';

jest.mock('../../../../domain/audio/audio', () => ({
  stopAllAudio: jest.fn(),
}));

describe('usePlaybackToggle', () => {
  beforeEach(() => {
    stopGlobalPlayback();
    jest.clearAllMocks();
  });

  it('stopGlobalPlayback clears active playback state and stops audio', async () => {
    const { result } = renderHook(() => usePlaybackToggle());

    await act(async () => {
      await result.current.handlePlayToggle('idea-1', async () => {
        return;
      });
    });

    expect(result.current.playingId).toBe('idea-1');
    expect(result.current.initializingId).toBeNull();
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      stopGlobalPlayback();
    });

    expect(stopAllAudio).toHaveBeenCalledTimes(1);
    expect(result.current.playingId).toBeNull();
    expect(result.current.initializingId).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });

  it('syncs global reset across hook instances', async () => {
    const firstHook = renderHook(() => usePlaybackToggle());
    const secondHook = renderHook(() => usePlaybackToggle());

    await act(async () => {
      await firstHook.result.current.handlePlayToggle('shared-song', async () => {
        return;
      });
    });

    expect(firstHook.result.current.playingId).toBe('shared-song');
    expect(secondHook.result.current.playingId).toBeNull();

    act(() => {
      stopGlobalPlayback();
    });

    expect(stopAllAudio).toHaveBeenCalledTimes(1);
    expect(firstHook.result.current.playingId).toBeNull();
    expect(firstHook.result.current.initializingId).toBeNull();
    expect(firstHook.result.current.isPlaying).toBe(false);
    expect(secondHook.result.current.playingId).toBeNull();
    expect(secondHook.result.current.initializingId).toBeNull();
    expect(secondHook.result.current.isPlaying).toBe(false);

    firstHook.unmount();
    secondHook.unmount();
  });
});
