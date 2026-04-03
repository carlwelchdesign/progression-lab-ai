import { Prisma } from '@prisma/client';

import { prisma } from '../prisma';
import { DEFAULT_BOARDROOM_NAME, createDefaultBoardroomMembers } from './agents';
import { BOARDROOM_PERSONA_SUGGESTIONS } from './personaSuggestions';
import type {
  BoardroomBoardDefinition,
  BoardroomBoardMemberDefinition,
  BoardroomRunRequest,
} from './types';
import { createInvalidInputError } from './errors';

const SEEDED_PRESET_DESCRIPTION_PREFIX = 'Seeded preset:';

type BoardSeedPreset = {
  name: string;
  summary: string;
  suggestionKeys: string[];
};

const BOARD_SEED_PRESETS: BoardSeedPreset[] = [
  {
    name: 'Founder Sprint Board',
    summary: 'High-velocity decisions for rapid iteration and early traction.',
    suggestionKeys: [
      'bootstrapped-indie-hacker',
      'stripe-product-thinker',
      'paul-graham-investor',
      'indra-nooyi-operator',
    ],
  },
  {
    name: 'Capital Discipline Board',
    summary: 'Capital-efficient planning with explicit downside control.',
    suggestionKeys: [
      'warren-buffett-capital-allocator',
      'paul-graham-investor',
      'bootstrapped-indie-hacker',
      'stripe-product-thinker',
    ],
  },
  {
    name: 'Enterprise Expansion Board',
    summary: 'Execution guidance for scaling product and operations toward larger customers.',
    suggestionKeys: [
      'enterprise-saas-architect',
      'stripe-product-thinker',
      'indra-nooyi-operator',
      'warren-buffett-capital-allocator',
    ],
  },
];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function normalizeMember(member: {
  id: string;
  personaLabel: string;
  title: string;
  priorities: unknown;
  biases: unknown;
  modelClass: string;
  maxOutputChars: number;
  displayOrder: number;
  suggestionKey: string | null;
  isActive: boolean;
}): BoardroomBoardMemberDefinition {
  return {
    id: member.id,
    personaLabel: member.personaLabel,
    title: member.title,
    priorities: asStringArray(member.priorities),
    biases: asStringArray(member.biases),
    modelClass: member.modelClass === 'LARGE' ? 'LARGE' : 'SMALL',
    maxOutputChars: member.maxOutputChars,
    displayOrder: member.displayOrder,
    suggestionKey: member.suggestionKey,
    isActive: member.isActive,
  };
}

function sortMembers(members: BoardroomBoardMemberDefinition[]): BoardroomBoardMemberDefinition[] {
  return [...members]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((member, index) => ({
      ...member,
      displayOrder: index,
      priorities: [...member.priorities],
      biases: [...member.biases],
    }));
}

function buildSeedPresetMembers(preset: BoardSeedPreset): BoardroomBoardMemberDefinition[] {
  const suggestionByKey = new Map(
    BOARDROOM_PERSONA_SUGGESTIONS.map((suggestion) => [suggestion.key, suggestion]),
  );

  const members = preset.suggestionKeys
    .map((key, displayOrder) => {
      const suggestion = suggestionByKey.get(key);
      if (!suggestion) {
        return null;
      }

      return {
        personaLabel: suggestion.label,
        title: suggestion.title,
        priorities: [...suggestion.priorities],
        biases: [...suggestion.biases],
        modelClass: suggestion.modelClass,
        maxOutputChars: 1400,
        displayOrder,
        suggestionKey: suggestion.key,
        isActive: true,
      } satisfies BoardroomBoardMemberDefinition;
    })
    .filter((member): member is BoardroomBoardMemberDefinition => Boolean(member));

  return members.length > 0 ? members : createDefaultBoardroomMembers(4);
}

