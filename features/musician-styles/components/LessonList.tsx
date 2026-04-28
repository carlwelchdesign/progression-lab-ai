import type { GeneratedLesson } from '../types';

type LessonListProps = {
  lessons: GeneratedLesson[];
  activeLessonId: string | null;
  onSelect: (lessonId: string) => void;
};

export function LessonList({ lessons, activeLessonId, onSelect }: LessonListProps) {
  return (
    <aside className="space-y-2">
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          type="button"
          onClick={() => onSelect(lesson.id)}
          className={`block w-full rounded border p-2 text-left ${
            activeLessonId === lesson.id ? 'border-black' : 'border-gray-300'
          }`}
        >
          <div className="font-medium">{lesson.title}</div>
          <div className="text-xs text-gray-600">{lesson.estimatedMinutes} min</div>
        </button>
      ))}
    </aside>
  );
}
