import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseBoardroomRunRequest,
  parseDecisionResponse,
  parseIndependentResponse,
} from './validation';
import { validateBusinessModelDecision } from './guardrails';

test('parseBoardroomRunRequest trims and accepts minimal payload', () => {
  const result = parseBoardroomRunRequest({
    question: '  Should we raise prices this quarter?  ',
  });

  assert.equal(result.question, 'Should we raise prices this quarter?');
});

test('parseIndependentResponse throws on missing recommendation', () => {
  assert.throws(
    () =>
      parseIndependentResponse({
        recommendation: '',
        reasoning: 'Some reasoning',
      }),
    {
      message: /Independent response missing recommendation or reasoning/,
    },
  );
});

test('parseDecisionResponse enforces required final shape', () => {
  const result = parseDecisionResponse({
    decision: 'Launch market test with capped spend',
    reasoning: 'Balances speed and downside control',
    keyTradeoffs: ['Faster validation vs lower confidence'],
    risks: ['Attribution noise in first month'],
    actionPlan: ['Define test cohort', 'Launch campaign', 'Review weekly KPIs'],
    dissentingOpinions: ['CFO prefers narrower region test'],
  });

  assert.equal(result.actionPlan.length, 3);
  assert.equal(result.decision, 'Launch market test with capped spend');
});

test('validateBusinessModelDecision accepts music-domain decisions', () => {
  const result = validateBusinessModelDecision({
    decision: 'Launch a paid music practice tier for creators',
    reasoning: 'Targets musicians that already compose weekly and need workflow depth.',
    keyTradeoffs: ['Higher conversion quality vs slower top-of-funnel growth'],
    risks: ['Need onboarding for first-time producers'],
    actionPlan: ['Ship progression templates', 'Improve MIDI export flow', 'Measure paid conversion'],
    dissentingOpinions: ['Keep free tier broader for hobbyists'],
  });

  assert.equal(result.decision.includes('music'), true);
});

test('validateBusinessModelDecision rejects off-domain pivots', () => {
  assert.throws(
    () =>
      validateBusinessModelDecision({
        decision: 'Launch subscription meal plans for fitness users',
        reasoning: 'Meal plans offer repeat revenue and broad demand.',
        keyTradeoffs: ['Nutrition expertise required'],
        risks: ['Regulatory and liability concerns'],
        actionPlan: ['Hire a nutrition advisor', 'Build meal tracking app'],
        dissentingOpinions: ['Could distract from core roadmap'],
      }),
    {
      message: /outside music business-model guardrails/,
    },
  );
});
