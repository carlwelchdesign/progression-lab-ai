import { shouldIgnoreDuplicateMidiMatch, transitionFlowState } from '../LessonFlowController';

describe('LessonFlowController', () => {
  it('moves through complete-step and auto-advance states', () => {
    const stepCompleted = transitionFlowState('idle', 'COMPLETE_STEP');
    const autoAdvancing = transitionFlowState(stepCompleted, 'AUTO_ADVANCE');

    expect(stepCompleted).toBe('stepCompleted');
    expect(autoAdvancing).toBe('autoAdvancing');
  });

  it('debounces duplicate midi matches', () => {
    expect(shouldIgnoreDuplicateMidiMatch(1000, 1100, 350)).toBe(true);
    expect(shouldIgnoreDuplicateMidiMatch(1000, 1500, 350)).toBe(false);
  });
});
