'use client';

import { useMemo, useState } from 'react';

import { useGeneratedCurriculum } from '../hooks/useGeneratedCurriculum';
import { CurriculumStatusBar } from './CurriculumStatusBar';
import { LessonList } from './LessonList';
import { LessonPlayer } from './LessonPlayer';

type MusicianStylePageProps = {
  slug: string;
};

export function MusicianStylePage({ slug }: MusicianStylePageProps) {
  const { curriculum, curriculumStale, loading, error, generate, decideStaleCurriculum } =
    useGeneratedCurriculum(slug);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const selectedLesson = useMemo(() => {
    if (!curriculum) {
      return null;
    }

    const lessonId = selectedLessonId ?? curriculum.lessons[0]?.id;
    return curriculum.lessons.find((lesson) => lesson.id === lessonId) ?? null;
  }, [curriculum, selectedLessonId]);

  if (loading && !curriculum) {
    return <main>Loading lessons...</main>;
  }

  if (error) {
    return <main className="text-red-600">{error}</main>;
  }

  if (!curriculum) {
    return (
      <main className="space-y-4">
        <p>No curriculum generated yet.</p>
        <button
          type="button"
          onClick={() => void generate(false)}
          className="rounded border px-3 py-2"
        >
          Generate Lessons
        </button>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <CurriculumStatusBar
        curriculumStale={curriculumStale}
        onRegenerate={() => void decideStaleCurriculum('regenerate')}
      />
      <div className="grid gap-4 md:grid-cols-[280px,1fr]">
        <LessonList
          lessons={curriculum.lessons}
          activeLessonId={selectedLesson?.id ?? null}
          onSelect={setSelectedLessonId}
        />
        <LessonPlayer
          lesson={selectedLesson}
          onStartNextLesson={() => {
            if (!curriculum || !selectedLesson) {
              return;
            }

            const currentIndex = curriculum.lessons.findIndex(
              (lesson) => lesson.id === selectedLesson.id,
            );
            if (currentIndex === -1) {
              return;
            }

            const nextLesson = curriculum.lessons[currentIndex + 1];
            if (nextLesson) {
              setSelectedLessonId(nextLesson.id);
              return;
            }

            void generate(false);
          }}
        />
      </div>
    </main>
  );
}
