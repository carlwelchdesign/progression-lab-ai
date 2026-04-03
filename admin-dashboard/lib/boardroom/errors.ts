export type BoardroomErrorCode =
  | 'INVALID_INPUT'
  | 'MODEL_OUTPUT_INVALID'
  | 'ORCHESTRATION_TIMEOUT'
  | 'RETRIES_EXHAUSTED'
  | 'PROVIDER_FAILURE';

export class BoardroomError extends Error {
  public readonly code: BoardroomErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(params: {
    code: BoardroomErrorCode;
    message: string;
    status?: number;
    details?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = 'BoardroomError';
    this.code = params.code;
    this.status = params.status ?? 500;
    this.details = params.details;
  }
}

export function toBoardroomError(error: unknown): BoardroomError {
  if (error instanceof BoardroomError) {
    return error;
  }

  return new BoardroomError({
    code: 'PROVIDER_FAILURE',
    message: 'Boardroom execution failed unexpectedly',
    status: 500,
  });
}

export function createInvalidInputError(
  message: string,
  details?: Record<string, unknown>,
): BoardroomError {
  return new BoardroomError({
    code: 'INVALID_INPUT',
    message,
    status: 400,
    details,
  });
}

export function createModelOutputInvalidError(
  message: string,
  details?: Record<string, unknown>,
): BoardroomError {
  return new BoardroomError({
    code: 'MODEL_OUTPUT_INVALID',
    message,
    status: 502,
    details,
  });
}
