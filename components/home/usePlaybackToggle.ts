import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { stopAllAudio } from '../../lib/audio';

/**
 * Hook that provides play/stop toggle functionality with a single active playback state.
 * Automatically resets to play state when audio finishes.
 *
 * Usage:
 *   const { isPlaying, playingId, handlePlayToggle } = usePlaybackToggle();
 *
 *   <IconButton onClick={() => handlePlayToggle(id, () => playProgression(...))}>
 *     {playingId === id ? <StopIcon /> : <PlayIcon />}
 *   </IconButton>
 */
export function usePlaybackToggle() {
  const [playingId, setPlayingId] = useState<string | number | null>(null);
  const userInitiatedStopRef = useRef(false);

  const handlePlayToggle = useCallback(
    (id: string | number, playCallback: () => void) => {
      if (playingId === id) {
        // Currently playing this ID - user wants to stop it
        userInitiatedStopRef.current = true;
        stopAllAudio();
        setPlayingId(null);
      } else {
        // Not playing or playing different ID - play this one
        userInitiatedStopRef.current = false;
        playCallback();
        setPlayingId(id);
      }
    },
    [playingId],
  );

  // Listen for when Tone.js Transport stops (audio naturally finishes playing)
  useEffect(() => {
    if (!playingId) return;

    const handleTransportStop = () => {
      // Only reset state if this wasn't a user-initiated stop
      if (!userInitiatedStopRef.current) {
        setPlayingId(null);
      }
      userInitiatedStopRef.current = false;
    };

    Tone.Transport.on('stop', handleTransportStop);

    return () => {
      Tone.Transport.off('stop', handleTransportStop);
    };
  }, [playingId]);

  return {
    isPlaying: playingId !== null,
    playingId,
    handlePlayToggle,
  };
}
