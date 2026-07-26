export class TaskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskValidationError';
  }
}

export class TaskPersistenceError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'TaskPersistenceError';
    this.cause = cause;
  }
}

/** A known, already-user-safe condition (e.g. "not supported on this
 *  platform") — distinct from TaskPersistenceError, which wraps an
 *  *unexpected* failure and deliberately discards the raw message. Thrown
 *  by src/storage/database/client.ts; TaskService passes its message
 *  through unwrapped instead of replacing it with a generic one. */
export class TaskUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskUnavailableError';
  }
}

/** Dev-context logging only — the raw error (which may include SQL/internal
 *  detail) must never reach the UI; callers catch our typed errors instead
 *  and show their user-safe `message`. */
export function logError(context: string, error: unknown): void {
  console.error(`[LifeHQ] ${context}:`, error);
}
