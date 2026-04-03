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

import { fetchBoardroomRun, fetchBoardroomRuns, runBoardroom } from './adminApi';
import type {
  BoardroomContextInput,
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

export default function AiBoardroomPanel() {
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

  const canRun = question.trim().length > 0 && !isRunning;

  const suspenseLines = useMemo(
    () => [
      'Collecting independent recommendations from each role',
      'Cross-checking disagreements and hidden assumptions',
      'Synthesizing one unified recommendation from the chairman',
    ],
    [],
  );

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
    setLoadingRunId(runId);
    setError(null);

    try {
      const run = await fetchBoardroomRun(runId);
      setQuestion(run.question);
      applyContextInputs(run.context);
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

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">AI Boardroom</Typography>
            <Typography variant="body2" color="text.secondary">
              Ask a strategic question and receive a structured recommendation from a multi-role
              decision pipeline.
            </Typography>

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
                        Saved {formatDateTime(run.createdAt)} • {run.durationMs}ms
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
                <Typography variant="h6">{result.decision}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.reasoning}
                </Typography>
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
                        <Typography key={`ind-${item.role}`} variant="body2" color="text.secondary">
                          <strong>{item.role}</strong>: {item.summary}
                        </Typography>
                      ))}
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Critique</Typography>
                      {result.debate.critiqueSummaries.map((item) => (
                        <Typography key={`crt-${item.role}`} variant="body2" color="text.secondary">
                          <strong>{item.role}</strong>: {item.summary}
                        </Typography>
                      ))}
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Revision</Typography>
                      {result.debate.revisionSummaries.map((item) => (
                        <Typography key={`rev-${item.role}`} variant="body2" color="text.secondary">
                          <strong>{item.role}</strong>: {item.summary}
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
