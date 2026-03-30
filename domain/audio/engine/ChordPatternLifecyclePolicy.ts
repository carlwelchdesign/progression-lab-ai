type LoopablePart = {
  loop: boolean;
  loopStart: number;
  loopEnd: number;
};

type ApplyChordPatternLifecyclePolicyParams = {
  loop: boolean;
  part: LoopablePart;
  barDurationSeconds: number;
  scheduleCleanup: (cleanupDelayMs: number) => void;
};

const CLEANUP_PADDING_SECONDS = 0.15;

export const applyChordPatternLifecyclePolicy = ({
  loop,
  part,
  barDurationSeconds,
  scheduleCleanup,
}: ApplyChordPatternLifecyclePolicyParams): void => {
  if (loop) {
    part.loop = true;
    part.loopStart = 0;
    part.loopEnd = barDurationSeconds;
    return;
  }

  scheduleCleanup((barDurationSeconds + CLEANUP_PADDING_SECONDS) * 1000);
};
