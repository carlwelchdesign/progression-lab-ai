import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AiBoardroomPanel from '../AiBoardroomPanel';
import {
  createBoardroomBoard,
  deleteBoardroomBoard,
  fetchBoardroomBoards,
  fetchBoardroomRun,
  fetchBoardroomRuns,
  runBoardroom,
  updateBoardroomBoard,
} from '../adminApi';

jest.mock('../../../../components/ui/GroupedAutocompleteField', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

jest.mock('../adminApi', () => ({
  createBoardroomBoard: jest.fn(),
  deleteBoardroomBoard: jest.fn(),
  fetchBoardroomBoards: jest.fn(),
  fetchBoardroomRun: jest.fn(),
  fetchBoardroomRuns: jest.fn(),
  runBoardroom: jest.fn(),
  updateBoardroomBoard: jest.fn(),
}));

const mockedCreateBoardroomBoard = jest.mocked(createBoardroomBoard);
const mockedDeleteBoardroomBoard = jest.mocked(deleteBoardroomBoard);
const mockedFetchBoardroomBoards = jest.mocked(fetchBoardroomBoards);
const mockedFetchBoardroomRun = jest.mocked(fetchBoardroomRun);
const mockedFetchBoardroomRuns = jest.mocked(fetchBoardroomRuns);
const mockedRunBoardroom = jest.mocked(runBoardroom);
const mockedUpdateBoardroomBoard = jest.mocked(updateBoardroomBoard);

function createBoardFixture() {
  return {
    id: 'board-1',
    name: 'Classic Boardroom',
    description: 'Default board',
    isDefault: true,
    members: [
      {
        id: 'member-1',
        personaLabel: 'CTO',
        title: 'Chief Technology Officer',
        priorities: ['Delivery feasibility'],
        biases: ['Prefer low uncertainty'],
        modelClass: 'SMALL' as const,
        maxOutputChars: 1400,
        displayOrder: 0,
        suggestionKey: null,
        isActive: true,
      },
    ],
  };
}

function createSuggestionFixture() {
  return {
    key: 'paul-graham-investor',
    label: 'Paul Graham-style investor',
    group: 'Investors',
    title: 'Early-stage investor',
    priorities: ['Founder-market fit'],
    biases: ['Values fast learning loops'],
    modelClass: 'SMALL' as const,
  };
}

beforeEach(() => {
  jest.clearAllMocks();

  const board = createBoardFixture();
  const suggestion = createSuggestionFixture();

  mockedFetchBoardroomBoards.mockResolvedValue({
    items: [board],
    suggestions: [suggestion],
  });

  mockedFetchBoardroomRuns.mockResolvedValue({
    total: 0,
    page: 1,
    pageSize: 10,
    items: [],
  });

  mockedFetchBoardroomRun.mockResolvedValue({
    id: 'run-1',
    boardId: 'board-1',
    boardName: 'Classic Boardroom',
    boardMembers: board.members,
    question: 'Should we focus on retention?',
    context: null,
    durationMs: 1500,
    modelClasses: ['SMALL', 'LARGE'],
    createdAt: '2026-04-03T10:00:00.000Z',
    result: {
      decision: 'Focus on retention',
      reasoning: 'Retention compounds.',
      keyTradeoffs: ['Growth speed vs efficiency'],
      risks: ['Slower top-line growth'],
      actionPlan: ['Improve onboarding'],
      dissentingOpinions: [],
      debate: {
        independentSummaries: [],
        critiqueSummaries: [],
        revisionSummaries: [],
      },
    },
  });

  mockedRunBoardroom.mockResolvedValue({
    decision: 'Focus on retention',
    reasoning: 'Retention compounds.',
    keyTradeoffs: ['Growth speed vs efficiency'],
    risks: ['Slower top-line growth'],
    actionPlan: ['Improve onboarding'],
    dissentingOpinions: [],
    debate: {
      independentSummaries: [],
      critiqueSummaries: [],
      revisionSummaries: [],
    },
  });

  mockedUpdateBoardroomBoard.mockResolvedValue(board);
  mockedCreateBoardroomBoard.mockResolvedValue({ ...board, id: 'board-2', name: 'Saved Copy' });
  mockedDeleteBoardroomBoard.mockResolvedValue();
});

describe('AiBoardroomPanel', () => {
  it('updates an existing saved board', async () => {
    render(<AiBoardroomPanel />);

    const boardNameInput = await screen.findByLabelText('Board name');
    await waitFor(() => {
      expect(boardNameInput).toHaveValue('Classic Boardroom');
    });

    fireEvent.change(boardNameInput, { target: { value: 'Classic Boardroom v2' } });
    expect(boardNameInput).toHaveValue('Classic Boardroom v2');

    await userEvent.click(screen.getByRole('button', { name: 'Update Board' }));

    await waitFor(() => {
      expect(mockedUpdateBoardroomBoard).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ name: 'Classic Boardroom v2' }),
      );
    });
  });

  it('applies a persona suggestion and autofills member fields', async () => {
    render(<AiBoardroomPanel />);

    await screen.findByLabelText('Board name');
    const suggestionInput = await screen.findByLabelText('Persona suggestion');

    fireEvent.change(suggestionInput, { target: { value: 'paul-graham-investor' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Persona label')).toHaveValue('Paul Graham-style investor');
      expect(screen.getByLabelText('Title')).toHaveValue('Early-stage investor');
    });
  });

  it('supports saving current board after a successful run', async () => {
    render(<AiBoardroomPanel />);

    const questionInput = await screen.findByLabelText('Decision question');
    await userEvent.type(questionInput, 'Should we optimize for retention this quarter?');

    await userEvent.click(screen.getByRole('button', { name: 'Run AI Boardroom' }));

    await screen.findByText('Final Decision');
    await userEvent.click(screen.getByRole('button', { name: 'Update This Board' }));

    await waitFor(() => {
      expect(mockedUpdateBoardroomBoard).toHaveBeenCalled();
    });
  });
});
