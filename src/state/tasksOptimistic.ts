import type { TaskService } from '../services/TaskService';
import type { DisplayTask } from '../types/models';

/** Flips `completed` locally immediately (so the checkbox feels instant),
 *  persists in the background, and restores the previous array + reports a
 *  user-safe error on failure. Takes plain callback params instead of
 *  closing over `useState` setters, so this is testable with plain Jest —
 *  no component rendering required. `TasksContext` calls this from its
 *  `toggleTask` handler, passing its real `setTasks`/`setError`. */
export async function toggleTaskWithRollback(
  tasks: DisplayTask[],
  id: string,
  service: TaskService,
  setTasks: (tasks: DisplayTask[]) => void,
  setError: (error: string | null) => void,
): Promise<void> {
  const target = tasks.find((t) => t.id === id);
  if (!target) return;

  const previous = tasks;
  const next = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  setTasks(next);

  try {
    await service.setCompleted(id, !target.completed);
  } catch (error) {
    setTasks(previous);
    setError(error instanceof Error ? error.message : "Couldn't save your change. Please try again.");
  }
}
