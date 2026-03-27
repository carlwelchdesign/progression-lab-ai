import { useCallback, useEffect, useRef, useState } from 'react';
import { stopAllAudio } from '../../../domain/audio/audio';

type PlaybackPhase = 'idle' | 'initializing' | 'playing';

type GlobalPlaybackState = {
  key: string | null;
  phase: PlaybackPhase;
  requestId: number;
};

let playbackInstanceCounter = 0;
let playbackRequestCounter = 0;

let globalPlaybackState: GlobalPlaybackState = {
  key: null,
  phase: 'idle',
  requestId: 0,
};

const globalPlaybackListeners = new Set<(state: GlobalPlaybackState) => void>();

const getGlobalPlaybackState = (): GlobalPlaybackState => globalPlaybackState;

const notifyGlobalPlaybackListeners = (): void => {
  globalPlaybackListeners.forEach((listener) => listener(globalPlaybackState));
};

const setGlobalPlaybackState = (nextState: GlobalPlaybackState): void => {
  globalPlaybackState = nextState;
  notifyGlobalPlaybackListeners();
};

const getNextPlaybackRequestId = (): number => {
  playbackRequestCounter += 1;
  return playbackRequestCounter;
};

const subscribeToGlobalPlayback = (
  listener: (state: GlobalPlaybackState) => void,
): (() => void) => {
  globalPlaybackListeners.add(listener);
  return () => {
    globalPlaybackListeners.delete(listener);
  };
};

export const stopGlobalPlayback = (): void => {
  stopAllAudio();
  setGlobalPlaybackState({
    key: null,
    phase: 'idle',
    requestId: getNextPlaybackRequestId(),
  });
};

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
  const instancePrefixRef = useRef(`playback-${(playbackInstanceCounter += 1)}`);
  const [globalState, setGlobalState] = useState<GlobalPlaybackState>(() =>
    getGlobalPlaybackState(),
  );
  const scopedIdMapRef = useRef(new Map<string, string | number>());
  const autoResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return subscribeToGlobalPlayback(setGlobalState);
  }, []);

  const toScopedKey = useCallback((id: string | number): string => {
    const scopedKey = `${instancePrefixRef.current}::${String(id)}`;
    scopedIdMapRef.current.set(scopedKey, id);
    return scopedKey;
  }, []);

  const localActiveId = globalState.key
    ? (scopedIdMapRef.current.get(globalState.key) ?? null)
    : null;

  const playingId = globalState.phase === 'playing' ? localActiveId : null;
  const initializingId = globalState.phase === 'initializing' ? localActiveId : null;

  const clearAutoResetTimeout = useCallback(() => {
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  }, []);

  const scheduleAutoReset = useCallback(
    (scopedKey: string, requestId: number, autoResetAfterMs?: number) => {
      clearAutoResetTimeout();

      if (!autoResetAfterMs || autoResetAfterMs <= 0) {
        return;
      }

      autoResetTimeoutRef.current = setTimeout(() => {
        const currentState = getGlobalPlaybackState();
        if (currentState.key !== scopedKey || currentState.requestId !== requestId) {
          return;
        }

        setGlobalPlaybackState({
          key: null,
          phase: 'idle',
          requestId: getNextPlaybackRequestId(),
        });
        autoResetTimeoutRef.current = null;
      }, autoResetAfterMs);
    },
    [clearAutoResetTimeout],
  );

  useEffect(() => {
    return () => {
      clearAutoResetTimeout();
    };
  }, [clearAutoResetTimeout]);

  const cancelActivePlayback = useCallback(() => {
    clearAutoResetTimeout();
    stopGlobalPlayback();
  }, [clearAutoResetTimeout]);

  const handlePlayToggle = useCallback(
    async (
      id: string | number,
      playCallback: () => void | Promise<void>,
      autoResetAfterMs?: number,
    ) => {
      const scopedKey = toScopedKey(id);
      const currentState = getGlobalPlaybackState();

      if (currentState.key === scopedKey && currentState.phase !== 'idle') {
        cancelActivePlayback();
        return;
      }

      if (currentState.phase !== 'idle') {
        stopAllAudio();
        clearAutoResetTimeout();
      }

      const requestId = getNextPlaybackRequestId();
      setGlobalPlaybackState({
        key: scopedKey,
        phase: 'initializing',
        requestId,
      });

      try {
        await Promise.resolve(playCallback());

        const stateAfterInit = getGlobalPlaybackState();
        if (stateAfterInit.key !== scopedKey || stateAfterInit.requestId !== requestId) {
          return;
        }

        setGlobalPlaybackState({
          key: scopedKey,
          phase: 'playing',
          requestId,
        });
        scheduleAutoReset(scopedKey, requestId, autoResetAfterMs);
      } catch {
        const stateAfterError = getGlobalPlaybackState();
        if (stateAfterError.key !== scopedKey || stateAfterError.requestId !== requestId) {
          return;
        }

        clearAutoResetTimeout();
        setGlobalPlaybackState({
          key: null,
          phase: 'idle',
          requestId: getNextPlaybackRequestId(),
        });
      }
    },
    [cancelActivePlayback, clearAutoResetTimeout, scheduleAutoReset, toScopedKey],
  );

  return {
    isPlaying: playingId !== null || initializingId !== null,
    playingId,
    initializingId,
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
