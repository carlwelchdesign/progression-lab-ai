import OpenAI from 'openai';

import { curriculumJsonSchema } from '../../../app/api/musician-styles/curriculumSchema';
import type {
  GeneratedCurriculumData,
  GeneratedLesson,
  MusicianProfileSummary,
  PreviousLessonSummary,
  SkillLevel,
} from '../types';

let client: OpenAI | null = null;

function getOpenAiClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

function buildFallbackLessons(
  skillLevel: SkillLevel,
  batchNumber: number,
  slug: string,
): GeneratedLesson[] {
  const base = (batchNumber - 1) * 3;

  return [1, 2, 3].map((value) => ({
    id: `${slug}-lesson-${base + value}`,
    title: `Lesson ${base + value}: Style Essentials`,
    estimatedMinutes: 8,
    batchNumber,
    skillLevel,
    steps: [
      {
        type: 'text',
        heading: 'Hook',
        body: 'Quick story context for the style and why it matters.',
      },
      {
        type: 'exercise',
        exercise: {
          id: `${slug}-exercise-${base + value}`,
          prompt: 'Play the target voicing on your MIDI keyboard.',
          chord: 'Cmaj7',
          targetNotes: ['C4', 'E4', 'G4', 'B4'],
        },
      },
      {
        type: 'text',
        heading: 'Why It Works',
        body: 'Connect the sound to the underlying theory.',
      },
    ],
  }));
}

export async function generateCurriculumBatch(options: {
  musician: MusicianProfileSummary & {
    promptTemplate?: string;
    styleDescription?: string;
    slug: string;
  };
  skillLevel: SkillLevel;
  batchNumber: number;
  previousLessons: PreviousLessonSummary[];
  model: string;
}): Promise<GeneratedCurriculumData> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      musicianIntro: `${options.musician.displayName} mentor path`,
      skillLevelAssessment: `Starting at ${options.skillLevel}`,
      currentBatch: options.batchNumber,
      previousLessonSummaries: options.previousLessons,
      lessons: buildFallbackLessons(options.skillLevel, options.batchNumber, options.musician.slug),
    };
  }

  const input = {
    musician: options.musician,
    skillLevel: options.skillLevel,
    batchNumber: options.batchNumber,
    previousLessons: options.previousLessons,
    constraints: {
      midiRequired: true,
      lowClickFlow: true,
      stepOrder: [
        'Hook',
        'Concept',
        'Hear+See It',
        'Try It',
        'Why It Works',
        'Real Song Connection',
      ],
    },
  };

  try {
    const response = await getOpenAiClient().responses.create({
      model: options.model,
      input: JSON.stringify(input),
      instructions:
        options.musician.promptTemplate ??
        `Create JSON piano lessons in the style of ${options.musician.displayName}.`,
      text: {
        format: {
          type: 'json_schema',
          ...curriculumJsonSchema,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as GeneratedCurriculumData;
    return parsed;
  } catch {
    return {
      musicianIntro: `${options.musician.displayName} mentor path`,
      skillLevelAssessment: `Starting at ${options.skillLevel}`,
      currentBatch: options.batchNumber,
      previousLessonSummaries: options.previousLessons,
      lessons: buildFallbackLessons(options.skillLevel, options.batchNumber, options.musician.slug),
    };
  }
}

export function getNextBatchNumber(existing: GeneratedCurriculumData | null): number {
  if (!existing) {
    return 1;
  }

  return Math.max(1, existing.currentBatch + 1);
}

export function appendCurriculumBatch(
  existing: GeneratedCurriculumData | null,
  nextBatch: GeneratedCurriculumData,
): GeneratedCurriculumData {
  if (!existing) {
    return nextBatch;
  }

  return {
    musicianIntro: existing.musicianIntro,
    skillLevelAssessment: nextBatch.skillLevelAssessment,
    currentBatch: nextBatch.currentBatch,
    previousLessonSummaries: nextBatch.previousLessonSummaries,
    lessons: [...existing.lessons, ...nextBatch.lessons],
  };
}

export function getIncompleteLessonIds(
  curriculum: GeneratedCurriculumData,
  completedLessonIds: Set<string>,
): string[] {
  return curriculum.lessons
    .map((lesson) => lesson.id)
    .filter((lessonId) => !completedLessonIds.has(lessonId));
}
