import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseBoardroomRunRequest,
  parseDecisionResponse,
  parseIndependentResponse,
} from './validation';

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
