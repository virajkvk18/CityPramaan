export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'REQUEST_FAILED'
  ) {
    super(message);
  }
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof Error) return new HttpError(500, error.message, 'SERVER_ERROR');
  return new HttpError(500, 'Server error', 'SERVER_ERROR');
}
