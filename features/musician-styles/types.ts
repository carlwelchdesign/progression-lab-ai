export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type TextStep = {
  type: 'text';
  heading: string;
  body: string;
  tip?: string;
};

export type ExerciseStep = {
  type: 'exercise';
  exercise: {
    id: string;
    prompt: string;
    chord: string;
    hint?: string;
    targetNotes: string[];
  };
};

export type GeneratedStep = TextStep | ExerciseStep;

export type GeneratedLesson = {
  id: string;
  title: string;
  estimatedMinutes: number;
  batchNumber: number;
  skillLevel: SkillLevel;
  steps: GeneratedStep[];
};

export type PreviousLessonSummary = {
  lessonId: string;
  title: string;
  conceptCovered: string;
  skillLevel: SkillLevel;
};

export type GeneratedCurriculumData = {
  musicianIntro: string;
  skillLevelAssessment: string;
  currentBatch: number;
  lessons: GeneratedLesson[];
  previousLessonSummaries?: PreviousLessonSummary[];
};

export type MusicianProfileSummary = {
  id: string;
  slug: string;
  displayName: string;
  genre: string;
  era: string;
  tagline: string;
  signatureTechniques: string[];
  exampleSongs: string[];
  preferredKeys: string[];
  sortOrder: number;
  isCustom: boolean;
};

export type MusicianStyleResponse = {
  musician: MusicianProfileSummary;
  curriculum: GeneratedCurriculumData | null;
  curriculumStale: boolean;
};
