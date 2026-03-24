import { useState, useCallback } from 'react';
import { stopAllAudio } from '../../lib/audio';

/**
 * Hook that provides play/stop toggle functionality with a single active playback state.
 *
 * Usage:
 *   const { isPlaying, playingId, handlePlayToggle } = usePlaybackToggle();
 *
 *   <Button onClick={() => handlePlayToggle(id, () => playProgression(...))}>
 *     {playingId === id ? 'Stop' : 'Play'}
 *   </Button>
 */
export function usePlaybackToggle() {
  const [playingId, setPlayingId] = useState<string | number | null>(null);

  const handlePlayToggle = useCallback(
    (id: string | number, playCallback: () => void) => {
      if (playingId === id) {
        // Currently playing this ID - stop it
        stopAllAudio();
        setPlayingId(null);
      } else {
        // Not playing or playing different ID - play this one
        playCallback();
        setPlayingId(id);
      }
    },
    [playingId],
  );

  return {
    isPlaying: playingId !== null,
    playingId,
    handlePlayToggle,
  };
}
