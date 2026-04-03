import { createModelOutputInvalidError } from './errors';
import { BoardroomDecision, BoardroomFeatureCatalog } from './types';
import { BoardroomProductCharter } from './productCharter';

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

const GLOBAL_AVAILABILITY_PATTERNS: RegExp[] = [
  /\ball users\b/i,
  /\bevery user\b/i,
  /\beveryone\b/i,
  /\bfree users\b/i,
  /\bfor all plans\b/i,
  /\bavailable to all\b/i,
];

const FEATURE_REFERENCE_RULES: Array<{
  feature: keyof BoardroomFeatureCatalog['capabilities'];
  patterns: RegExp[];
  label: string;
}> = [
  {
    feature: 'canExportMidi',
    label: 'MIDI export',
    patterns: [/\bmidi export\b/i, /\bexport midi\b/i, /\bdownload midi\b/i],
  },
  {
    feature: 'canExportPdf',
    label: 'PDF export',
    patterns: [/\bpdf export\b/i, /\bexport pdf\b/i, /\bsheet music pdf\b/i],
  },
  {
    feature: 'canSharePublicly',
    label: 'public sharing',
    patterns: [/\bshare publicly\b/i, /\bpublic sharing\b/i, /\bpublic link\b/i],
  },
  {
    feature: 'canUseVocalTrackRecording',
    label: 'vocal recording',
    patterns: [
      /\bvocal recording\b/i,
      /\bvocal track\b/i,
      /\brecord vocal\b/i,
      /\bmulti-?take vocal\b/i,
    ],
  },
  {
    feature: 'canUseAdvancedVoicingControls',
    label: 'advanced voicing controls',
    patterns: [/\badvanced voicing\b/i, /\bvoicing controls\b/i],
  },
];

export function validateDecisionAgainstFeatureCatalog(params: {
  decision: BoardroomDecision;
  featureCatalog: BoardroomFeatureCatalog;
}): BoardroomDecision {
  const allText = collectDecisionText(params.decision);

  // Split into sentences to avoid false positives from cross-sentence co-occurrence.
  // A violation only fires when a global-availability claim and a restricted-feature
  // reference appear within the same sentence.
  const sentences = allText.split(/[.!?]+/).filter(Boolean);

  const violations = FEATURE_REFERENCE_RULES.filter((rule) => {
    if (params.featureCatalog.capabilities[rule.feature].isAvailableToAll) {
      return false;
    }

    return sentences.some(
      (sentence) =>
        rule.patterns.some((pattern) => pattern.test(sentence)) &&
        GLOBAL_AVAILABILITY_PATTERNS.some((globalPattern) => globalPattern.test(sentence)),
    );
  }).map((rule) => rule.label);

  if (violations.length > 0) {
    throw createModelOutputInvalidError(
      'Decision claims all-user availability for capabilities that are not available to all plans',
      {
        violations,
      },
    );
  }

  return params.decision;
}

/**
 * Validate decision against product charter non-goals.
 * Flags if decision recommends building capabilities that are explicitly out of scope.
 */
export function validateDecisionAgainstNonGoals(params: {
  decision: BoardroomDecision;
  productCharter: BoardroomProductCharter;
}): BoardroomDecision {
  const allText = collectDecisionText(params.decision);

  // Create pattern rules from non-goals
  const nonGoalViolations = params.productCharter.nonGoals
    .flatMap((nonGoal) => {
      const nonGoalTerms = [nonGoal.category, ...nonGoal.examples].map((term) =>
        term.toLowerCase(),
      );
      return nonGoalTerms.map((term) => ({
        term,
        category: nonGoal.category,
        pattern: new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
      }));
    })
    .filter((rule) => rule.pattern.test(allText));

  if (nonGoalViolations.length > 0) {
    const categories = [...new Set(nonGoalViolations.map((v) => v.category))];
    throw createModelOutputInvalidError(
      'Decision recommends out-of-scope capabilities that are explicitly non-goals',
      {
        violations: categories,
        reason: 'Product charter explicitly non-goals these categories',
      },
    );
  }

  return params.decision;
}
