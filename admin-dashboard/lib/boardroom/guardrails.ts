import { createModelOutputInvalidError } from './errors';
import { BoardroomDecision } from './types';

const ALLOWED_DOMAIN_PATTERNS: RegExp[] = [
  /\bmusic\b/i,
  /\bmusician(s)?\b/i,
  /\bartist(s)?\b/i,
  /\bproducer(s)?\b/i,
  /\bcreator(s)?\b/i,
  /\bchord(s)?\b/i,
  /\bprogression(s)?\b/i,
  /\bsong(s)?\b/i,
  /\barrangement(s)?\b/i,
  /\baudio\b/i,
  /\bmidi\b/i,
  /\btrack(s)?\b/i,
  /\bpractice\b/i,
  /\blesson(s)?\b/i,
  /\bcomposition\b/i,
];

const FORBIDDEN_DOMAIN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'meal plan', pattern: /\bmeal\s*plan(s)?\b/i },
  { label: 'nutrition', pattern: /\bnutrition\b/i },
  { label: 'diet', pattern: /\bdiet(s)?\b/i },
  { label: 'fitness', pattern: /\bfitness\b/i },
  { label: 'workout', pattern: /\bworkout(s)?\b/i },
  { label: 'calorie', pattern: /\bcalorie(s)?\b/i },
  { label: 'real estate', pattern: /\breal\s*estate\b/i },
  { label: 'restaurant', pattern: /\brestaurant(s)?\b/i },
  { label: 'ecommerce', pattern: /\be-?commerce\b/i },
  { label: 'healthcare', pattern: /\bhealth\s*care|healthcare\b/i },
];

export function buildBusinessModelGuardrailInstruction(): string {
  return [
    'Business model guardrails (non-negotiable):',
    '- Stay within music product strategy only (music creation, learning, performance, or distribution).',
    '- Recommendations must align with a music SaaS model (subscription/freemium/add-ons) and creator outcomes.',
    '- Reject unrelated vertical pivots such as fitness, meal plans, healthcare, real estate, restaurants, or ecommerce.',
    '- If the prompt seems ambiguous, reinterpret it in-domain for a music product rather than changing industries.',
  ].join('\n');
}

function collectDecisionText(decision: BoardroomDecision): string {
  return [
    decision.decision,
    decision.reasoning,
    ...decision.keyTradeoffs,
    ...decision.risks,
    ...decision.actionPlan,
    ...decision.dissentingOpinions,
  ].join(' ');
}

export function validateBusinessModelDecision(decision: BoardroomDecision): BoardroomDecision {
  const allText = collectDecisionText(decision);
  const violations = FORBIDDEN_DOMAIN_PATTERNS.filter((rule) => rule.pattern.test(allText)).map(
    (rule) => rule.label,
  );

  if (violations.length > 0) {
    throw createModelOutputInvalidError('Decision is outside music business-model guardrails', {
      violations,
    });
  }

  const hasMusicDomainSignal = ALLOWED_DOMAIN_PATTERNS.some((pattern) => pattern.test(allText));
  if (!hasMusicDomainSignal) {
    throw createModelOutputInvalidError(
      'Decision lacks clear music-domain alignment required by business model guardrails',
    );
  }

  return decision;
}