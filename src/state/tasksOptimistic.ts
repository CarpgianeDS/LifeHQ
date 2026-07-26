import type { TaskService } from '../services/TaskService';
import type { ConfirmedTaskState } from './confirmedTaskState';
import type { PersistenceQueue } from './persistenceQueue';
import type { DisplayTask } from '../types/models';

export interface MutationError {
  /** The task a toggle/update error belongs to, or a reserved sentinel
   *  (see `NEW_TASK_ERROR_KEY` in TasksContext) for a creation error. Used
   *  to scope error-clearing to "this same thing", so one task's success
   *  never clears a different task's still-relevant error. */
  taskId: string;
  message: string;
}

/** Reads/writes tasks synchronously against a ref-backed store — NOT the
 *  `tasks` array captured by a component's render closure. React state
 *  setters don't guarantee their updater runs before the next line of code
 *  executes, so two rapid calls in the same tick could otherwise both read
 *  the same stale snapshot and compute the same "next" value. Returns the
 *  resulting array so callers can synchronously read what they just wrote
 *  (e.g. to find the task they just touched). See TasksContext's
 *  `updateTasks` for the concrete ref-backed implementation. */
export type UpdateTasks = (updater: (prev: DisplayTask[]) => DisplayTask[]) => DisplayTask[];

export type UpdateMutationError = (updater: (prev: MutationError | null) => MutationError | null) => void;

/** Issues a monotonically increasing "operation id" per task id. This is
 *  the rollback identity — NOT the completed boolean, which has an ABA
 *  problem: false -> true -> false -> true means a stale failure can see
 *  the same boolean value again and wrongly roll back a newer, already-
 *  confirmed operation. An operation id never repeats, so "is this failure
 *  still for the latest attempt on this task?" is unambiguous. */
export interface OperationTracker {
  next: (taskId: string) => number;
  latest: (taskId: string) => number;
}

export function createOperationTracker(): OperationTracker {
  const counters = new Map<string, number>();
  return {
    next: (taskId) => {
      const n = (counters.get(taskId) ?? 0) + 1;
      counters.set(taskId, n);
      return n;
    },
    latest: (taskId) => counters.get(taskId) ?? 0,
  };
}

/** Flips a task's `completed` locally immediately (so the checkbox feels
 *  instant), persists in the background, and — on failure — reverts *only
 *  this task*, and *only if this operation is still the newest one issued
 *  for it*. Both the read-current-value step and the optimistic apply
 *  happen inside a single synchronous `updateTasks` call, so a second rapid
 *  tap always sees the first tap's already-applied value, never a stale
 *  render snapshot.
 *
 *  The actual repository write is routed through `persistence`, keyed by
 *  task id: operation ids alone only protect *rollback* identity, they
 *  don't stop two successful writes for the same task from reaching the
 *  repository out of invocation order (a slow first write landing *after*
 *  a fast second one would silently overwrite it). Queuing per task id
 *  guarantees writes for that task are applied in the order they were
 *  issued, while different tasks' writes stay fully independent. See
 *  persistenceQueue.ts.
 *
 *  On failure, rollback targets `confirmed.get(id)` — the last value this
 *  task actually persisted — never the optimistic value that was showing a
 *  moment before this operation ran. That "previous optimistic value" can
 *  itself belong to an operation that never persisted (e.g. it also later
 *  fails), in which case rolling back to it would leave the UI showing
 *  something the database never held. See confirmedTaskState.ts. */
export async function toggleTaskWithRollback(
  id: string,
  service: TaskService,
  updateTasks: UpdateTasks,
  operations: OperationTracker,
  persistence: PersistenceQueue,
  confirmed: ConfirmedTaskState,
  updateMutationError: UpdateMutationError,
): Promise<void> {
  const operationId = operations.next(id);

  // A fresh attempt on this task supersedes any error currently shown for
  // it — but must never touch an error belonging to a different task.
  updateMutationError((prev) => (prev && prev.taskId === id ? null : prev));

  let wasCompleted: boolean | undefined;
  let nextCompleted: boolean | undefined;

  updateTasks((prev) => {
    const target = prev.find((t) => t.id === id);
    if (!target) return prev; // task no longer exists — no-op
    wasCompleted = target.completed;
    nextCompleted = !target.completed;
    return prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted! } : t));
  });

  if (nextCompleted === undefined) return; // task wasn't found; nothing to persist
  const completedValue = nextCompleted; // stable capture for the queued closure below

  try {
    await persistence.enqueue(id, () => service.setCompleted(id, completedValue));
    // This write actually persisted — it's now the task's confirmed value.
    // Never done during the optimistic apply above, only here.
    confirmed.set(id, completedValue);
  } catch (error) {
    // Stale/superseded: a newer attempt on this same task has already
    // started (or finished) since this one began. Ignore this failure
    // entirely — rolling back now would clobber whatever that newer
    // attempt has since done, regardless of what boolean value is
    // currently showing.
    if (operations.latest(id) !== operationId) return;

    // Fall back to wasCompleted only if this task somehow has no confirmed
    // entry yet (it always should by the time a toggle can target it —
    // see TasksContext seeding confirmed state on load/create).
    const rollbackValue = confirmed.get(id) ?? wasCompleted!;

    updateTasks((prev) => {
      const current = prev.find((t) => t.id === id);
      // Defensive: only revert if the task still shows exactly what this
      // operation set it to (it should, since we just confirmed this is
      // still the latest operation — but never overwrite anything else).
      if (!current || current.completed !== completedValue) return prev;
      return prev.map((t) => (t.id === id ? { ...t, completed: rollbackValue } : t));
    });
    updateMutationError(() => ({
      taskId: id,
      message: error instanceof Error ? error.message : "Couldn't save your change. Please try again.",
    }));
  }
}
