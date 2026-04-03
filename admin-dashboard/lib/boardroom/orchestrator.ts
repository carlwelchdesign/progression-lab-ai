import { getDefaultBoardroomAgents } from './agents';
import { BoardroomError } from './errors';
import {
  buildChairmanPrompt,
  buildCritiquePrompt,
  buildIndependentPrompt,
  buildRevisionPrompt,
} from './prompts';
import { BoardroomProvider, OpenAiBoardroomProvider } from './provider';
import { summarizeCritiques, summarizeIndependentResponses, summarizeRevisions } from './summarize';
import {
  BoardroomCritiqueResponse,
  BoardroomIndependentResponse,
  BoardroomRevisionResponse,
  BoardroomRunRequest,
  BoardroomRunResponse,
  BoardroomSpecialistRole,
} from './types';
import {
  parseBoardroomRunRequest,
  parseCritiqueResponse,
  parseDecisionResponse,
  parseIndependentResponse,
  parseRevisionResponse,
} from './validation';

type BoardroomOrchestratorOptions = {
  provider?: BoardroomProvider;
  maxAgents?: number;
  timeoutMsPerCall?: number;
  maxRetries?: number;
};

type IndependentByRole = Partial<Record<BoardroomSpecialistRole, BoardroomIndependentResponse>>;
type CritiqueByRole = Partial<Record<BoardroomSpecialistRole, BoardroomCritiqueResponse>>;
type RevisionByRole = Partial<Record<BoardroomSpecialistRole, BoardroomRevisionResponse>>;

const DEFAULT_TIMEOUT_MS_PER_CALL = 20000;
const DEFAULT_MAX_RETRIES = 1;

export class BoardroomOrchestrator {
  private readonly provider: BoardroomProvider;
  private readonly maxAgents: number;
  private readonly timeoutMsPerCall: number;
  private readonly maxRetries: number;

  constructor(options: BoardroomOrchestratorOptions = {}) {
    this.provider = options.provider ?? new OpenAiBoardroomProvider();
    this.maxAgents = Math.max(1, Math.min(5, options.maxAgents ?? 5));
    this.timeoutMsPerCall = Math.max(1, options.timeoutMsPerCall ?? DEFAULT_TIMEOUT_MS_PER_CALL);
    this.maxRetries = Math.max(0, options.maxRetries ?? DEFAULT_MAX_RETRIES);
  }

  async run(input: unknown): Promise<BoardroomRunResponse> {
    const request = parseBoardroomRunRequest(input);
    return this.runWithRequest(request);
  }

