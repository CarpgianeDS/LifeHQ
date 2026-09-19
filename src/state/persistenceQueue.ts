/** Serialises async work per key, in the order `enqueue` was called, while
 *  different keys run fully independently of each other.
 *
 *  This exists because operation ids (see tasksOptimistic.ts) only protect
 *  *rollback identity* — they say "ignore this failure, a newer attempt has
 *  already superseded it." They do nothing to stop two *successful* writes
 *  for the same task from reaching the repository out of order: if tap 1's
 *  write is slow and tap 2's is fast, tap 2 could persist first and tap 1
 *  could then land second and silently overwrite it, leaving the database
 *  holding tap 1's value while the UI (correctly) shows tap 2's. Routing
 *  every write for a given task id through the same queue key makes that
 *  impossible — a task's Nth write is never even attempted until its
 *  (N-1)th has fully settled, so writes always land in invocation order. */
export interface PersistenceQueue {
  /** Runs `task` once every previously enqueued task for this same `key`
   *  has settled — whether that previous task resolved or rejected. The
   *  returned promise reflects only *this* task's own outcome; a previous
   *  task's rejection never propagates into it, so one failed write can't
   *  permanently wedge the rest of that key's queue. */
  enqueue<T>(key: string, task: () => Promise<T>): Promise<T>;
  /** Number of keys with in-flight or queued work. Exists so cleanup — a
   *  key's entry is dropped once its chain fully drains, rather than being
   *  retained forever — is directly testable. */
  size(): number;
}

export function createPersistenceQueue(): PersistenceQueue {
  const tails = new Map<string, Promise<unknown>>();

  function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    // Run `task` after `previous` settles either way — a rejection from a
    // prior entry must not stop this one from running, and this call's
    // returned promise must reflect `task`'s own outcome, not `previous`'s.
    const run = previous.then(task, task);
    tails.set(key, run);

    // Once `run` settles, drop this key's entry — but only if nothing newer
    // has been enqueued for it since (in which case that newer entry is
    // already the tail, and this cleanup must leave it alone).
    const forget = () => {
      if (tails.get(key) === run) tails.delete(key);
    };
    run.then(forget, forget);

    return run;
  }

  return { enqueue, size: () => tails.size };
}
