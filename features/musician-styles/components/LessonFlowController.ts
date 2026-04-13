export type LessonFlowState = 'idle' | 'stepCompleted' | 'autoAdvancing' | 'lessonCompleted';

export function transitionFlowState(
  current: LessonFlowState,
  event: 'COMPLETE_STEP' | 'AUTO_ADVANCE' | 'COMPLETE_LESSON' | 'RESET',
): LessonFlowState {
  if (event === 'RESET') {
    return 'idle';
  }

  if (event === 'COMPLETE_LESSON') {
    return 'lessonCompleted';
  }

  if (event === 'COMPLETE_STEP') {
    return 'stepCompleted';
  }

  if (event === 'AUTO_ADVANCE') {
    return current === 'stepCompleted' ? 'autoAdvancing' : current;
  }

  return current;
}

export function shouldIgnoreDuplicateMidiMatch(
  lastMatchTs: number | null,
  nowTs: number,
  thresholdMs = 350,
): boolean {
  if (lastMatchTs === null) {
    return false;
  }

  return nowTs - lastMatchTs < thresholdMs;
}
