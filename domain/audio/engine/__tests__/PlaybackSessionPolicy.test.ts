import { beginPlaybackSession } from '../PlaybackSessionPolicy';

describe('PlaybackSessionPolicy', () => {
  it('starts audio before stopping previous playback', async () => {
    let started = false;
    const startAudio = jest.fn(async () => {
      started = true;
    });
    const stopAllAudio = jest.fn(() => {
      if (!started) {
        throw new Error('stopAllAudio called before startAudio');
      }
    });

    await beginPlaybackSession({ startAudio, stopAllAudio });

    expect(startAudio).toHaveBeenCalledTimes(1);
    expect(stopAllAudio).toHaveBeenCalledTimes(1);
  });
});
