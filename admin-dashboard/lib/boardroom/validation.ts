import {
  BoardroomBoardDefinition,
  BoardroomBoardMemberDefinition,
  BoardroomBoardMemberInput,
  BoardroomContext,
  BoardroomCritiqueResponse,
  BoardroomDecision,
  BoardroomIndependentResponse,
  BoardroomModelClass,
  BoardroomRevisionResponse,
  BoardroomRiskTolerance,
  BoardroomRunRequest,
} from './types';
import { createInvalidInputError, createModelOutputInvalidError } from './errors';

const MAX_QUESTION_CHARS = 2000;
const MAX_BOARD_NAME_CHARS = 120;
const MAX_BOARD_DESCRIPTION_CHARS = 600;
const MAX_NOTE_CHARS = 1200;
const MAX_SHORT_TEXT_CHARS = 700;
const MAX_LIST_ITEMS = 7;
const MAX_LIST_ITEM_CHARS = 220;
const MAX_BOARD_MEMBERS = 7;
const MIN_BOARD_MEMBERS = 1;
const MIN_OUTPUT_CHARS = 200;
const MAX_OUTPUT_CHARS = 4000;
const PRODUCT_STAGES = new Set(['IDEA', 'MVP', 'EARLY_TRACTION', 'GROWTH', 'SCALE']);
const RISK_TOLERANCES = new Set(['LOW', 'MEDIUM', 'HIGH']);
const MODEL_CLASSES = new Set(['SMALL', 'LARGE']);

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

  const deduped = new Set(
    value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().slice(0, MAX_LIST_ITEM_CHARS))
      .filter(Boolean),
  );

  return Array.from(deduped).slice(0, maxItems);
}

function sanitizeOptionalText(value: unknown, maxChars: number): string | null {
  const sanitized = sanitizeText(value, maxChars);
  return sanitized || null;
}

function sanitizeModelClass(value: unknown): BoardroomModelClass {
  if (typeof value === 'string' && MODEL_CLASSES.has(value)) {
    return value as BoardroomModelClass;
  }

  return 'SMALL';
}

function sanitizeOutputChars(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1400;
  }

  return Math.max(MIN_OUTPUT_CHARS, Math.min(MAX_OUTPUT_CHARS, Math.round(value)));
}

function normalizeBoardMembers(
  value: unknown,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): BoardroomBoardMemberDefinition[] {
  if (!Array.isArray(value)) {
    if (allowEmpty) {
      return [];
    }

    throw createInvalidInputError('boardMembers must be an array');
  }

  const normalized = value
    .filter((item): item is BoardroomBoardMemberInput => Boolean(item) && typeof item === 'object')
    .slice(0, MAX_BOARD_MEMBERS)
    .map((item, index) => {
      const personaLabel = sanitizeText(item.personaLabel, MAX_SHORT_TEXT_CHARS);
      const title = sanitizeText(item.title, MAX_SHORT_TEXT_CHARS);

      if (!personaLabel || !title) {
        throw createInvalidInputError('Each board member requires personaLabel and title');
      }

      return {
        id: typeof item.id === 'string' ? item.id : undefined,
        personaLabel,
        title,
        priorities: sanitizeStringList(item.priorities),
        biases: sanitizeStringList(item.biases),
        modelClass: sanitizeModelClass(item.modelClass),
        maxOutputChars: sanitizeOutputChars(item.maxOutputChars),
        displayOrder:
          typeof item.displayOrder === 'number' && Number.isFinite(item.displayOrder)
            ? Math.max(0, Math.round(item.displayOrder))
            : index,
        suggestionKey:
          typeof item.suggestionKey === 'string' && item.suggestionKey.trim()
            ? item.suggestionKey.trim()
            : null,
        isActive: item.isActive !== false,
      } satisfies BoardroomBoardMemberDefinition;
    })
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((member, index) => ({
      ...member,
      displayOrder: index,
    }));

  const activeCount = normalized.filter((member) => member.isActive).length;
  if (!allowEmpty && activeCount < MIN_BOARD_MEMBERS) {
    throw createInvalidInputError('At least one active board member is required');
  }

  if (activeCount > MAX_BOARD_MEMBERS) {
    throw createInvalidInputError(`A board supports at most ${MAX_BOARD_MEMBERS} active members`);
  }

  return normalized;
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
    boardId?: unknown;
    boardName?: unknown;
    boardMembers?: unknown;
  };

  const question = sanitizeText(raw.question, MAX_QUESTION_CHARS);
  if (!question) {
    throw createInvalidInputError('question is required');
  }

  const context = parseContext(raw.context);
  const boardId = sanitizeText(raw.boardId, 200) || undefined;
  const boardName = sanitizeText(raw.boardName, MAX_BOARD_NAME_CHARS) || undefined;

  let boardMembers: BoardroomBoardMemberDefinition[] | undefined;
  if (raw.boardMembers !== undefined) {
    boardMembers = normalizeBoardMembers(raw.boardMembers);
  }

  return {
    question,
    context,
    boardId,
    boardName,
    boardMembers,
  };
}

export function parseBoardroomBoardInput(input: unknown): BoardroomBoardDefinition {
  if (!input || typeof input !== 'object') {
    throw createInvalidInputError('Request body must be an object');
  }

  const raw = input as {
    name?: unknown;
    description?: unknown;
    isDefault?: unknown;
    members?: unknown;
  };

  const name = sanitizeText(raw.name, MAX_BOARD_NAME_CHARS);
  if (!name) {
    throw createInvalidInputError('Board name is required');
  }

  const members = normalizeBoardMembers(raw.members);

  return {
    name,
    description: sanitizeOptionalText(raw.description, MAX_BOARD_DESCRIPTION_CHARS),
    isDefault: raw.isDefault === true,
    members,
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
