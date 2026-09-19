import { computeDueBucket, computeDueLabel } from '../data/dueDate';
import { logError, TaskPersistenceError, TaskUnavailableError, TaskValidationError } from './errors';
import type { TasksRepository } from '../storage/repositories/TasksRepository';
import type { DisplayTask, NewTaskInput, Task, UpdateTaskInput } from '../types/models';

// Deliberately no import of SQLiteTasksRepository or expo-sqlite here — this
// class only depends on the TasksRepository interface, so it (and its
// tests) never touch the native SQLite module. See taskServiceInstance.ts
// for where the concrete repository is wired in.

function toDisplay(task: Task, now: Date = new Date()): DisplayTask {
  return {
    ...task,
    dueBucket: computeDueBucket(task.dueAt, now),
    dueLabel: computeDueLabel(task.dueAt, now),
  };
}

function assertValidTitle(title: string): void {
  if (!title.trim()) {
    throw new TaskValidationError('Task title cannot be empty.');
  }
}

function assertValidDueAt(dueAt: string | null): void {
  // Explicitly clearing the due date (null) is valid — Task.dueAt is
  // nullable by design. Only a present-but-unparseable string is rejected.
  if (dueAt === null) return;
  if (Number.isNaN(new Date(dueAt).getTime())) {
    throw new TaskValidationError('Task due date is not a valid date.');
  }
}

function assertValidNewTask(input: NewTaskInput): void {
  assertValidTitle(input.title);
  assertValidDueAt(input.dueAt);
}

function normalizeNewTask(input: NewTaskInput): NewTaskInput {
  return { ...input, title: input.title.trim() };
}

/** Same rules as a new task, but only applied to whichever fields the patch
 *  actually touches — a patch that only changes `notes`, say, shouldn't be
 *  required to carry a valid title or due date it never set out to change. */
function assertValidUpdate(patch: UpdateTaskInput): void {
  if (patch.title !== undefined) assertValidTitle(patch.title);
  if (patch.dueAt !== undefined) assertValidDueAt(patch.dueAt);
}

function normalizeUpdate(patch: UpdateTaskInput): UpdateTaskInput {
  return patch.title !== undefined ? { ...patch, title: patch.title.trim() } : patch;
}

/** TaskUnavailableError is already a known, user-safe condition (e.g. "not
 *  supported on web") — pass it through as-is. Anything else is an
 *  unexpected repository failure: log the raw detail for developers, throw
 *  a generic user-safe message so screens never see SQL/internal text. */
function handleRepositoryError(context: string, error: unknown, fallbackMessage: string): never {
  logError(context, error);
  if (error instanceof TaskUnavailableError) throw error;
  throw new TaskPersistenceError(fallbackMessage, error);
}

/** Coordinates task operations: validates input, calls the repository,
 *  derives display fields (overdue/today/upcoming, due labels), and
 *  converts repository failures into a typed, user-safe error. Screens
 *  never see raw SQL or repository exceptions. */
export class TaskService {
  constructor(private readonly repository: TasksRepository) {}

  async list(): Promise<DisplayTask[]> {
    try {
      const tasks = await this.repository.list();
      const now = new Date();
      return tasks.map((t) => toDisplay(t, now));
    } catch (error) {
      handleRepositoryError('TaskService.list failed', error, "Couldn't load tasks. Please try again.");
    }
  }

  async create(input: NewTaskInput): Promise<DisplayTask> {
    assertValidNewTask(input);
    try {
      const task = await this.repository.create(normalizeNewTask(input));
      return toDisplay(task);
    } catch (error) {
      handleRepositoryError('TaskService.create failed', error, "Couldn't save the new task. Please try again.");
    }
  }

  async update(id: string, patch: UpdateTaskInput): Promise<DisplayTask> {
    assertValidUpdate(patch);
    try {
      const task = await this.repository.update(id, normalizeUpdate(patch));
      return toDisplay(task);
    } catch (error) {
      handleRepositoryError('TaskService.update failed', error, "Couldn't update the task. Please try again.");
    }
  }

  async setCompleted(id: string, completed: boolean): Promise<DisplayTask> {
    try {
      const task = await this.repository.setCompleted(id, completed);
      return toDisplay(task);
    } catch (error) {
      handleRepositoryError('TaskService.setCompleted failed', error, "Couldn't save your change. Please try again.");
    }
  }
}
