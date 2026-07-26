import { generateId } from '../id';
import type { NewTaskInput, Task, UpdateTaskInput } from '../../types/models';
import type { TasksRepository } from './TasksRepository';

/** Test-only implementation of `TasksRepository` — proves the SQLite
 *  implementation is swappable without touching any screen, and lets
 *  TaskService be unit tested without a real database. */
export class InMemoryTasksRepository implements TasksRepository {
  private tasks: Task[] = [];
  /** When set, every method rejects with this error instead of succeeding —
   *  used to test failure handling (e.g. optimistic rollback). */
  failWith: Error | null = null;

  constructor(initial: Task[] = []) {
    this.tasks = [...initial];
  }

  async list(): Promise<Task[]> {
    this.throwIfFailing();
    return [...this.tasks];
  }

  async create(input: NewTaskInput): Promise<Task> {
    this.throwIfFailing();
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId('task'),
      title: input.title,
      module: input.module,
      priority: input.priority,
      dueAt: input.dueAt,
      completed: false,
      source: input.source,
      notes: input.notes,
      needsReview: input.needsReview,
      createdAt: now,
      updatedAt: now,
      householdId: null,
      createdByMemberId: null,
      updatedByMemberId: null,
    };
    this.tasks = [task, ...this.tasks];
    return task;
  }

  async update(id: string, patch: UpdateTaskInput): Promise<Task> {
    this.throwIfFailing();
    const existing = this.getByIdOrThrow(id);
    const updated: Task = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async setCompleted(id: string, completed: boolean): Promise<Task> {
    this.throwIfFailing();
    const existing = this.getByIdOrThrow(id);
    const updated: Task = { ...existing, completed, updatedAt: new Date().toISOString() };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  private getByIdOrThrow(id: string): Task {
    const found = this.tasks.find((t) => t.id === id);
    if (!found) throw new Error(`Task not found: ${id}`);
    return found;
  }

  private throwIfFailing(): void {
    if (this.failWith) throw this.failWith;
  }
}