async function ensureSeedPresetBoards(): Promise<void> {
  const existingBoards = await prisma.boardroomBoard.findMany({
    select: {
      name: true,
      description: true,
    },
  });

  const existingNames = new Set(existingBoards.map((board) => board.name.trim().toLowerCase()));

  for (const preset of BOARD_SEED_PRESETS) {
    if (existingNames.has(preset.name.trim().toLowerCase())) {
      continue;
    }

    await prisma.boardroomBoard.create({
      data: {
        name: preset.name,
        description: `${SEEDED_PRESET_DESCRIPTION_PREFIX} ${preset.summary}`,
        isDefault: false,
        members: {
          create: buildSeedPresetMembers(preset).map((member) => ({
            displayOrder: member.displayOrder,
            isActive: member.isActive,
            personaLabel: member.personaLabel,
            title: member.title,
            priorities: member.priorities,
            biases: member.biases,
            modelClass: member.modelClass,
            maxOutputChars: member.maxOutputChars,
            suggestionKey: member.suggestionKey ?? null,
          })),
        },
      },
    });
  }
}

function toBoardDefinition(board: {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    personaLabel: string;
    title: string;
    priorities: unknown;
    biases: unknown;
    modelClass: string;
    maxOutputChars: number;
    displayOrder: number;
    suggestionKey: string | null;
    isActive: boolean;
  }>;
}): BoardroomBoardDefinition & { createdAt: string; updatedAt: string } {
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    isDefault: board.isDefault,
    members: sortMembers(board.members.map(normalizeMember)),
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}

async function unsetOtherDefaultBoards(
  client: Prisma.TransactionClient,
  exceptBoardId?: string,
): Promise<void> {
  await client.boardroomBoard.updateMany({
    where: exceptBoardId
      ? {
          isDefault: true,
          NOT: { id: exceptBoardId },
        }
      : { isDefault: true },
    data: { isDefault: false },
  });
}

export async function ensureDefaultBoardroomBoard(): Promise<
  BoardroomBoardDefinition & { createdAt: string; updatedAt: string }
