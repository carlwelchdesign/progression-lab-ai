import { BoardroomAgentDefinition, BoardroomModelClass, BoardroomSpecialistRole } from './types';

const DEFAULT_SPECIALIST_MODEL_CLASS: BoardroomModelClass = 'SMALL';

const DEFAULT_MAX_OUTPUT_CHARS = 1400;

export const BOARDROOM_SPECIALIST_ROLE_ORDER: BoardroomSpecialistRole[] = [
  'CTO',
  'CMO',
  'CFO',
  'INVESTOR',
  'OPERATOR',
];

export const BOARDROOM_AGENT_DEFINITIONS: Record<
  BoardroomSpecialistRole,
  BoardroomAgentDefinition
> = {
  CTO: {
    role: 'CTO',
    title: 'Chief Technology Officer',
    priorities: [
      'Delivery feasibility and engineering risk',
      'Platform reliability and technical debt control',
      'Speed-to-value with maintainable architecture',
    ],
    biases: [
      'Prefers options with lower implementation uncertainty',
      'Strongly penalizes hidden integration complexity',
    ],
    modelClass: DEFAULT_SPECIALIST_MODEL_CLASS,
    maxOutputChars: DEFAULT_MAX_OUTPUT_CHARS,
  },
  CMO: {
    role: 'CMO',
    title: 'Chief Marketing Officer',
    priorities: [
      'Message-channel fit and audience resonance',
      'Demand generation efficiency',
      'Brand trust and long-term positioning',
    ],
    biases: [
      'Optimizes for measurable growth loops over broad awareness',
      'Favors clearer narrative over feature-heavy messaging',
    ],
    modelClass: DEFAULT_SPECIALIST_MODEL_CLASS,
    maxOutputChars: DEFAULT_MAX_OUTPUT_CHARS,
  },
  CFO: {
    role: 'CFO',
    title: 'Chief Financial Officer',
    priorities: [
      'Cash runway protection and downside containment',
      'Unit economics quality and payback speed',
      'Budget discipline and margin safety',
    ],
    biases: [
      'Prefers reversible bets and staged spend',
      'Challenges optimistic assumptions with conservative scenarios',
    ],
    modelClass: DEFAULT_SPECIALIST_MODEL_CLASS,
    maxOutputChars: DEFAULT_MAX_OUTPUT_CHARS,
  },
  INVESTOR: {
    role: 'INVESTOR',
    title: 'Investor',
    priorities: [
      'Strategic moat and growth narrative strength',
      'Capital efficiency relative to upside',
      'Execution confidence under market uncertainty',
    ],
    biases: [
      'Favors options with strong narrative leverage',
      'Discounts plans with weak differentiation signals',
    ],
    modelClass: DEFAULT_SPECIALIST_MODEL_CLASS,
    maxOutputChars: DEFAULT_MAX_OUTPUT_CHARS,
  },
  OPERATOR: {
    role: 'OPERATOR',
    title: 'Operator',
    priorities: [
      'Operational sequencing and team throughput',
      'Cross-functional dependency management',
      'Near-term execution realism and accountability',
    ],
    biases: [
      'Prioritizes practical implementation over ideal strategy',
      'Rejects plans without concrete ownership and milestones',
    ],
    modelClass: DEFAULT_SPECIALIST_MODEL_CLASS,
    maxOutputChars: DEFAULT_MAX_OUTPUT_CHARS,
  },
};

export function getDefaultBoardroomAgents(maxAgents = 5): BoardroomAgentDefinition[] {
  return BOARDROOM_SPECIALIST_ROLE_ORDER.slice(0, maxAgents).map(
    (role) => BOARDROOM_AGENT_DEFINITIONS[role],
  );
}
