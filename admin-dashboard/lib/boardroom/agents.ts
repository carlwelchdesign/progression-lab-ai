import { BoardroomBoardMemberDefinition, BoardroomModelClass } from './types';

const DEFAULT_MEMBER_MODEL_CLASS: BoardroomModelClass = 'SMALL';
export const DEFAULT_BOARDROOM_MAX_OUTPUT_CHARS = 1400;
export const DEFAULT_BOARDROOM_NAME = 'Classic Boardroom';

const DEFAULT_BOARDROOM_MEMBER_TEMPLATES: BoardroomBoardMemberDefinition[] = [
  {
    personaLabel: 'CTO',
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
    modelClass: DEFAULT_MEMBER_MODEL_CLASS,
    maxOutputChars: DEFAULT_BOARDROOM_MAX_OUTPUT_CHARS,
    displayOrder: 0,
    isActive: true,
  },
  {
    personaLabel: 'CMO',
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
    modelClass: DEFAULT_MEMBER_MODEL_CLASS,
    maxOutputChars: DEFAULT_BOARDROOM_MAX_OUTPUT_CHARS,
    displayOrder: 1,
    isActive: true,
  },
  {
    personaLabel: 'CFO',
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
    modelClass: DEFAULT_MEMBER_MODEL_CLASS,
    maxOutputChars: DEFAULT_BOARDROOM_MAX_OUTPUT_CHARS,
    displayOrder: 2,
    isActive: true,
  },
  {
    personaLabel: 'Investor',
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
    modelClass: DEFAULT_MEMBER_MODEL_CLASS,
    maxOutputChars: DEFAULT_BOARDROOM_MAX_OUTPUT_CHARS,
    displayOrder: 3,
    isActive: true,
  },
  {
    personaLabel: 'Operator',
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
    modelClass: DEFAULT_MEMBER_MODEL_CLASS,
    maxOutputChars: DEFAULT_BOARDROOM_MAX_OUTPUT_CHARS,
    displayOrder: 4,
    isActive: true,
  },
];

export function createDefaultBoardroomMembers(maxMembers = 5): BoardroomBoardMemberDefinition[] {
  return DEFAULT_BOARDROOM_MEMBER_TEMPLATES.slice(0, maxMembers).map((member) => ({
    ...member,
    priorities: [...member.priorities],
    biases: [...member.biases],
  }));
}
