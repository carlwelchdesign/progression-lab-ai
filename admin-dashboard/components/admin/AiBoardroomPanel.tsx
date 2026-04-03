'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import GroupedAutocompleteField from '../ui/GroupedAutocompleteField';
import {
  createBoardroomBoard,
  deleteBoardroomBoard,
  fetchBoardroomBoards,
  fetchBoardroomRun,
  fetchBoardroomRuns,
  runBoardroom,
  updateBoardroomBoard,
} from './adminApi';
import type {
  BoardroomBoard,
  BoardroomBoardMember,
  BoardroomContextInput,
  BoardroomPersonaSuggestion,
  BoardroomRunHistoryItem,
  BoardroomProductStage,
  BoardroomRiskTolerance,
  BoardroomRunResult,
} from './types';

const PRODUCT_STAGES: BoardroomProductStage[] = [
  'IDEA',
  'MVP',
  'EARLY_TRACTION',
  'GROWTH',
  'SCALE',
];
const RISK_LEVELS: BoardroomRiskTolerance[] = ['LOW', 'MEDIUM', 'HIGH'];
const DEFAULT_MEMBER_MAX_OUTPUT_CHARS = 1400;

function toListFromMultiline(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toMultiline(value?: string[]): string {
  return Array.isArray(value) ? value.join('\n') : '';
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function cloneBoard(board: BoardroomBoard): BoardroomBoard {
  return {
    ...board,
    members: board.members.map((member) => ({
      ...member,
      priorities: [...member.priorities],
      biases: [...member.biases],
    })),
  };
}

function createBlankMember(displayOrder: number): BoardroomBoardMember {
  return {
    personaLabel: '',
    title: '',
    priorities: [],
    biases: [],
    modelClass: 'SMALL',
    maxOutputChars: DEFAULT_MEMBER_MAX_OUTPUT_CHARS,
    displayOrder,
    suggestionKey: null,
    isActive: true,
  };
}

function createBlankBoard(template?: BoardroomBoard): BoardroomBoard {
  if (template) {
    const next = cloneBoard(template);
    return {
      ...next,
      id: undefined,
      isDefault: false,
      name: `${template.name} Copy`,
    };
  }

  return {
    name: 'Untitled Board',
    description: '',
    isDefault: false,
    members: [createBlankMember(0)],
  };
}

function normalizeBoard(board: BoardroomBoard): BoardroomBoard {
  return {
    ...board,
    description: board.description ?? '',
    members: [...board.members]
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((member, index) => ({
        ...member,
        displayOrder: index,
      })),
  };
}

function buildSuggestionMaps(suggestions: BoardroomPersonaSuggestion[]) {
  const suggestionByKey = new Map(suggestions.map((suggestion) => [suggestion.key, suggestion]));
  const groupByName = Object.fromEntries(
    suggestions.map((suggestion) => [suggestion.key, suggestion.group]),
  );

  return {
    suggestionByKey,
    suggestionKeys: suggestions.map((suggestion) => suggestion.key),
    groupByName,
  };
}

function boardSignature(board: BoardroomBoard | null): string {
  if (!board) {
    return '';
  }

  const normalized = normalizeBoard(cloneBoard(board));

  return JSON.stringify({
    id: normalized.id ?? null,
    name: normalized.name,
    description: normalized.description ?? '',
    isDefault: normalized.isDefault === true,
    members: normalized.members.map((member) => ({
      id: member.id ?? null,
      personaLabel: member.personaLabel,
      title: member.title,
      priorities: member.priorities,
      biases: member.biases,
      modelClass: member.modelClass,
      maxOutputChars: member.maxOutputChars,
      displayOrder: member.displayOrder,
      suggestionKey: member.suggestionKey ?? null,
      isActive: member.isActive,
    })),
  });
}

export default function AiBoardroomPanel() {
  const [boards, setBoards] = useState<BoardroomBoard[]>([]);
  const [suggestions, setSuggestions] = useState<BoardroomPersonaSuggestion[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BoardroomBoard | null>(null);
  const [baselineBoardSignature, setBaselineBoardSignature] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [isBoardsLoading, setIsBoardsLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);

  const [question, setQuestion] = useState('');
  const [productStage, setProductStage] = useState<BoardroomProductStage | ''>('');
  const [goalsInput, setGoalsInput] = useState('');
  const [constraintsInput, setConstraintsInput] = useState('');
  const [budget, setBudget] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [riskTolerance, setRiskTolerance] = useState<BoardroomRiskTolerance | ''>('');
  const [extraNotes, setExtraNotes] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BoardroomRunResult | null>(null);
  const [activeRunMeta, setActiveRunMeta] = useState<{
    id: string;
    createdAt: string;
    durationMs: number;
  } | null>(null);

  const [savedRuns, setSavedRuns] = useState<BoardroomRunHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null);

  const canRun =
    question.trim().length > 0 &&
    !isRunning &&
    Boolean(currentBoard?.members.some((member) => member.isActive));

  const suspenseLines = useMemo(
    () => [
      'Collecting independent recommendations from each role',
      'Cross-checking disagreements and hidden assumptions',
      'Synthesizing one unified recommendation from the chairman',
    ],
    [],
  );

  const { suggestionByKey, suggestionKeys, groupByName } = useMemo(
    () => buildSuggestionMaps(suggestions),
    [suggestions],
  );

  const isBoardDirty = useMemo(
    () => boardSignature(currentBoard) !== baselineBoardSignature,
    [baselineBoardSignature, currentBoard],
  );

  const applyBoard = useCallback((board: BoardroomBoard) => {
    const normalized = normalizeBoard(cloneBoard(board));
    setCurrentBoard(normalized);
    setBaselineBoardSignature(boardSignature(normalized));
    setSelectedBoardId(board.id ?? '');
  }, []);

  const loadBoards = useCallback(async () => {
    setIsBoardsLoading(true);
    setBoardError(null);

    try {
      const response = await fetchBoardroomBoards();
      setBoards(response.items);
      setSuggestions(response.suggestions);

      const preferredBoard =
        response.items.find((board) => board.id === selectedBoardId) ??
        response.items.find((board) => board.isDefault) ??
        response.items[0] ??
        null;

      if (preferredBoard) {
        applyBoard(preferredBoard);
      } else {
        setCurrentBoard((previous) => {
          if (previous) {
            return previous;
          }

          const blankBoard = createBlankBoard();
          setBaselineBoardSignature(boardSignature(blankBoard));
          return blankBoard;
        });
      }
    } catch (loadError) {
      setBoardError((loadError as Error).message);
      setCurrentBoard((previous) => {
        if (previous) {
          return previous;
        }

        const blankBoard = createBlankBoard();
        setBaselineBoardSignature(boardSignature(blankBoard));
        return blankBoard;
      });
    } finally {
      setIsBoardsLoading(false);
    }
  }, [applyBoard, selectedBoardId]);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      const page = await fetchBoardroomRuns({ page: 1, pageSize: 10 });
      setSavedRuns(page.items);
    } catch (historyLoadError) {
      setHistoryError((historyLoadError as Error).message);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  function applyContextInputs(context: BoardroomContextInput | null | undefined) {
    setProductStage(context?.productStage ?? '');
    setGoalsInput(toMultiline(context?.goals));
    setConstraintsInput(toMultiline(context?.constraints));
    setBudget(context?.budget ?? '');
    setTimeframe(context?.timeframe ?? '');
    setRiskTolerance(context?.riskTolerance ?? '');
    setExtraNotes(context?.extraNotes ?? '');
  }

  async function handleLoadRun(runId: string) {
    if (isBoardDirty && !window.confirm('Discard unsaved board edits and load this saved run?')) {
      return;
    }

    setLoadingRunId(runId);
    setError(null);

    try {
      const run = await fetchBoardroomRun(runId);
      setQuestion(run.question);
      applyContextInputs(run.context);
      const loadedBoard = normalizeBoard({
        id: run.boardId ?? undefined,
        name: run.boardName,
        description: '',
        isDefault: false,
        members: run.boardMembers,
      });
      setCurrentBoard(loadedBoard);
      setBaselineBoardSignature(boardSignature(loadedBoard));
      setSelectedBoardId(run.boardId ?? '');
      setResult(run.result);
      setActiveRunMeta({
        id: run.id,
        createdAt: run.createdAt,
        durationMs: run.durationMs,
      });
    } catch (loadRunError) {
      setError((loadRunError as Error).message);
    } finally {
      setLoadingRunId(null);
    }
  }

  async function handleRun() {
    if (!canRun) {
      return;
    }

    const context: BoardroomContextInput = {};

    if (productStage) {
      context.productStage = productStage;
    }
    const goals = toListFromMultiline(goalsInput);
    if (goals.length > 0) {
      context.goals = goals;
    }
    const constraints = toListFromMultiline(constraintsInput);
    if (constraints.length > 0) {
      context.constraints = constraints;
    }
    if (budget.trim()) {
      context.budget = budget.trim();
    }
    if (timeframe.trim()) {
      context.timeframe = timeframe.trim();
    }
    if (riskTolerance) {
      context.riskTolerance = riskTolerance;
    }
    if (extraNotes.trim()) {
      context.extraNotes = extraNotes.trim();
    }

    setIsRunning(true);
    setError(null);

    try {
      const next = await runBoardroom({
        question: question.trim(),
        context: Object.keys(context).length > 0 ? context : undefined,
        boardId: currentBoard?.id,
        boardName: currentBoard?.name,
        boardMembers: currentBoard?.members,
      });
      setResult(next);
      setActiveRunMeta(null);
      await loadHistory();
    } catch (runError) {
      setError((runError as Error).message);
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSaveBoard() {
    if (!currentBoard) {
      return;
    }

    setIsSavingBoard(true);
    setBoardError(null);

    try {
      const payload = normalizeBoard(currentBoard);
      const saved = payload.id
        ? await updateBoardroomBoard(payload.id, payload)
        : await createBoardroomBoard(payload);

      const normalizedSavedBoard = normalizeBoard(saved);
      setCurrentBoard(normalizedSavedBoard);
      setBaselineBoardSignature(boardSignature(normalizedSavedBoard));
      setSelectedBoardId(saved.id ?? '');
      await loadBoards();
    } catch (saveError) {
      setBoardError((saveError as Error).message);
    } finally {
      setIsSavingBoard(false);
    }
  }

  async function handleDeleteCurrentBoard() {
    if (!currentBoard?.id) {
      const blankBoard = createBlankBoard(currentBoard ?? undefined);
      setCurrentBoard(blankBoard);
      setBaselineBoardSignature(boardSignature(blankBoard));
      setSelectedBoardId('');
      return;
    }

    setIsDeletingBoard(true);
    setBoardError(null);

    try {
      await deleteBoardroomBoard(currentBoard.id);
      setSelectedBoardId('');
      await loadBoards();
    } catch (deleteError) {
      setBoardError((deleteError as Error).message);
    } finally {
      setIsDeletingBoard(false);
    }
  }

  async function handleSaveBoardAsNew() {
    if (!currentBoard) {
      return;
    }

    setIsSavingBoard(true);
    setBoardError(null);

    try {
      const payload = normalizeBoard({
        ...currentBoard,
        id: undefined,
        isDefault: false,
      });
      const saved = await createBoardroomBoard(payload);
      const normalizedSavedBoard = normalizeBoard(saved);
      setCurrentBoard(normalizedSavedBoard);
      setBaselineBoardSignature(boardSignature(normalizedSavedBoard));
      setSelectedBoardId(saved.id ?? '');
      await loadBoards();
    } catch (saveError) {
      setBoardError((saveError as Error).message);
    } finally {
      setIsSavingBoard(false);
    }
  }

  function updateBoardFields(fields: Partial<BoardroomBoard>) {
    setCurrentBoard((prev) => (prev ? normalizeBoard({ ...prev, ...fields }) : prev));
  }

  function updateMember(
    index: number,
    updater: (member: BoardroomBoardMember) => BoardroomBoardMember,
  ) {
    setCurrentBoard((prev) => {
      if (!prev) {
        return prev;
      }

      const members = prev.members.map((member, memberIndex) =>
        memberIndex === index ? updater(member) : member,
      );

      return normalizeBoard({ ...prev, members });
    });
  }

  function moveMember(index: number, direction: -1 | 1) {
    setCurrentBoard((prev) => {
      if (!prev) {
        return prev;
      }

      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.members.length) {
        return prev;
      }

      const members = [...prev.members];
      const [member] = members.splice(index, 1);
      members.splice(targetIndex, 0, member);

      return normalizeBoard({ ...prev, members });
    });
  }

  function removeMember(index: number) {
    setCurrentBoard((prev) => {
      if (!prev) {
        return prev;
      }

      const members = prev.members.filter((_, memberIndex) => memberIndex !== index);
      return normalizeBoard({
        ...prev,
        members: members.length > 0 ? members : [createBlankMember(0)],
      });
    });
  }

  function addMember() {
    setCurrentBoard((prev) =>
      prev
        ? normalizeBoard({
            ...prev,
            members: [...prev.members, createBlankMember(prev.members.length)],
          })
        : prev,
    );
  }

  function applySuggestion(index: number, rawValue: string) {
    const suggestion = suggestionByKey.get(rawValue);

    updateMember(index, (member) => {
      if (!suggestion) {
        return {
          ...member,
          personaLabel: rawValue,
          suggestionKey: null,
        };
      }

      return {
        ...member,
        personaLabel: suggestion.label,
        title: suggestion.title,
        priorities: [...suggestion.priorities],
        biases: [...suggestion.biases],
        modelClass: suggestion.modelClass,
        suggestionKey: suggestion.key,
      };
    });
  }

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">AI Boardroom</Typography>
            <Typography variant="body2" color="text.secondary">
              Edit reusable boards, run them against strategic questions, and save strong boards for
              reuse.
            </Typography>

            {boardError ? <Alert severity="error">{boardError}</Alert> : null}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Saved board"
                  value={selectedBoardId}
                  onChange={(event) => {
                    const nextBoard = boards.find((board) => board.id === event.target.value);

                    if (
                      nextBoard &&
                      nextBoard.id !== selectedBoardId &&
                      isBoardDirty &&
                      !window.confirm('Discard unsaved board edits and switch boards?')
                    ) {
                      return;
                    }

                    setSelectedBoardId(event.target.value);
                    if (nextBoard) {
                      applyBoard(nextBoard);
                    }
                  }}
                  select
                  fullWidth
                  disabled={isBoardsLoading}
                >
                  <MenuItem value="">Unsaved current board</MenuItem>
                  {boards.map((board) => (
                    <MenuItem key={board.id} value={board.id}>
                      {board.name}
                      {board.isDefault ? ' (default)' : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Board name"
                  value={currentBoard?.name ?? ''}
                  onChange={(event) => updateBoardFields({ name: event.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Board notes"
                  value={currentBoard?.description ?? ''}
                  onChange={(event) => updateBoardFields({ description: event.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => void handleSaveBoard()}
                disabled={!currentBoard || isSavingBoard}
              >
                {isSavingBoard
                  ? 'Saving board...'
                  : currentBoard?.id
                    ? 'Update Board'
                    : 'Save Board'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handleSaveBoardAsNew()}
                disabled={!currentBoard || isSavingBoard}
              >
                Save As New Board
              </Button>
              <Button
                variant="outlined"
                onClick={() => setCurrentBoard(createBlankBoard(currentBoard ?? undefined))}
              >
                New Board Draft
              </Button>
              <Button
                variant="text"
                color="error"
                onClick={() => void handleDeleteCurrentBoard()}
                disabled={!currentBoard || isDeletingBoard}
              >
                {isDeletingBoard
                  ? 'Deleting...'
                  : currentBoard?.id
                    ? 'Delete Board'
                    : 'Discard Draft'}
              </Button>
              <Button variant="text" onClick={() => void loadBoards()} disabled={isBoardsLoading}>
                {isBoardsLoading ? 'Refreshing boards...' : 'Refresh Boards'}
              </Button>
              {isBoardDirty ? <Chip size="small" color="warning" label="Unsaved edits" /> : null}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Board Members</Typography>
                <Button size="small" onClick={() => addMember()}>
                  Add Member
                </Button>
              </Stack>

              {currentBoard?.members.map((member, index) => (
                <Card key={`${member.id ?? 'draft'}-${index}`} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', md: 'center' }}
                      >
                        <Box sx={{ minWidth: 140 }}>
                          <Typography variant="subtitle2">Member {index + 1}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Checkbox
                              checked={member.isActive}
                              onChange={(event) =>
                                updateMember(index, (currentMember) => ({
                                  ...currentMember,
                                  isActive: event.target.checked,
                                }))
                              }
                            />
                            <Typography variant="body2" color="text.secondary">
                              Active
                            </Typography>
                          </Stack>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <GroupedAutocompleteField
                            label="Persona suggestion"
                            value={member.suggestionKey ?? member.personaLabel}
                            onChange={(value) => applySuggestion(index, value)}
                            options={suggestionKeys}
                            freeSolo
                            groupByName={groupByName}
                            getOptionLabel={(option) =>
                              suggestionByKey.get(option)?.label ?? option
                            }
                            helperText="Pick a curated style or type a custom persona label."
                          />
                        </Box>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            label="Persona label"
                            value={member.personaLabel}
                            onChange={(event) =>
                              updateMember(index, (currentMember) => ({
                                ...currentMember,
                                personaLabel: event.target.value,
                                suggestionKey: null,
                              }))
                            }
                            fullWidth
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            label="Title"
                            value={member.title}
                            onChange={(event) =>
                              updateMember(index, (currentMember) => ({
                                ...currentMember,
                                title: event.target.value,
                              }))
                            }
                            fullWidth
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            label="Model"
                            value={member.modelClass}
                            onChange={(event) =>
                              updateMember(index, (currentMember) => ({
                                ...currentMember,
                                modelClass: event.target
                                  .value as BoardroomBoardMember['modelClass'],
                              }))
                            }
                            select
                            fullWidth
                          >
                            <MenuItem value="SMALL">SMALL</MenuItem>
                            <MenuItem value="LARGE">LARGE</MenuItem>
                          </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            label="Max chars"
                            value={member.maxOutputChars}
                            onChange={(event) =>
                              updateMember(index, (currentMember) => ({
                                ...currentMember,
                                maxOutputChars:
                                  Number(event.target.value) || DEFAULT_MEMBER_MAX_OUTPUT_CHARS,
                              }))
                            }
                            type="number"
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            label="Priorities (one per line)"
                            value={toMultiline(member.priorities)}
                            onChange={(event) =>
                              updateMember(index, (currentMember) => ({
                                ...currentMember,
                                priorities: toListFromMultiline(event.target.value),
                              }))
                            }
                            multiline
                            minRows={3}
                            fullWidth
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            label="Biases (one per line)"
                            value={toMultiline(member.biases)}
                            onChange={(event) =>
                              updateMember(index, (currentMember) => ({
                                ...currentMember,
                                biases: toListFromMultiline(event.target.value),
                              }))
                            }
                            multiline
                            minRows={3}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          onClick={() => moveMember(index, -1)}
                          disabled={index === 0}
                        >
                          Move Up
                        </Button>
                        <Button
                          size="small"
                          onClick={() => moveMember(index, 1)}
                          disabled={index === (currentBoard?.members.length ?? 1) - 1}
                        >
                          Move Down
                        </Button>
                        <Button size="small" color="error" onClick={() => removeMember(index)}>
                          Remove
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            <TextField
              label="Decision question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              multiline
              minRows={3}
              fullWidth
              placeholder="Example: Should we invest in product-led growth or paid acquisition first for the next 2 quarters?"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Product stage"
                  value={productStage}
                  onChange={(event) => setProductStage(event.target.value as BoardroomProductStage)}
                  select
                  fullWidth
                >
                  <MenuItem value="">Not specified</MenuItem>
                  {PRODUCT_STAGES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Budget"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  fullWidth
                  placeholder="Example: $30k over 90 days"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Timeframe"
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  fullWidth
                  placeholder="Example: Next 2 quarters"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Goals (one per line)"
                  value={goalsInput}
                  onChange={(event) => setGoalsInput(event.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Constraints (one per line)"
                  value={constraintsInput}
                  onChange={(event) => setConstraintsInput(event.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Risk tolerance"
                  value={riskTolerance}
                  onChange={(event) =>
                    setRiskTolerance(event.target.value as BoardroomRiskTolerance)
                  }
                  select
                  fullWidth
                >
                  <MenuItem value="">Not specified</MenuItem>
                  {RISK_LEVELS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="Extra notes"
                  value={extraNotes}
                  onChange={(event) => setExtraNotes(event.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box>
              <Button variant="contained" disabled={!canRun} onClick={() => void handleRun()}>
                {isRunning ? 'Boardroom Running...' : 'Run AI Boardroom'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {isRunning && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Boardroom Deliberation In Progress</Typography>
              <LinearProgress />
              {suspenseLines.map((line) => (
                <Typography key={line} variant="body2" color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Saved Boardroom Runs</Typography>
              <Button size="small" onClick={() => void loadHistory()} disabled={isHistoryLoading}>
                Refresh
              </Button>
            </Stack>

            {isHistoryLoading ? <LinearProgress /> : null}
            {historyError ? <Alert severity="error">{historyError}</Alert> : null}

            {savedRuns.length === 0 && !isHistoryLoading ? (
              <Typography variant="body2" color="text.secondary">
                No saved runs yet. Run AI Boardroom to create the first saved result.
              </Typography>
            ) : null}

            <Stack spacing={1}>
              {savedRuns.map((run) => (
                <Card key={run.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">{run.question}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {run.boardName} • Saved {formatDateTime(run.createdAt)} • {run.durationMs}ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {run.decision}
                      </Typography>
                      <Box>
                        <Button
                          size="small"
                          variant="text"
                          disabled={loadingRunId === run.id}
                          onClick={() => void handleLoadRun(run.id)}
                        >
                          {loadingRunId === run.id ? 'Loading...' : 'Load Result'}
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {result && (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary">
                  Final Decision
                </Typography>
                {activeRunMeta ? (
                  <Typography variant="caption" color="text.secondary">
                    Loaded saved run from {formatDateTime(activeRunMeta.createdAt)} •{' '}
                    {activeRunMeta.durationMs}ms
                  </Typography>
                ) : null}
                {currentBoard ? (
                  <Typography variant="caption" color="text.secondary">
                    Active board: {currentBoard.name}
                  </Typography>
                ) : null}
                <Typography variant="h6">{result.decision}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.reasoning}
                </Typography>
                <Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => void handleSaveBoard()}
                    disabled={!currentBoard || isSavingBoard}
                  >
                    {currentBoard?.id ? 'Update This Board' : 'Save This Board'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Action Plan</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {result.actionPlan.map((step) => (
                    <Chip key={step} color="primary" label={step} />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Key Tradeoffs</Typography>
                    {result.keyTradeoffs.length > 0 ? (
                      result.keyTradeoffs.map((item) => (
                        <Typography key={item} variant="body2" color="text.secondary">
                          • {item}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No key tradeoffs were provided.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Risks</Typography>
                    {result.risks.length > 0 ? (
                      result.risks.map((item) => (
                        <Typography key={item} variant="body2" color="text.secondary">
                          • {item}
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No explicit risks were provided.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">View debate</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Summarized role outputs across each phase.
                </Typography>

                {result.debate ? (
                  <>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Independent</Typography>
                      {result.debate.independentSummaries.map((item) => (
                        <Typography
                          key={`ind-${item.memberLabel}`}
                          variant="body2"
                          color="text.secondary"
                        >
                          <strong>{item.memberLabel}</strong>: {item.summary}
                        </Typography>
                      ))}
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Critique</Typography>
                      {result.debate.critiqueSummaries.map((item) => (
                        <Typography
                          key={`crt-${item.memberLabel}`}
                          variant="body2"
                          color="text.secondary"
                        >
                          <strong>{item.memberLabel}</strong>: {item.summary}
                        </Typography>
                      ))}
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Revision</Typography>
                      {result.debate.revisionSummaries.map((item) => (
                        <Typography
                          key={`rev-${item.memberLabel}`}
                          variant="body2"
                          color="text.secondary"
                        >
                          <strong>{item.memberLabel}</strong>: {item.summary}
                        </Typography>
                      ))}
                    </Stack>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No debate summaries are available for this run.
                  </Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      )}
    </Stack>
  );
}
