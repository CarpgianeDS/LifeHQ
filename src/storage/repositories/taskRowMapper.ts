import type { CategoryKey, PriorityKey, Task, TaskSource } from '../../types/models';

/** Raw shape of a `tasks` row — snake_case, booleans as 0/1, matching the
 *  schema in src/storage/database/migrations.ts.
 *
 *  Deliberately has zero import of `expo-sqlite`: that native module can't
 *  be resolved under Jest in this project (confirmed — importing it, even
 *  transitively, fails module resolution in the test environment), so the
 *  row↔domain mapping lives here, separate from SQLiteTasksRepository.ts,
 *  specifically so it stays unit-testable. */
export interface TaskRow {
  id: string;
  title: string;
  module: string;
  priority: string;
  completed: number;
  source: string;
  notes: string;
  needs_review: number;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  household_id: string | null;
  created_by_member_id: string | null;
  updated_by_member_id: string | null;
}

export function mapRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    module: row.module as CategoryKey,
    priority: row.priority as PriorityKey,
    completed: row.completed === 1,
    source: row.source as TaskSource,
    notes: row.notes,
    needsReview: row.needs_review === 1,
    dueAt: row.due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    householdId: row.household_id,
    createdByMemberId: row.created_by_member_id,
    updatedByMemberId: row.updated_by_member_id,
  };
}

/** Inverse of `mapRowToTask`. */
export function mapTaskToRow(task: Task): TaskRow {
  return {
    id: task.id,
    title: task.title,
    module: task.module,
    priority: task.priority,
    completed: task.completed ? 1 : 0,
    source: task.source,
    notes: task.notes,
    needs_review: task.needsReview ? 1 : 0,
    due_at: task.dueAt,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    household_id: task.householdId,
    created_by_member_id: task.createdByMemberId,
    updated_by_member_id: task.updatedByMemberId,
  };
}
