import {
  BoardroomCritiqueResponse,
  BoardroomIndependentResponse,
  BoardroomPhaseSummary,
  BoardroomRevisionResponse,
} from './types';

const MAX_LIST_ITEMS = 3;

function truncate(value: string, maxChars = Number.POSITIVE_INFINITY): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxChars - 3))}...`;
}

function compactList(list: string[]): string[] {
  return list
    .map((item) => truncate(item, 120))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

export function summarizeIndependentResponses(
  items: Array<{
    memberLabel: string;
    response: BoardroomIndependentResponse;
  }>,
): BoardroomPhaseSummary[] {
  return items.map((item) => ({
    memberLabel: item.memberLabel,
    summary: truncate(`${item.response.recommendation} ${item.response.reasoning}`),
    keyRisks: compactList(item.response.risks),
    topTradeoffs: compactList(item.response.assumptions),
  }));
}

export function summarizeCritiques(
  items: Array<{
    memberLabel: string;
    response: BoardroomCritiqueResponse;
  }>,
): BoardroomPhaseSummary[] {
  return items.map((item) => ({
    memberLabel: item.memberLabel,
    summary: truncate(
      `Missing: ${item.response.missingPoints.join('; ')} Disagreements: ${item.response.disagreements.join('; ')}`,
    ),
    keyRisks: compactList(item.response.weakAssumptions),
    topTradeoffs: compactList(item.response.disagreements),
  }));
}

export function summarizeRevisions(
  items: Array<{
    memberLabel: string;
    response: BoardroomRevisionResponse;
  }>,
): BoardroomPhaseSummary[] {
  return items.map((item) => ({
    memberLabel: item.memberLabel,
    summary: truncate(`${item.response.updatedRecommendation} ${item.response.updatedReasoning}`),
    keyRisks: [],
    topTradeoffs: compactList(item.response.changedBecause),
  }));
}
