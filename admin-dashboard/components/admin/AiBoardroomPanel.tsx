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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPrintParagraphs(value: string): string {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return '<p class="empty-state">Not provided.</p>';
  }

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function renderPrintList(items: string[], ordered = false): string {
  if (items.length === 0) {
    return '<p class="empty-state">None provided.</p>';
  }

  const tagName = ordered ? 'ol' : 'ul';
  return `<${tagName}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tagName}>`;
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
  const [isBoardMembersExpanded, setIsBoardMembersExpanded] = useState(false);

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
  const [isSavedRunsExpanded, setIsSavedRunsExpanded] = useState(false);
  const [isAdvancedInputsExpanded, setIsAdvancedInputsExpanded] = useState(false);

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
  const boardMemberCount = currentBoard?.members.length ?? 0;
  const activeBoardMemberCount =
    currentBoard?.members.filter((member) => member.isActive).length ?? 0;

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

  function handlePrintResult() {
    if (!result) return;
    const now = new Date().toLocaleString();
    const metadata = [
      { label: 'Generated', value: now },
      ...(currentBoard ? [{ label: 'Board', value: currentBoard.name }] : []),
      ...(activeRunMeta
        ? [
            {
              label: 'Saved Run',
              value: `${formatDateTime(activeRunMeta.createdAt)} (${activeRunMeta.durationMs}ms)`,
            },
          ]
        : []),
    ];
    const debateSections = result.debate
      ? [
          {
            title: 'Independent View',
            items: result.debate.independentSummaries,
          },
          {
            title: 'Critique',
            items: result.debate.critiqueSummaries,
          },
          {
            title: 'Revision',
            items: result.debate.revisionSummaries,
          },
        ]
      : [];
    const printDocument = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Boardroom Result</title>
    <style>
      :root {
        color-scheme: light;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #171717;
      }

      body {
        font-family: Georgia, 'Times New Roman', serif;
        padding: 0;
        line-height: 1.6;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        max-width: 7.55in;
        margin: 0 auto;
        padding: 0.28in 0;
      }

      .header {
        margin-bottom: 0.35in;
        padding-bottom: 0.18in;
        border-bottom: 1px solid #d4d4d4;
      }

      .eyebrow,
      .meta-label,
      .section-kicker,
      .debate-label {
        font-family: Arial, sans-serif;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #5f5f5f;
      }

      .eyebrow {
        display: block;
        margin-bottom: 12px;
      }

      h1,
      h2,
      h3,
      p,
      ul,
      ol,
      dl,
      dd {
        margin: 0;
      }

      h1 {
        font-size: 22px;
        line-height: 1.18;
        font-weight: 700;
        letter-spacing: -0.015em;
        margin-bottom: 8px;
        max-width: 28ch;
      }

      .lede {
        font-size: 13px;
        line-height: 1.55;
        color: #4b4b4b;
        max-width: 74ch;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(1.7in, 1fr));
        gap: 12px 18px;
        margin-top: 18px;
      }

      .meta-item {
        padding-top: 8px;
        border-top: 1px solid #ececec;
      }

      .meta-value {
        display: block;
        margin-top: 4px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.45;
        color: #171717;
      }

      .section {
        margin-top: 0.3in;
      }

      .section-kicker {
        display: block;
        margin-bottom: 8px;
      }

      h2 {
        font-size: 19px;
        line-height: 1.2;
        font-weight: 700;
        margin-bottom: 14px;
      }

      h3 {
        font-size: 14px;
        line-height: 1.3;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .decision-card {
        background: #f7f3eb;
        border: 1px solid #e6dcc9;
        padding: 18px 20px;
        break-inside: avoid;
      }

      .decision-text {
        font-size: 17px;
        line-height: 1.35;
        font-weight: 700;
        margin-bottom: 12px;
      }

      .body-copy,
      .body-copy p,
      .body-copy li {
        font-size: 12.5px;
      }

      .body-copy p + p {
        margin-top: 10px;
      }

      .question-block {
        padding-left: 14px;
        border-left: 3px solid #d9d0bf;
      }

      ul,
      ol {
        padding-left: 20px;
      }

      li + li {
        margin-top: 6px;
      }

      .two-column {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
      }

      .panel {
        break-inside: avoid;
      }

      .debate-stage + .debate-stage {
        margin-top: 18px;
      }

      .debate-list {
        list-style: none;
        padding-left: 0;
      }

      .debate-list li + li {
        margin-top: 10px;
      }

      .debate-label {
        display: block;
        margin-bottom: 3px;
      }

      .empty-state {
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: #737373;
      }

      @media print {
        .page {
          max-width: none;
        }

        .section,
        .panel,
        .decision-card {
          break-inside: avoid;
        }
      }

      @media screen {
        body {
          background: #f3f0ea;
        }

        .page {
          background: #ffffff;
          box-shadow: 0 14px 40px rgba(17, 17, 17, 0.12);
          padding: 0.4in 0.4in;
          margin: 24px auto;
        }
      }

      @page {
        size: auto;
        margin: 0.55in 0.5in;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <span class="eyebrow">AI Boardroom Decision Packet</span>
        <h1>${escapeHtml(result.decision)}</h1>
        <p class="lede">A formatted record of the boardroom recommendation, including the framing question, rationale, action plan, tradeoffs, risks, dissent, and debate summary.</p>
        <section class="meta-grid">
          ${metadata
            .map(
              (item) =>
                `<div class="meta-item"><span class="meta-label">${escapeHtml(item.label)}</span><span class="meta-value">${escapeHtml(item.value)}</span></div>`,
            )
            .join('')}
        </section>
      </header>

      <section class="section">
        <span class="section-kicker">Question</span>
        <div class="question-block body-copy">
          ${renderPrintParagraphs(question || 'N/A')}
        </div>
      </section>

      <section class="section decision-card">
        <span class="section-kicker">Final Decision</span>
        <div class="decision-text">${escapeHtml(result.decision)}</div>
        <div class="body-copy">${renderPrintParagraphs(result.reasoning)}</div>
      </section>

      <section class="section two-column">
        <div class="panel">
          <span class="section-kicker">Action Plan</span>
          <h2>Recommended Next Steps</h2>
          <div class="body-copy">${renderPrintList(result.actionPlan, true)}</div>
        </div>
        <div class="panel">
          <span class="section-kicker">Tradeoffs</span>
          <h2>What This Decision Optimizes</h2>
          <div class="body-copy">${renderPrintList(result.keyTradeoffs)}</div>
        </div>
      </section>

      <section class="section two-column">
        <div class="panel">
          <span class="section-kicker">Risks</span>
          <h2>Points To Watch</h2>
          <div class="body-copy">${renderPrintList(result.risks)}</div>
        </div>
        <div class="panel">
          <span class="section-kicker">Dissent</span>
          <h2>Counterarguments</h2>
          <div class="body-copy">${renderPrintList(result.dissentingOpinions)}</div>
        </div>
      </section>

      ${
        debateSections.length > 0
          ? `<section class="section">
              <span class="section-kicker">Debate Record</span>
              <h2>How The Board Reached Its Recommendation</h2>
              ${debateSections
                .map(
                  (section) => `<section class="debate-stage panel">
                      <h3>${escapeHtml(section.title)}</h3>
                      ${
                        section.items.length > 0
                          ? `<ul class="debate-list body-copy">${section.items
                              .map(
                                (item) =>
                                  `<li><span class="debate-label">${escapeHtml(item.memberLabel)}</span><div>${renderPrintParagraphs(item.summary)}</div></li>`,
                              )
                              .join('')}</ul>`
                          : '<p class="empty-state">No debate notes were recorded for this stage.</p>'
                      }
                    </section>`,
                )
                .join('')}
            </section>`
          : ''
      }
    </main>
  </body>
</html>`;
    if (!document.body) {
      setError('Unable to prepare the print document. Please try again.');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'AI Boardroom Print Frame');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    let hasPrinted = false;
    let hasCleanedUp = false;

    const cleanup = () => {
      if (hasCleanedUp) {
        return;
      }
      hasCleanedUp = true;
      window.setTimeout(() => {
        iframe.remove();
      }, 1000);
    };

    iframe.onload = () => {
      if (hasPrinted) {
        return;
      }
      hasPrinted = true;
      iframe.onload = null;

      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        setError('Unable to open the print preview. Please try again.');
        return;
      }

      frameWindow.addEventListener('afterprint', cleanup, { once: true });
      window.setTimeout(() => {
        frameWindow.focus();
        frameWindow.print();
        window.setTimeout(cleanup, 1500);
      }, 300);
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = printDocument;
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

            <Accordion
              expanded={isBoardMembersExpanded}
              onChange={(_, expanded) => setIsBoardMembersExpanded(expanded)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1">Board Members</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {boardMemberCount} total, {activeBoardMemberCount} active
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Expand this section when you need to edit the board roster.
                    </Typography>
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
              </AccordionDetails>
            </Accordion>

            <TextField
              label="Decision question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              multiline
              minRows={3}
              fullWidth
              placeholder="Example: Should we invest in product-led growth or paid acquisition first for the next 2 quarters?"
            />

            <Accordion
              expanded={isAdvancedInputsExpanded}
              onChange={(_, expanded) => setIsAdvancedInputsExpanded(expanded)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Advanced Inputs</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Product stage, goals, constraints, budget, and risk context
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        label="Product stage"
                        value={productStage}
                        onChange={(event) =>
                          setProductStage(event.target.value as BoardroomProductStage)
                        }
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
                </Stack>
              </AccordionDetails>
            </Accordion>

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

      <Accordion
        expanded={isSavedRunsExpanded}
        onChange={(_, expanded) => setIsSavedRunsExpanded(expanded)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1">Saved Boardroom Runs</Typography>
            <Typography variant="body2" color="text.secondary">
              {savedRuns.length} saved run{savedRuns.length === 1 ? '' : 's'}
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Button size="small" onClick={() => void loadHistory()} disabled={isHistoryLoading}>
                Refresh
              </Button>
            </Box>

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
        </AccordionDetails>
      </Accordion>

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
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => void handleSaveBoard()}
                    disabled={!currentBoard || isSavingBoard}
                  >
                    {currentBoard?.id ? 'Update This Board' : 'Save This Board'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handlePrintResult}
                    disabled={!result}
                  >
                    Print / Save PDF
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Action Plan</Typography>
                {result.actionPlan.length > 0 ? (
                  <Box
                    component="ol"
                    sx={{
                      margin: 0,
                      paddingLeft: 3,
                    }}
                  >
                    {result.actionPlan.map((step) => (
                      <Typography
                        key={step}
                        component="li"
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                      >
                        {step}
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No action plan was provided.
                  </Typography>
                )}
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
                      <Box component="ul" sx={{ margin: 0, paddingLeft: 3 }}>
                        {result.debate.independentSummaries.map((item) => (
                          <Typography
                            key={`ind-${item.memberLabel}`}
                            component="li"
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                          >
                            <strong>{item.memberLabel}</strong>: {item.summary}
                          </Typography>
                        ))}
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Critique</Typography>
                      <Box component="ul" sx={{ margin: 0, paddingLeft: 3 }}>
                        {result.debate.critiqueSummaries.map((item) => (
                          <Typography
                            key={`crt-${item.memberLabel}`}
                            component="li"
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                          >
                            <strong>{item.memberLabel}</strong>: {item.summary}
                          </Typography>
                        ))}
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Revision</Typography>
                      <Box component="ul" sx={{ margin: 0, paddingLeft: 3 }}>
                        {result.debate.revisionSummaries.map((item) => (
                          <Typography
                            key={`rev-${item.memberLabel}`}
                            component="li"
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                          >
                            <strong>{item.memberLabel}</strong>: {item.summary}
                          </Typography>
                        ))}
                      </Box>
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
