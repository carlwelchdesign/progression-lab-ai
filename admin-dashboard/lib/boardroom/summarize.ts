import {
  BoardroomCritiqueResponse,
  BoardroomIndependentResponse,
  BoardroomPhaseSummary,
  BoardroomRevisionResponse,
  BoardroomSpecialistRole,
} from './types';

const MAX_SUMMARY_CHARS = 260;
const MAX_LIST_ITEMS = 3;

function truncate(value: string, maxChars = MAX_SUMMARY_CHARS): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxChars - 1))}…`;
}

function compactList(list: string[]): string[] {
  return list
    .map((item) => truncate(item, 120))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

export function summarizeIndependentResponses(
  items: Array<{
    role: BoardroomSpecialistRole;
    response: BoardroomIndependentResponse;
  }>,
): BoardroomPhaseSummary[] {
  return items.map((item) => ({
    role: item.role,
    summary: truncate(`${item.response.recommendation} ${item.response.reasoning}`),
    keyRisks: compactList(item.response.risks),
    topTradeoffs: compactList(item.response.assumptions),
  }));
}

export function summarizeCritiques(
  items: Array<{
    role: BoardroomSpecialistRole;
    response: BoardroomCritiqueResponse;
  }>,
): BoardroomPhaseSummary[] {
  return items.map((item) => ({
    role: item.role,
    summary: truncate(
      `Missing: ${item.response.missingPoints.join('; ')} Disagreements: ${item.response.disagreements.join('; ')}`,
    ),
    keyRisks: compactList(item.response.weakAssumptions),
    topTradeoffs: compactList(item.response.disagreements),
  }));
}

export function summarizeRevisions(
  items: Array<{
    role: BoardroomSpecialistRole;
    response: BoardroomRevisionResponse;
  }>,
): BoardroomPhaseSummary[] {
  return items.map((item) => ({
    role: item.role,
    summary: truncate(`${item.response.updatedRecommendation} ${item.response.updatedReasoning}`),
    keyRisks: [],
    topTradeoffs: compactList(item.response.changedBecause),
  }));
}
