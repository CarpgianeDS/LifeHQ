/** Tracks the last `completed` value actually confirmed persisted to the
 *  repository for each task — as opposed to whatever value is currently
 *  showing optimistically in the UI.
 *
 *  toggleTaskWithRollback needs this because the UI's *previous* value isn't
 *  always safe to roll back to: if task X gets two rapid writes and the
 *  first one (which the second one's optimistic flip was based on) never
 *  actually persisted, rolling back to "whatever the UI showed a moment
 *  ago" can land on a value the database never held, permanently
 *  disagreeing with it until the next successful write. Rolling back to the
 *  last *confirmed* value instead is always safe, regardless of how many
 *  optimistic flips happened in between. */
export interface ConfirmedTaskState {
  get(taskId: string): boolean | undefined;
  /** Called only after a write has actually persisted — never during an
   *  optimistic UI update. */
  set(taskId: string, completed: boolean): void;
  /** Replaces the entire tracked set. Used whenever the task list is
   *  (re)loaded from the repository, so a task removed since the last load
   *  doesn't leave behind a stale entry, and every currently-known task's
   *  confirmed value reflects exactly what was just read from the
   *  repository. */
  resetFrom(tasks: readonly { id: string; completed: boolean }[]): void;
  size(): number;
}

export function createConfirmedTaskState(): ConfirmedTaskState {
  const confirmed = new Map<string, boolean>();

  return {
    get: (taskId) => confirmed.get(taskId),
    set: (taskId, completed) => {
      confirmed.set(taskId, completed);
    },
    resetFrom: (tasks) => {
      confirmed.clear();
      for (const task of tasks) confirmed.set(task.id, task.completed);
    },
    size: () => confirmed.size,
  };
}
