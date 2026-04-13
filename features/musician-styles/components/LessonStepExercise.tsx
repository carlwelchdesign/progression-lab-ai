import type { ExerciseStep } from '../types';

type LessonStepExerciseProps = {
  step: ExerciseStep;
  isMatched: boolean;
};

export function LessonStepExercise({ step, isMatched }: LessonStepExerciseProps) {
  return (
    <article className="space-y-2">
      <h3 className="text-xl font-semibold">Try It</h3>
      <p>{step.exercise.prompt}</p>
      <p className="text-sm text-gray-600">Target notes: {step.exercise.targetNotes.join(', ')}</p>
      <div
        className={`rounded border p-2 text-sm ${isMatched ? 'border-green-500 bg-green-50' : ''}`}
      >
        {isMatched ? 'MIDI match detected' : 'Waiting for MIDI input'}
      </div>
    </article>
  );
}