> {
  const existingDefault = await prisma.boardroomBoard.findFirst({
    where: { isDefault: true },
    include: {
      members: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (existingDefault) {
    return toBoardDefinition(existingDefault);
  }

  const existingBoard = await prisma.boardroomBoard.findFirst({
    orderBy: { createdAt: 'asc' },
    include: {
      members: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (existingBoard) {
    const updated = await prisma.boardroomBoard.update({
      where: { id: existingBoard.id },
      data: { isDefault: true },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return toBoardDefinition(updated);
  }

  const created = await prisma.boardroomBoard.create({
    data: {
      name: DEFAULT_BOARDROOM_NAME,
      description: 'Seeded default board based on the original fixed-role boardroom.',
      isDefault: true,
      members: {
        create: createDefaultBoardroomMembers().map((member) => ({
          displayOrder: member.displayOrder,
          isActive: member.isActive,
          personaLabel: member.personaLabel,
          title: member.title,
          priorities: member.priorities,
          biases: member.biases,
          modelClass: member.modelClass,
          maxOutputChars: member.maxOutputChars,
          suggestionKey: member.suggestionKey ?? null,
        })),
      },
    },
    include: {
      members: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return toBoardDefinition(created);
}

export async function listBoardroomBoards(): Promise<
  Array<BoardroomBoardDefinition & { createdAt: string; updatedAt: string }>
> {
  await ensureDefaultBoardroomBoard();
  await ensureSeedPresetBoards();

  const rows = await prisma.boardroomBoard.findMany({
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    include: {
      members: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return rows.map(toBoardDefinition);
}

export async function getBoardroomBoardById(
  id: string,
): Promise<(BoardroomBoardDefinition & { createdAt: string; updatedAt: string }) | null> {
  const row = await prisma.boardroomBoard.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return row ? toBoardDefinition(row) : null;
}

export async function createBoardroomBoard(
  input: BoardroomBoardDefinition,
): Promise<BoardroomBoardDefinition & { createdAt: string; updatedAt: string }> {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await unsetOtherDefaultBoards(tx);
    }

    const created = await tx.boardroomBoard.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        isDefault: input.isDefault === true,
        members: {
          create: sortMembers(input.members).map((member) => ({
            displayOrder: member.displayOrder,
            isActive: member.isActive,
            personaLabel: member.personaLabel,
            title: member.title,
            priorities: member.priorities,
            biases: member.biases,
            modelClass: member.modelClass,
            maxOutputChars: member.maxOutputChars,
            suggestionKey: member.suggestionKey ?? null,
          })),
        },
      },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!input.isDefault) {
      const defaultCount = await tx.boardroomBoard.count({ where: { isDefault: true } });
      if (defaultCount === 0) {
        const updated = await tx.boardroomBoard.update({
          where: { id: created.id },
          data: { isDefault: true },
          include: {
            members: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        });
        return toBoardDefinition(updated);
      }
    }

    return toBoardDefinition(created);
  });
}

export async function updateBoardroomBoard(
  id: string,
  input: BoardroomBoardDefinition,
): Promise<BoardroomBoardDefinition & { createdAt: string; updatedAt: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.boardroomBoard.findUnique({ where: { id } });
    if (!existing) {
      throw createInvalidInputError('Board not found');
    }

    if (input.isDefault) {
      await unsetOtherDefaultBoards(tx, id);
    }

    await tx.boardroomBoardMember.deleteMany({ where: { boardId: id } });

    const updated = await tx.boardroomBoard.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description ?? null,
        isDefault: input.isDefault === true,
        members: {
          create: sortMembers(input.members).map((member) => ({
            displayOrder: member.displayOrder,
            isActive: member.isActive,
            personaLabel: member.personaLabel,
            title: member.title,
            priorities: member.priorities,
            biases: member.biases,
            modelClass: member.modelClass,
            maxOutputChars: member.maxOutputChars,
            suggestionKey: member.suggestionKey ?? null,
          })),
        },
      },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!updated.isDefault) {
      const defaultCount = await tx.boardroomBoard.count({ where: { isDefault: true } });
      if (defaultCount === 0) {
        const defaulted = await tx.boardroomBoard.update({
          where: { id },
          data: { isDefault: true },
          include: {
            members: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        });
        return toBoardDefinition(defaulted);
      }
    }

    return toBoardDefinition(updated);
  });
}

export async function deleteBoardroomBoard(id: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.boardroomBoard.findUnique({ where: { id } });
    if (!existing) {
      return false;
    }

    await tx.boardroomBoard.delete({ where: { id } });

    const nextDefault = await tx.boardroomBoard.findFirst({
      where: { isDefault: false },
      orderBy: { createdAt: 'asc' },
    });

    if (nextDefault) {
      await tx.boardroomBoard.update({
        where: { id: nextDefault.id },
        data: { isDefault: true },
      });
    }

    return true;
  });
}

export async function resolveBoardroomExecutionBoard(request: BoardroomRunRequest): Promise<{
  boardId: string | null;
  boardName: string;
  boardMembers: BoardroomBoardMemberDefinition[];
}> {
  if (request.boardMembers && request.boardMembers.length > 0) {
    const activeMembers = sortMembers(request.boardMembers).filter((member) => member.isActive);
    if (activeMembers.length === 0) {
      throw createInvalidInputError('At least one active board member is required');
    }

    if (request.boardId) {
      const existing = await getBoardroomBoardById(request.boardId);
      return {
        boardId: existing?.id ?? request.boardId,
        boardName: request.boardName || existing?.name || 'Custom board',
        boardMembers: activeMembers,
      };
    }

    return {
      boardId: null,
      boardName: request.boardName || 'Custom board',
      boardMembers: activeMembers,
    };
  }

  if (request.boardId) {
    const existing = await getBoardroomBoardById(request.boardId);
    if (!existing) {
      throw createInvalidInputError('Saved board not found');
    }

    const activeMembers = existing.members.filter((member) => member.isActive);
    if (activeMembers.length === 0) {
      throw createInvalidInputError('Saved board has no active members');
    }

    return {
      boardId: existing.id ?? null,
      boardName: existing.name,
      boardMembers: activeMembers,
    };
  }

  const fallback = await ensureDefaultBoardroomBoard();
  const activeMembers = fallback.members.filter((member) => member.isActive);

  return {
    boardId: fallback.id ?? null,
    boardName: fallback.name,
    boardMembers: activeMembers,
  };
}
