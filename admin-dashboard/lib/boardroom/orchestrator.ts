import { createDefaultBoardroomMembers } from './agents';
import { BoardroomError } from './errors';
import { getBoardroomFeatureCatalog } from './featureCatalog';
import { getBoardroomProductCharter } from './productCharter';
import {
  validateBusinessModelDecision,
  validateDecisionAgainstFeatureCatalog,
  validateDecisionAgainstNonGoals,
} from './guardrails';
import {
  buildChairmanPrompt,
  buildCritiquePrompt,
  buildIndependentPrompt,
  buildRevisionPrompt,
} from './prompts';
import { BoardroomProvider, OpenAiBoardroomProvider } from './provider';
import { summarizeCritiques, summarizeIndependentResponses, summarizeRevisions } from './summarize';
import {
  BoardroomBoardMemberDefinition,
  BoardroomCritiqueResponse,
  BoardroomIndependentResponse,
  BoardroomRevisionResponse,
  BoardroomRunRequest,
  BoardroomRunResponse,
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

type IndependentByMember = Partial<Record<string, BoardroomIndependentResponse>>;
type CritiqueByMember = Partial<Record<string, BoardroomCritiqueResponse>>;
type RevisionByMember = Partial<Record<string, BoardroomRevisionResponse>>;

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
    const specialists = (request.boardMembers ?? createDefaultBoardroomMembers(this.maxAgents))
      .filter((member) => member.isActive)
      .slice(0, this.maxAgents);

    if (specialists.length === 0) {
      throw new BoardroomError({
        code: 'INVALID_INPUT',
        message: 'At least one active board member is required',
        status: 400,
      });
    }

    const featureCatalog = await getBoardroomFeatureCatalog();
    const productCharter = getBoardroomProductCharter();

    const independentByRole: IndependentByMember = {};
    const critiqueByRole: CritiqueByMember = {};
    const revisionByRole: RevisionByMember = {};

    await Promise.all(
      specialists.map(async (agent) => {
        const memberKey = this.getMemberKey(agent);
        const prompt = buildIndependentPrompt({ request, agent, featureCatalog, productCharter });
        const raw = await this.callProviderWithRetries({
          prompt,
          modelClass: agent.modelClass,
        });
        independentByRole[memberKey] = parseIndependentResponse(raw);
      }),
    );

    await Promise.all(
      specialists.map(async (agent) => {
        const memberKey = this.getMemberKey(agent);
        const otherIndependentSummaries = specialists
          .filter((peer) => this.getMemberKey(peer) !== memberKey)
          .map((peer) => ({
            memberLabel: peer.personaLabel,
            response: independentByRole[this.getMemberKey(peer)],
          }))
          .filter((item): item is { memberLabel: string; response: BoardroomIndependentResponse } =>
            Boolean(item.response),
          );

        const prompt = buildCritiquePrompt({
          request,
          agent,
          featureCatalog,
          productCharter,
          otherIndependentSummaries,
        });

        const raw = await this.callProviderWithRetries({
          prompt,
          modelClass: agent.modelClass,
        });
        critiqueByRole[memberKey] = parseCritiqueResponse(raw);
      }),
    );

    await Promise.all(
      specialists.map(async (agent) => {
        const memberKey = this.getMemberKey(agent);
        const priorIndependent = independentByRole[memberKey];
        if (!priorIndependent) {
          throw new BoardroomError({
            code: 'ORCHESTRATION_TIMEOUT',
            message: `Missing phase 1 output for ${agent.personaLabel}`,
            status: 500,
          });
        }

        const critiqueSummary = this.buildCritiqueSummaryForMember(memberKey, critiqueByRole);
        const prompt = buildRevisionPrompt({
          request,
          agent,
          featureCatalog,
          productCharter,
          priorIndependent,
          critiqueSummary,
        });

        const raw = await this.callProviderWithRetries({
          prompt,
          modelClass: agent.modelClass,
        });
        revisionByRole[memberKey] = parseRevisionResponse(raw);
      }),
    );

    const revisedPositions = specialists
      .map((agent) => ({
        memberLabel: agent.personaLabel,
        revision: revisionByRole[this.getMemberKey(agent)],
      }))
      .filter((item): item is { memberLabel: string; revision: BoardroomRevisionResponse } =>
        Boolean(item.revision),
      );

    const chairmanPrompt = buildChairmanPrompt({
      request,
      featureCatalog,
      productCharter,
      revisedPositions,
    });

    const chairmanRaw = await this.callProviderWithRetries({
      prompt: chairmanPrompt,
      modelClass: 'LARGE',
    });

    const decision = validateDecisionAgainstNonGoals({
      decision: validateDecisionAgainstFeatureCatalog({
        decision: validateBusinessModelDecision(parseDecisionResponse(chairmanRaw)),
        featureCatalog,
      }),
      productCharter,
    });

    const independentSummaries = summarizeIndependentResponses(
      specialists
        .map((agent) => ({
          memberLabel: agent.personaLabel,
          response: independentByRole[this.getMemberKey(agent)],
        }))
        .filter((item): item is { memberLabel: string; response: BoardroomIndependentResponse } =>
          Boolean(item.response),
        ),
    );

    const critiqueSummaries = summarizeCritiques(
      specialists
        .map((agent) => ({
          memberLabel: agent.personaLabel,
          response: critiqueByRole[this.getMemberKey(agent)],
        }))
        .filter((item): item is { memberLabel: string; response: BoardroomCritiqueResponse } =>
          Boolean(item.response),
        ),
    );

    const revisionSummaries = summarizeRevisions(
      specialists
        .map((agent) => ({
          memberLabel: agent.personaLabel,
          response: revisionByRole[this.getMemberKey(agent)],
        }))
        .filter((item): item is { memberLabel: string; response: BoardroomRevisionResponse } =>
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

  private getMemberKey(member: BoardroomBoardMemberDefinition): string {
    return `${member.displayOrder}:${member.personaLabel}`;
  }

  private buildCritiqueSummaryForMember(
    memberKey: string,
    critiques: CritiqueByMember,
  ): {
    missingPoints: string[];
    disagreements: string[];
    weakAssumptions: string[];
  } {
    const all = Object.entries(critiques)
      .filter(
        (entry): entry is [string, BoardroomCritiqueResponse] =>
          Boolean(entry[1]) && entry[0] !== memberKey,
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
