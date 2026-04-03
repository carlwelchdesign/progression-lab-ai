import OpenAI from 'openai';

import { BoardroomError } from './errors';
import { BoardroomModelClass } from './types';

export type BoardroomProviderRequest = {
  prompt: string;
  modelClass: BoardroomModelClass;
  timeoutMs: number;
};

export interface BoardroomProvider {
  generateJson(request: BoardroomProviderRequest): Promise<unknown>;
}

const DEFAULT_SMALL_MODEL = 'gpt-4o-mini';
const DEFAULT_LARGE_MODEL = 'gpt-4.1';

function getModelName(modelClass: BoardroomModelClass): string {
  return modelClass === 'LARGE' ? DEFAULT_LARGE_MODEL : DEFAULT_SMALL_MODEL;
}

export class OpenAiBoardroomProvider implements BoardroomProvider {
  private readonly apiKey?: string;
  private client: OpenAI | null;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.apiKey = apiKey?.trim() || undefined;
    this.client = null;
  }

  async generateJson(request: BoardroomProviderRequest): Promise<unknown> {
    const model = getModelName(request.modelClass);
    const client = this.getClient();

    try {
      const response = await client.responses.create({
        model,
        input: request.prompt,
      });

      const output = response.output_text?.trim();
      if (!output) {
        throw new BoardroomError({
          code: 'MODEL_OUTPUT_INVALID',
          message: 'Model returned empty output',
          status: 502,
          details: { modelClass: request.modelClass, model },
        });
      }

      try {
        return JSON.parse(output);
      } catch {
        throw new BoardroomError({
          code: 'MODEL_OUTPUT_INVALID',
          message: 'Model returned invalid JSON',
          status: 502,
          details: { modelClass: request.modelClass, model },
        });
      }
    } catch (error) {
      if (error instanceof BoardroomError) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : 'Unknown provider error';

      throw new BoardroomError({
        code: 'PROVIDER_FAILURE',
        message: 'Provider request failed',
        status: 502,
        details: {
          modelClass: request.modelClass,
          timeoutMs: request.timeoutMs,
          reason,
        },
      });
    }
  }

  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    if (!this.apiKey) {
      throw new BoardroomError({
        code: 'PROVIDER_FAILURE',
        message: 'OPENAI_API_KEY is not configured',
        status: 500,
      });
    }

    this.client = new OpenAI({ apiKey: this.apiKey });
    return this.client;
  }
}
