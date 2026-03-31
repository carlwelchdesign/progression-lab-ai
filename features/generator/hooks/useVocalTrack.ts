import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';

import type { VocalTake } from '../../../lib/types';

const RECORDING_TIMESLICE_MS = 100;

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

type UseVocalTrackProps = {
  tempoBpm: number;
  totalSteps: number;
};

export type UseVocalTrackReturn = {
  takes: VocalTake[];
  isVocalRecording: boolean;
  permissionStatus: PermissionStatus;
  errorMessage: string | null;
  selectedTakeId: string | null;
  setSelectedTakeId: React.Dispatch<React.SetStateAction<string | null>>;
  requestMicPermission: () => Promise<boolean>;
  startVocalRecording: (startStep: number) => Promise<boolean>;
  stopVocalRecording: () => void;
  startVocalPlayback: (fromStep: number) => Promise<void>;
  stopVocalPlayback: () => void;
  deleteTake: (takeId: string) => void;
  toggleMuteTake: (takeId: string) => void;
  setTakeGain: (takeId: string, gain: number) => void;
};

function clampStep(step: number, totalSteps: number): number {
  if (totalSteps <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(totalSteps - 1, step));
}

function clampGain(gain: number): number {
  if (!Number.isFinite(gain)) {
    return 1;
  }

  return Math.max(0, Math.min(1, gain));
}

function getStepDurationSeconds(tempoBpm: number): number {
  return 60 / Math.max(1, tempoBpm) / 4;
}

