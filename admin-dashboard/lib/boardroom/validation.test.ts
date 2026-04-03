import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseBoardroomRunRequest,
  parseDecisionResponse,
  parseIndependentResponse,
} from './validation';
import {
  validateBusinessModelDecision,
  validateDecisionAgainstFeatureCatalog,
  validateDecisionAgainstNonGoals,
} from './guardrails';
import { getBoardroomProductCharter } from './productCharter';
import type { BoardroomFeatureCatalog } from './types';

const FEATURE_CATALOG_FIXTURE: BoardroomFeatureCatalog = {
  generatedAtIso: '2026-04-03T00:00:00.000Z',
  plansConsidered: ['SESSION', 'COMPOSER', 'STUDIO'],
  capabilities: {
    canExportMidi: {
      isAvailableToAll: false,
      availablePlans: ['COMPOSER', 'STUDIO'],
      unavailablePlans: ['SESSION'],
    },
    canExportPdf: {
      isAvailableToAll: false,
      availablePlans: ['COMPOSER', 'STUDIO'],
      unavailablePlans: ['SESSION'],
    },
    canSharePublicly: {
      isAvailableToAll: true,
      availablePlans: ['SESSION', 'COMPOSER', 'STUDIO'],
      unavailablePlans: [],
    },
    canUseVocalTrackRecording: {
      isAvailableToAll: false,
      availablePlans: ['COMPOSER', 'STUDIO'],
      unavailablePlans: ['SESSION'],
    },
    canUseAdvancedVoicingControls: {
      isAvailableToAll: false,
      availablePlans: ['COMPOSER', 'STUDIO'],
      unavailablePlans: ['SESSION'],
    },
  },
};

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
    actionPlan: [
      'Ship progression templates',
      'Improve MIDI export flow',
      'Measure paid conversion',
    ],
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

test('validateDecisionAgainstFeatureCatalog rejects all-user claims for paid-only features', () => {
  assert.throws(
    () =>
      validateDecisionAgainstFeatureCatalog({
        decision: {
          decision: 'Roll out MIDI export to all users immediately',
          reasoning: 'This should be available to all plans for growth.',
          keyTradeoffs: ['Higher conversion potential vs higher compute costs'],
          risks: ['May cannibalize upgrades'],
          actionPlan: ['Enable export midi flow for every user'],
          dissentingOpinions: [],
        },
        featureCatalog: FEATURE_CATALOG_FIXTURE,
      }),
    {
      message: /not available to all plans/,
    },
  );
});

test('validateDecisionAgainstFeatureCatalog allows claims when feature is actually all-plan', () => {
  const result = validateDecisionAgainstFeatureCatalog({
    decision: {
      decision: 'Expand public sharing to all users with better onboarding',
      reasoning: 'Public sharing is already available to all users and can drive discovery.',
      keyTradeoffs: ['More reach vs moderation overhead'],
      risks: ['Quality control burden'],
      actionPlan: ['Improve share UX', 'Add moderation workflow', 'Track sharing activation'],
      dissentingOpinions: [],
    },
    featureCatalog: FEATURE_CATALOG_FIXTURE,
  });

  assert.equal(result.decision.includes('public sharing'), true);
});

test('validateDecisionAgainstNonGoals rejects DAW recommendations', () => {
  const charter = getBoardroomProductCharter();

  assert.throws(
    () =>
      validateDecisionAgainstNonGoals({
        decision: {
          decision: 'Build a full Digital Audio Workstation with real-time synthesis and mixing',
          reasoning: 'Users want a complete production suite in one tool.',
          keyTradeoffs: ['Feature scope vs shipping speed'],
          risks: ['Complex audio engineering talent required'],
          actionPlan: ['Hire audio engineers', 'Build DSP subsystem', 'Integrate VST hosts'],
          dissentingOpinions: [],
        },
        productCharter: charter,
      }),
    {
      message: /explicitly non-goals/,
    },
  );
});

test('validateDecisionAgainstNonGoals rejects melody generation recommendations', () => {
  const charter = getBoardroomProductCharter();

  assert.throws(
    () =>
      validateDecisionAgainstNonGoals({
        decision: {
          decision: 'Add AI melody line generation to complement progressions',
          reasoning: 'Melodies are the next logical feature for songwriting.',
          keyTradeoffs: ['Feature scope expansion vs focus'],
          risks: ['Quality consistency challenges'],
          actionPlan: ['Train model on melody datasets', 'Integrate with progression generator'],
          dissentingOpinions: [],
        },
        productCharter: charter,
      }),
    {
      message: /explicitly non-goals/,
    },
  );
});

test('validateDecisionAgainstNonGoals allows music-focused recommendations', () => {
  const charter = getBoardroomProductCharter();

  const result = validateDecisionAgainstNonGoals({
    decision: {
      decision: 'Launch collaboration features for public sharing feedback',
      reasoning: 'Async sharing is within scope; users can share progressions and get feedback.',
      keyTradeoffs: ['Async vs real-time collaboration'],
      risks: ['Requires moderation system'],
      actionPlan: ['Add comment system to shared progressions', 'Build notification flow'],
      dissentingOpinions: [],
    },
    productCharter: charter,
  });

  assert.equal(result.decision.includes('sharing'), true);
});
