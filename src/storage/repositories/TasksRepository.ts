import type { NewTaskInput, Task, UpdateTaskInput } from '../../types/models';

/** The contract the rest of the app depends on — not on SQLite directly.
 *  Returns the canonical `Task` (no `dueLabel`/`dueBucket`; deriving those
 *  is the service layer's job, not the repository's). */
export interface TasksRepository {
  list(): Promise<Task[]>;
  create(input: NewTaskInput): Promise<Task>;
  update(id: string, patch: UpdateTaskInput): Promise<Task>;
  setCompleted(id: string, completed: boolean): Promise<Task>;
}
