import type { TextStep } from '../types';

type LessonStepTextProps = {
  step: TextStep;
};

export function LessonStepText({ step }: LessonStepTextProps) {
  return (
    <article className="space-y-2">
      <h3 className="text-xl font-semibold">{step.heading}</h3>
      <p>{step.body}</p>
      {step.tip ? <p className="text-sm text-gray-600">Tip: {step.tip}</p> : null}
    </article>
  );
}
