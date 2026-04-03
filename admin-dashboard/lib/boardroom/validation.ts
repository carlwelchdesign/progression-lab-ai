import {
  BoardroomContext,
  BoardroomCritiqueResponse,
  BoardroomDecision,
  BoardroomIndependentResponse,
  BoardroomRevisionResponse,
  BoardroomRiskTolerance,
  BoardroomRunRequest,
} from './types';
import { createInvalidInputError, createModelOutputInvalidError } from './errors';

const MAX_QUESTION_CHARS = 2000;
const MAX_NOTE_CHARS = 1200;
const MAX_SHORT_TEXT_CHARS = 700;
const MAX_LIST_ITEMS = 7;
const PRODUCT_STAGES = new Set(['IDEA', 'MVP', 'EARLY_TRACTION', 'GROWTH', 'SCALE']);
const RISK_TOLERANCES = new Set(['LOW', 'MEDIUM', 'HIGH']);

function sanitizeText(value: unknown, maxChars: number): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxChars);
}

function sanitizeStringList(value: unknown, maxItems = MAX_LIST_ITEMS): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseContext(input: unknown): BoardroomContext | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const raw = input as {
    productStage?: unknown;
    goals?: unknown;
    constraints?: unknown;
    budget?: unknown;
    timeframe?: unknown;
    riskTolerance?: unknown;
    extraNotes?: unknown;
  };

  const context: BoardroomContext = {};

  if (typeof raw.productStage === 'string' && PRODUCT_STAGES.has(raw.productStage)) {
    context.productStage = raw.productStage as BoardroomContext['productStage'];
  }

  context.goals = sanitizeStringList(raw.goals);
  context.constraints = sanitizeStringList(raw.constraints);

  const budget = sanitizeText(raw.budget, MAX_SHORT_TEXT_CHARS);
  if (budget) {
    context.budget = budget;
  }

  const timeframe = sanitizeText(raw.timeframe, MAX_SHORT_TEXT_CHARS);
  if (timeframe) {
    context.timeframe = timeframe;
  }

  if (typeof raw.riskTolerance === 'string' && RISK_TOLERANCES.has(raw.riskTolerance)) {
    context.riskTolerance = raw.riskTolerance as BoardroomRiskTolerance;
  }

  const extraNotes = sanitizeText(raw.extraNotes, MAX_NOTE_CHARS);
  if (extraNotes) {
    context.extraNotes = extraNotes;
  }

  if (
    !context.productStage &&
    (!context.goals || context.goals.length === 0) &&
    (!context.constraints || context.constraints.length === 0) &&
    !context.budget &&
    !context.timeframe &&
    !context.riskTolerance &&
    !context.extraNotes
  ) {
    return undefined;
  }

  return context;
}

export function parseBoardroomRunRequest(input: unknown): BoardroomRunRequest {
  if (!input || typeof input !== 'object') {
    throw createInvalidInputError('Request body must be an object');
  }

  const raw = input as {
    question?: unknown;
    context?: unknown;
  };

  const question = sanitizeText(raw.question, MAX_QUESTION_CHARS);
  if (!question) {
    throw createInvalidInputError('question is required');
  }

  const context = parseContext(raw.context);

  return {
    question,
    context,
  };
}

export function parseIndependentResponse(input: unknown): BoardroomIndependentResponse {
  const raw = input as {
    recommendation?: unknown;
    reasoning?: unknown;
    risks?: unknown;
    assumptions?: unknown;
  };

  const recommendation = sanitizeText(raw?.recommendation, MAX_NOTE_CHARS);
  const reasoning = sanitizeText(raw?.reasoning, MAX_NOTE_CHARS);
  const risks = sanitizeStringList(raw?.risks);
  const assumptions = sanitizeStringList(raw?.assumptions);

  if (!recommendation || !reasoning) {
    throw createModelOutputInvalidError('Independent response missing recommendation or reasoning');
  }

  return {
    recommendation,
    reasoning,
    risks,
    assumptions,
  };
}

export function parseCritiqueResponse(input: unknown): BoardroomCritiqueResponse {
  const raw = input as {
    missingPoints?: unknown;
    disagreements?: unknown;
    weakAssumptions?: unknown;
  };

  const missingPoints = sanitizeStringList(raw?.missingPoints);
  const disagreements = sanitizeStringList(raw?.disagreements);
  const weakAssumptions = sanitizeStringList(raw?.weakAssumptions);

  return {
    missingPoints,
    disagreements,
    weakAssumptions,
  };
}

export function parseRevisionResponse(input: unknown): BoardroomRevisionResponse {
  const raw = input as {
    updatedRecommendation?: unknown;
    updatedReasoning?: unknown;
    changedBecause?: unknown;
  };

  const updatedRecommendation = sanitizeText(raw?.updatedRecommendation, MAX_NOTE_CHARS);
  const updatedReasoning = sanitizeText(raw?.updatedReasoning, MAX_NOTE_CHARS);
  const changedBecause = sanitizeStringList(raw?.changedBecause);

  if (!updatedRecommendation || !updatedReasoning) {
    throw createModelOutputInvalidError(
      'Revision response missing updated recommendation or reasoning',
    );
  }

  return {
    updatedRecommendation,
    updatedReasoning,
    changedBecause,
  };
}

export function parseDecisionResponse(input: unknown): BoardroomDecision {
  const raw = input as {
    decision?: unknown;
    reasoning?: unknown;
    keyTradeoffs?: unknown;
    risks?: unknown;
    actionPlan?: unknown;
    dissentingOpinions?: unknown;
  };

  const decision = sanitizeText(raw?.decision, MAX_NOTE_CHARS);
  const reasoning = sanitizeText(raw?.reasoning, MAX_NOTE_CHARS);
  const keyTradeoffs = sanitizeStringList(raw?.keyTradeoffs);
  const risks = sanitizeStringList(raw?.risks);
  const actionPlan = sanitizeStringList(raw?.actionPlan, 10);
  const dissentingOpinions = sanitizeStringList(raw?.dissentingOpinions);

  if (!decision || !reasoning || actionPlan.length === 0) {
    throw createModelOutputInvalidError(
      'Decision response missing decision, reasoning, or actionPlan',
    );
  }

  return {
    decision,
    reasoning,
    keyTradeoffs,
    risks,
    actionPlan,
    dissentingOpinions,
  };
}
