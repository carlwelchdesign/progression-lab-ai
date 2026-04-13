import {
  appendCurriculumBatch,
  getIncompleteLessonIds,
  getNextBatchNumber,
} from '../curriculumGenerationService';
import type { GeneratedCurriculumData } from '../../types';

describe('curriculumGenerationService continuation helpers', () => {
  const batch1: GeneratedCurriculumData = {
    musicianIntro: 'Intro',
    skillLevelAssessment: 'Beginner',
    currentBatch: 1,
    lessons: [
      {
        id: 'l1',
        title: 'L1',
        estimatedMinutes: 8,
        batchNumber: 1,
        skillLevel: 'beginner',
        steps: [],
      },
    ],
  };

  const batch2: GeneratedCurriculumData = {
    musicianIntro: 'Intro',
    skillLevelAssessment: 'Intermediate',
    currentBatch: 2,
    lessons: [
      {
        id: 'l2',
        title: 'L2',
        estimatedMinutes: 9,
        batchNumber: 2,
        skillLevel: 'intermediate',
        steps: [],
      },
    ],
  };

  it('computes next batch number', () => {
    expect(getNextBatchNumber(null)).toBe(1);
    expect(getNextBatchNumber(batch1)).toBe(2);
  });

  it('appends new lessons to existing curriculum', () => {
    const merged = appendCurriculumBatch(batch1, batch2);
    expect(merged.lessons).toHaveLength(2);
    expect(merged.currentBatch).toBe(2);
  });

  it('detects incomplete lessons by id', () => {
    const incomplete = getIncompleteLessonIds(
      { ...batch1, lessons: [batch1.lessons[0], batch2.lessons[0]] },
      new Set(['l1']),
    );
    expect(incomplete).toEqual(['l2']);
  });
});
