// ── Generated curriculum shape ────────────────────────────────────────────────
// Structurally identical to CourseLesson[] so CourseLessonPlayer works unchanged.

export type GeneratedExercise = {
  id: string;
  prompt: string;
  chord: string;
  hint?: string;
  targetNotes?: string[];
};

export type GeneratedStep =
  | { type: 'text'; heading: string; body: string; tip?: string }
  | { type: 'exercise'; exercise: GeneratedExercise };

export type GeneratedLesson = {
  id: string;
  title: string;
  estimatedMinutes: number;
  steps: GeneratedStep[];
};

export type GeneratedCurriculumData = {
  musicianIntro: string;
  skillLevelAssessment: string;
  lessons: GeneratedLesson[];
};

// ── API response shapes ───────────────────────────────────────────────────────

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
};

export type MusicianStyleResponse = {
  musician: MusicianProfileSummary;
  curriculum: GeneratedCurriculumData | null;
  curriculumStale: boolean;
};
