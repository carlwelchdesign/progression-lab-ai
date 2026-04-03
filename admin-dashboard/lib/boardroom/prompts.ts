import {
  BoardroomAgentDefinition,
  BoardroomContext,
  BoardroomIndependentResponse,
  BoardroomRevisionResponse,
  BoardroomRunRequest,
  BoardroomSpecialistRole,
} from './types';

function formatContext(context?: BoardroomContext): string {
  if (!context) {
    return 'No additional structured context provided.';
  }

  const sections: string[] = [];

  if (context.productStage) {
    sections.push(`Product stage: ${context.productStage}`);
  }
  if (context.goals && context.goals.length > 0) {
    sections.push(`Goals: ${context.goals.join('; ')}`);
  }
  if (context.constraints && context.constraints.length > 0) {
    sections.push(`Constraints: ${context.constraints.join('; ')}`);
  }
  if (context.budget) {
    sections.push(`Budget: ${context.budget}`);
  }
  if (context.timeframe) {
    sections.push(`Timeframe: ${context.timeframe}`);
  }
  if (context.riskTolerance) {
    sections.push(`Risk tolerance: ${context.riskTolerance}`);
  }
  if (context.extraNotes) {
    sections.push(`Extra notes: ${context.extraNotes}`);
  }

  return sections.length > 0 ? sections.join('\n') : 'No additional structured context provided.';
}

function formatAgentIdentity(agent: BoardroomAgentDefinition): string {
  return [
    `Role: ${agent.role} (${agent.title})`,
    `Priorities: ${agent.priorities.join('; ')}`,
    `Biases: ${agent.biases.join('; ')}`,
    `Max response characters: ${agent.maxOutputChars}`,
  ].join('\n');
}

function strictJsonInstructionForIndependent(): string {
  return [
    'Return strict JSON only. No markdown. No prose outside JSON.',
    'Schema:',
    '{',
    '  "recommendation": "string",',
    '  "reasoning": "string",',
    '  "risks": ["string"],',
    '  "assumptions": ["string"]',
    '}',
    'Be opinionated. Be concise. Name concrete tradeoffs and avoid generic advice.',
    'Keep each array to at most 5 items.',
  ].join('\n');
}

function strictJsonInstructionForCritique(): string {
  return [
    'Return strict JSON only. No markdown. No prose outside JSON.',
    'Schema:',
    '{',
    '  "missingPoints": ["string"],',
    '  "disagreements": ["string"],',
    '  "weakAssumptions": ["string"]',
    '}',
    'Critique should be direct, evidence-oriented, and specific.',
    'Do not critique your own role.',
    'Keep each array to at most 5 items.',
  ].join('\n');
}

function strictJsonInstructionForRevision(): string {
  return [
    'Return strict JSON only. No markdown. No prose outside JSON.',
    'Schema:',
    '{',
    '  "updatedRecommendation": "string",',
    '  "updatedReasoning": "string",',
    '  "changedBecause": ["string"]',
    '}',
    'If you did not change your core recommendation, explain why critiques were not decisive.',
    'Keep changedBecause to at most 5 items.',
  ].join('\n');
}

function strictJsonInstructionForSynthesis(): string {
  return [
    'Return strict JSON only. No markdown. No prose outside JSON.',
    'Schema:',
    '{',
    '  "decision": "string",',
    '  "reasoning": "string",',
    '  "keyTradeoffs": ["string"],',
    '  "risks": ["string"],',
    '  "actionPlan": ["string"],',
    '  "dissentingOpinions": ["string"]',
    '}',
    'Prioritize decision usefulness over creativity.',
    'Resolve conflicts and acknowledge unresolved dissent explicitly.',
    'Keep actionPlan to 3-7 concrete steps.',
  ].join('\n');
}

export function buildIndependentPrompt(params: {
  request: BoardroomRunRequest;
  agent: BoardroomAgentDefinition;
}): string {
  const context = formatContext(params.request.context);

  return [
    'You are a specialist advisor in an AI Boardroom decision pipeline.',
    formatAgentIdentity(params.agent),
    'Task: produce your independent recommendation before seeing critiques.',
    `Question: ${params.request.question}`,
    `Context:\n${context}`,
    strictJsonInstructionForIndependent(),
  ].join('\n\n');
}

export function buildCritiquePrompt(params: {
  request: BoardroomRunRequest;
  agent: BoardroomAgentDefinition;
  otherIndependentSummaries: Array<{
    role: BoardroomSpecialistRole;
    response: BoardroomIndependentResponse;
  }>;
}): string {
  const context = formatContext(params.request.context);
  const others = params.otherIndependentSummaries
    .map((item) => {
      return [
        `Role: ${item.role}`,
        `Recommendation: ${item.response.recommendation}`,
        `Reasoning: ${item.response.reasoning}`,
        `Risks: ${item.response.risks.join('; ') || 'None listed'}`,
        `Assumptions: ${item.response.assumptions.join('; ') || 'None listed'}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    'You are in phase 2 (critique) of an AI Boardroom decision pipeline.',
    formatAgentIdentity(params.agent),
    `Question: ${params.request.question}`,
    `Context:\n${context}`,
    'Peer independent responses (summarized):',
    others || 'No peer responses available.',
    strictJsonInstructionForCritique(),
  ].join('\n\n');
}

export function buildRevisionPrompt(params: {
  request: BoardroomRunRequest;
  agent: BoardroomAgentDefinition;
  priorIndependent: BoardroomIndependentResponse;
  critiqueSummary: {
    missingPoints: string[];
    disagreements: string[];
    weakAssumptions: string[];
  };
}): string {
  const context = formatContext(params.request.context);

  return [
    'You are in phase 3 (revision) of an AI Boardroom decision pipeline.',
    formatAgentIdentity(params.agent),
    `Question: ${params.request.question}`,
    `Context:\n${context}`,
    'Your phase 1 response:',
    [
      `Recommendation: ${params.priorIndependent.recommendation}`,
      `Reasoning: ${params.priorIndependent.reasoning}`,
      `Risks: ${params.priorIndependent.risks.join('; ') || 'None listed'}`,
      `Assumptions: ${params.priorIndependent.assumptions.join('; ') || 'None listed'}`,
    ].join('\n'),
    'Condensed critique addressed to you:',
    [
      `Missing points: ${params.critiqueSummary.missingPoints.join('; ') || 'None listed'}`,
      `Disagreements: ${params.critiqueSummary.disagreements.join('; ') || 'None listed'}`,
      `Weak assumptions: ${params.critiqueSummary.weakAssumptions.join('; ') || 'None listed'}`,
    ].join('\n'),
    strictJsonInstructionForRevision(),
  ].join('\n\n');
}

export function buildChairmanPrompt(params: {
  request: BoardroomRunRequest;
  revisedPositions: Array<{
    role: BoardroomSpecialistRole;
    revision: BoardroomRevisionResponse;
  }>;
}): string {
  const context = formatContext(params.request.context);
  const revisions = params.revisedPositions
    .map((item) => {
      return [
        `Role: ${item.role}`,
        `Updated recommendation: ${item.revision.updatedRecommendation}`,
        `Updated reasoning: ${item.revision.updatedReasoning}`,
        `Changed because: ${item.revision.changedBecause.join('; ') || 'No explicit changes listed'}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    'You are the Chairman in an AI Boardroom decision pipeline.',
    'Your job is to synthesize revised positions and produce one actionable decision package.',
    `Question: ${params.request.question}`,
    `Context:\n${context}`,
    'Revised specialist positions:',
    revisions || 'No revised specialist positions available.',
    strictJsonInstructionForSynthesis(),
  ].join('\n\n');
}
