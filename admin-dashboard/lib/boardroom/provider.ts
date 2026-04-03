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
  private readonly client: OpenAI;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      throw new BoardroomError({
        code: 'PROVIDER_FAILURE',
        message: 'OPENAI_API_KEY is not configured',
      });
    }

    this.client = new OpenAI({ apiKey });
  }

  async generateJson(request: BoardroomProviderRequest): Promise<unknown> {
    const model = getModelName(request.modelClass);

    try {
      const response = await this.client.responses.create({
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

      throw new BoardroomError({
        code: 'PROVIDER_FAILURE',
        message: 'Provider request failed',
        status: 502,
        details: {
          modelClass: request.modelClass,
          timeoutMs: request.timeoutMs,
        },
      });
    }
  }
}