  async runWithRequest(request: BoardroomRunRequest): Promise<BoardroomRunResponse> {
    const specialists = getDefaultBoardroomAgents(this.maxAgents);

    const independentByRole: IndependentByRole = {};
    const critiqueByRole: CritiqueByRole = {};
    const revisionByRole: RevisionByRole = {};

    await Promise.all(
      specialists.map(async (agent) => {
        const prompt = buildIndependentPrompt({ request, agent });
        const raw = await this.callProviderWithRetries({
          prompt,
          modelClass: agent.modelClass,
        });
        independentByRole[agent.role] = parseIndependentResponse(raw);
      }),
    );

    await Promise.all(
      specialists.map(async (agent) => {
        const otherIndependentSummaries = specialists
          .filter((peer) => peer.role !== agent.role)
          .map((peer) => ({
            role: peer.role,
            response: independentByRole[peer.role],
          }))
          .filter(
            (
              item,
            ): item is { role: BoardroomSpecialistRole; response: BoardroomIndependentResponse } =>
              Boolean(item.response),
          );

        const prompt = buildCritiquePrompt({
          request,
          agent,
          otherIndependentSummaries,
        });

        const raw = await this.callProviderWithRetries({
          prompt,
          modelClass: agent.modelClass,
        });
        critiqueByRole[agent.role] = parseCritiqueResponse(raw);
      }),
    );

    await Promise.all(
      specialists.map(async (agent) => {
        const priorIndependent = independentByRole[agent.role];
        if (!priorIndependent) {
          throw new BoardroomError({
            code: 'ORCHESTRATION_TIMEOUT',
            message: `Missing phase 1 output for ${agent.role}`,
            status: 500,
          });
        }

        const critiqueSummary = this.buildCritiqueSummaryForRole(agent.role, critiqueByRole);
        const prompt = buildRevisionPrompt({
          request,
          agent,
          priorIndependent,
          critiqueSummary,
        });

        const raw = await this.callProviderWithRetries({
          prompt,
          modelClass: agent.modelClass,
        });
        revisionByRole[agent.role] = parseRevisionResponse(raw);
      }),
    );

    const revisedPositions = specialists
      .map((agent) => ({
        role: agent.role,
        revision: revisionByRole[agent.role],
      }))
      .filter(
        (item): item is { role: BoardroomSpecialistRole; revision: BoardroomRevisionResponse } =>
          Boolean(item.revision),
      );

    const chairmanPrompt = buildChairmanPrompt({
      request,
      revisedPositions,
    });

    const chairmanRaw = await this.callProviderWithRetries({
      prompt: chairmanPrompt,
      modelClass: 'LARGE',
    });

    const decision = parseDecisionResponse(chairmanRaw);

    const independentSummaries = summarizeIndependentResponses(
      specialists
        .map((agent) => ({
          role: agent.role,
          response: independentByRole[agent.role],
        }))
        .filter(
          (
            item,
          ): item is { role: BoardroomSpecialistRole; response: BoardroomIndependentResponse } =>
            Boolean(item.response),
        ),
    );

    const critiqueSummaries = summarizeCritiques(
      specialists
        .map((agent) => ({
          role: agent.role,
          response: critiqueByRole[agent.role],
        }))
        .filter(
          (item): item is { role: BoardroomSpecialistRole; response: BoardroomCritiqueResponse } =>
            Boolean(item.response),
        ),
    );

    const revisionSummaries = summarizeRevisions(
      specialists
        .map((agent) => ({
          role: agent.role,
          response: revisionByRole[agent.role],
        }))
        .filter(
          (item): item is { role: BoardroomSpecialistRole; response: BoardroomRevisionResponse } =>
            Boolean(item.response),
        ),
    );

    return {
      ...decision,
      debate: {
        independentSummaries,
        critiqueSummaries,
        revisionSummaries,
      },
    };
  }

  private buildCritiqueSummaryForRole(
    role: BoardroomSpecialistRole,
    critiques: CritiqueByRole,
  ): {
    missingPoints: string[];
    disagreements: string[];
    weakAssumptions: string[];
  } {
    const all = Object.entries(critiques)
      .filter(
        (entry): entry is [BoardroomSpecialistRole, BoardroomCritiqueResponse] =>
          Boolean(entry[1]) && entry[0] !== role,
      )
      .map(([, critique]) => critique);

    return {
      missingPoints: all.flatMap((item) => item.missingPoints).slice(0, 7),
      disagreements: all.flatMap((item) => item.disagreements).slice(0, 7),
      weakAssumptions: all.flatMap((item) => item.weakAssumptions).slice(0, 7),
    };
  }

  private async callProviderWithRetries(params: {
    prompt: string;
    modelClass: 'SMALL' | 'LARGE';
  }): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        return await this.withTimeout(
          this.provider.generateJson({
            prompt: params.prompt,
            modelClass: params.modelClass,
            timeoutMs: this.timeoutMsPerCall,
          }),
          this.timeoutMsPerCall,
        );
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error)) {
          throw error;
        }
      }
    }

    if (lastError instanceof BoardroomError) {
      throw new BoardroomError({
        code: lastError.code,
        message: lastError.message,
        status: lastError.status,
        details: {
          ...(lastError.details ?? {}),
          modelClass: params.modelClass,
          maxRetries: this.maxRetries,
          attempts: this.maxRetries + 1,
        },
      });
    }

    throw new BoardroomError({
      code: 'RETRIES_EXHAUSTED',
      message: 'Boardroom provider retries exhausted',
      status: 504,
      details: {
        modelClass: params.modelClass,
        maxRetries: this.maxRetries,
        reason: lastError instanceof Error ? lastError.message : 'Unknown',
      },
    });
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof BoardroomError) {
      return error.code === 'PROVIDER_FAILURE' || error.code === 'ORCHESTRATION_TIMEOUT';
    }

    return true;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(
              new BoardroomError({
                code: 'ORCHESTRATION_TIMEOUT',
                message: 'Boardroom provider call timed out',
                status: 504,
              }),
            );
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
