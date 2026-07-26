import type { TaskService } from '../services/TaskService';
import type { DisplayTask } from '../types/models';

type SetTasks = (updater: (prev: DisplayTask[]) => DisplayTask[]) => void;
type SetMutationError = (error: string | null) => void;

/** Flips `completed` locally immediately (so the checkbox feels instant),
 *  persists in the background, and — on failure — reverts *only this
 *  task's* completed flag, and *only if it's still the value this call
 *  set*.
 *
 *  Both the apply and the rollback use the functional `setState` form
 *  (`prev => ...`) rather than a captured whole-array snapshot, so a
 *  rollback can never clobber a change some other concurrent call made in
 *  the meantime — whether that's a second toggle on the same task (rapid
 *  repeated taps) or a toggle on a different task. Takes plain callback
 *  params instead of closing over `useState` setters, so this is testable
 *  with plain Jest — no component rendering required. `TasksContext` calls
 *  this from its `toggleTask` handler, passing its real `setTasks` (the
 *  raw `Dispatch<SetStateAction<...>>`, which already supports this
 *  updater form) and `setMutationError`. */
export async function toggleTaskWithRollback(
  tasks: DisplayTask[],
  id: string,
  service: TaskService,
  setTasks: SetTasks,
  setMutationError: SetMutationError,
): Promise<void> {
  const target = tasks.find((t) => t.id === id);
  if (!target) return;

  const wasCompleted = target.completed;
  const nextCompleted = !wasCompleted;

  setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));

  try {
    await service.setCompleted(id, nextCompleted);
    setMutationError(null);
  } catch (error) {
    // Compare-and-swap: only undo this call's own optimistic write, and
    // only while it's still the value showing. If a later toggle (or any
    // other update) has since changed this task, leave it alone — this
    // failure is stale and must not stomp on newer state.
    setTasks((prev) =>
      prev.map((t) => (t.id === id && t.completed === nextCompleted ? { ...t, completed: wasCompleted } : t)),
    );
    setMutationError(error instanceof Error ? error.message : "Couldn't save your change. Please try again.");
  }
}
