export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type LessonStep = {
  heading: string;
  body: string;
  tip?: string;
};

export type LessonContent = {
  intro: string;
  steps: LessonStep[];
  summary: string;
  relatedChords?: string[];
};

export type Lesson = {
  id: string;
  skillLevel: SkillLevel;
  title: string;
  description: string;
  durationMinutes: number;
  component: 'text' | 'cof';
  content?: LessonContent;
};
