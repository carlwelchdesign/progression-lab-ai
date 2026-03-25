import { useRef, useState, useCallback } from 'react';
import { stopAllAudio } from '../../../domain/audio/audio';

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
  const autoResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoResetTimeout = useCallback(() => {
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  }, []);

  const scheduleAutoReset = useCallback(
    (id: string | number, autoResetAfterMs?: number) => {
      clearAutoResetTimeout();

      if (!autoResetAfterMs || autoResetAfterMs <= 0) {
        return;
      }

      autoResetTimeoutRef.current = setTimeout(() => {
        setPlayingId((current) => (current === id ? null : current));
        autoResetTimeoutRef.current = null;
      }, autoResetAfterMs);
    },
    [clearAutoResetTimeout],
  );

  const handlePlayToggle = useCallback(
    (id: string | number, playCallback: () => void, autoResetAfterMs?: number) => {
      if (playingId === id) {
        stopAllAudio();
        clearAutoResetTimeout();
        setPlayingId(null);
        return;
      }

      if (playingId !== null) {
        stopAllAudio();
      }

      setPlayingId(id);

      try {
        playCallback();
        scheduleAutoReset(id, autoResetAfterMs);
      } catch {
        clearAutoResetTimeout();
        setPlayingId(null);
      }
    },
    [clearAutoResetTimeout, playingId, scheduleAutoReset],
  );

  return {
    isPlaying: playingId !== null,
    playingId,
    handlePlayToggle,
  };
}

const CHORD_BEATS = 2;
const PLAYBACK_FINISH_BUFFER_MS = 300;

export const getProgressionAutoResetMs = (voicingCount: number, tempoBpm: number): number => {
  if (voicingCount <= 0) {
    return 0;
  }

  const safeTempo = Number.isFinite(tempoBpm) && tempoBpm > 0 ? tempoBpm : 100;
  const chordDurationSeconds = (60 / safeTempo) * CHORD_BEATS;

  return Math.ceil(voicingCount * chordDurationSeconds * 1000 + PLAYBACK_FINISH_BUFFER_MS);
};