export function useVocalTrack({ tempoBpm, totalSteps }: UseVocalTrackProps): UseVocalTrackReturn {
  const [takes, setTakes] = useState<VocalTake[]>([]);
  const [isVocalRecording, setIsVocalRecording] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTakeId, setSelectedTakeId] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const pendingChunksRef = useRef<BlobPart[]>([]);
  const recordingStartStepRef = useRef(0);
  const recordingStartAtMsRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Array<{ source: AudioBufferSourceNode; gain: GainNode }>>([]);
  const takesRef = useRef<VocalTake[]>([]);

  const stepDurationSeconds = useMemo(() => getStepDurationSeconds(tempoBpm), [tempoBpm]);

  useEffect(() => {
    takesRef.current = takes;
  }, [takes]);

  const resolveAudioContext = useCallback((): AudioContext => {
    if (audioContextRef.current) {
      return audioContextRef.current;
    }

    const toneContext = Tone.getContext().rawContext;
    audioContextRef.current = toneContext as AudioContext;
    return audioContextRef.current;
  }, []);

  const stopVocalPlayback = useCallback(() => {
    activeSourcesRef.current.forEach(({ source, gain }) => {
      try {
        source.stop();
      } catch {
        // source may already be stopped
      }
      source.disconnect();
      gain.disconnect();
    });
    activeSourcesRef.current = [];
  }, []);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus('unsupported');
      setErrorMessage('Microphone recording is not supported in this browser.');
      return false;
    }

    if (streamRef.current) {
      setPermissionStatus('granted');
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus('granted');
      setErrorMessage(null);
      return true;
    } catch {
      setPermissionStatus('denied');
      setErrorMessage('Microphone permission is required to record vocals.');
      return false;
    }
  }, []);

  const startVocalRecording = useCallback(
    async (startStep: number): Promise<boolean> => {
      if (isVocalRecording) {
        return false;
      }

      const hasPermission = await requestMicPermission();
      if (!hasPermission || !streamRef.current) {
        return false;
      }

      if (typeof MediaRecorder === 'undefined') {
        setPermissionStatus('unsupported');
        setErrorMessage('MediaRecorder is not available in this browser.');
        return false;
      }

      setErrorMessage(null);
      pendingChunksRef.current = [];
      recordingStartStepRef.current = clampStep(startStep, totalSteps);
      recordingStartAtMsRef.current = Date.now();

      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          pendingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(pendingChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        pendingChunksRef.current = [];

        const elapsedMs = Math.max(0, Date.now() - recordingStartAtMsRef.current);
        const elapsedSteps = Math.max(1, Math.round(elapsedMs / 1000 / stepDurationSeconds));

        const take: VocalTake = {
          id: `vocal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          startStep: clampStep(recordingStartStepRef.current, totalSteps),
          durationSteps: elapsedSteps,
          blob,
          url: URL.createObjectURL(blob),
          gainValue: 1,
          isMuted: false,
        };

        setTakes((prev) => [...prev, take]);
        setSelectedTakeId(take.id);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(RECORDING_TIMESLICE_MS);
      setIsVocalRecording(true);
      return true;
    },
    [isVocalRecording, requestMicPermission, stepDurationSeconds, totalSteps],
  );

  const stopVocalRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    mediaRecorderRef.current = null;
    setIsVocalRecording(false);
  }, []);

  const startVocalPlayback = useCallback(
    async (fromStep: number) => {
      if (takes.length === 0) {
        return;
      }

      const audioContext = resolveAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      stopVocalPlayback();

      const normalizedFromStep = clampStep(fromStep, totalSteps);

      for (const take of takes) {
        if (take.isMuted) {
          continue;
        }

        let audioBuffer = take.audioBuffer;
        if (!audioBuffer) {
          try {
            const arrayBuffer = await take.blob.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
          } catch {
            continue;
          }

          setTakes((prev) =>
            prev.map((candidate) =>
              candidate.id === take.id ? { ...candidate, audioBuffer } : candidate,
            ),
          );
        }

        if (!audioBuffer) {
          continue;
        }

        const takeStartStep = clampStep(take.startStep, totalSteps);
        const takeEndStep = takeStartStep + Math.max(1, take.durationSteps);

        if (normalizedFromStep >= takeEndStep) {
          continue;
        }

        const delaySteps = Math.max(0, takeStartStep - normalizedFromStep);
        const offsetSteps = Math.max(0, normalizedFromStep - takeStartStep);
        const startDelaySeconds = delaySteps * stepDurationSeconds;
        const offsetSeconds = offsetSteps * stepDurationSeconds;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const gain = audioContext.createGain();
        gain.gain.value = clampGain(take.gainValue);

        source.connect(gain);
        gain.connect(audioContext.destination);

        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          activeSourcesRef.current = activeSourcesRef.current.filter(
            (entry) => entry.source !== source,
          );
        };

        source.start(audioContext.currentTime + startDelaySeconds, offsetSeconds);
        activeSourcesRef.current.push({ source, gain });
      }
    },
    [resolveAudioContext, stepDurationSeconds, stopVocalPlayback, takes, totalSteps],
  );

  const deleteTake = useCallback((takeId: string) => {
    setTakes((prev) => {
      const next = prev.filter((take) => {
        if (take.id !== takeId) {
          return true;
        }

        URL.revokeObjectURL(take.url);
        return false;
      });

      return next;
    });
    setSelectedTakeId((prev) => (prev === takeId ? null : prev));
  }, []);

  const toggleMuteTake = useCallback((takeId: string) => {
    setTakes((prev) =>
      prev.map((take) =>
        take.id === takeId
          ? {
              ...take,
              isMuted: !take.isMuted,
            }
          : take,
      ),
    );
  }, []);

  const setTakeGain = useCallback((takeId: string, gain: number) => {
    const clampedGain = clampGain(gain);
    setTakes((prev) =>
      prev.map((take) =>
        take.id === takeId
          ? {
              ...take,
              gainValue: clampedGain,
            }
          : take,
      ),
    );
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isVocalRecording) {
        stopVocalRecording();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVocalRecording, stopVocalRecording]);

  useEffect(() => {
    return () => {
      stopVocalPlayback();
      stopVocalRecording();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      takesRef.current.forEach((take) => {
        URL.revokeObjectURL(take.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: cleanup uses refs to avoid infinite loop
  }, []);

  return {
    takes,
    isVocalRecording,
    permissionStatus,
    errorMessage,
    selectedTakeId,
    setSelectedTakeId,
    requestMicPermission,
    startVocalRecording,
    stopVocalRecording,
    startVocalPlayback,
    stopVocalPlayback,
    deleteTake,
    toggleMuteTake,
    setTakeGain,
  };
}
