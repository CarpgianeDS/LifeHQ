import { createOperationTracker, toggleTaskWithRollback } from './tasksOptimistic';
import { createConfirmedTaskState } from './confirmedTaskState';
import { createPersistenceQueue } from './persistenceQueue';
import { TaskService } from '../services/TaskService';
import { InMemoryTasksRepository } from '../storage/repositories/InMemoryTasksRepository';
import type { MutationError } from './tasksOptimistic';
import type { DisplayTask, Task } from '../types/models';

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: 't1',
    title: 'Test task',
    module: 'bills',
    priority: 'medium',
    completed: false,
    source: 'manual',
    notes: '',
    needsReview: false,
    dueAt: now,
    createdAt: now,
    updatedAt: now,
    householdId: null,
    createdByMemberId: null,
    updatedByMemberId: null,
    ...overrides,
  };
}

function toDisplay(task: Task): DisplayTask {
  return { ...task, dueBucket: 'today', dueLabel: 'Today' };
}

/** Mirrors TasksContext's ref-backed `updateTasks`: reads/writes a plain
 *  variable synchronously (never a stale render snapshot) and returns the
 *  result, exactly like the real implementation. Every write is recorded
 *  so tests can inspect the full sequence, not just the end state. */
function createTasksContainer(initial: DisplayTask[]) {
  let current = initial;
  const history: DisplayTask[][] = [];
  const updateTasks = (updater: (prev: DisplayTask[]) => DisplayTask[]): DisplayTask[] => {
    current = updater(current);
    history.push(current);
    return current;
  };
  return { getState: () => current, updateTasks, history };
}

function createMutationErrorContainer() {
  let current: MutationError | null = null;
  const history: (MutationError | null)[] = [];
  const updateMutationError = (updater: (prev: MutationError | null) => MutationError | null) => {
    current = updater(current);
    history.push(current);
  };
  return { getState: () => current, updateMutationError, history };
}

/** Mirrors what TasksContext does right after a load: seed confirmed state
 *  directly from whatever the repository returned. */
function seedConfirmed(tasks: DisplayTask[]) {
  const confirmed = createConfirmedTaskState();
  confirmed.resetFrom(tasks);
  return confirmed;
}

/** A promise plus its resolve function, for tests that need to hold a
 *  simulated repository write open until they explicitly release it. */
function gate(): { promise: Promise<void>; release: () => void } {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

describe('toggleTaskWithRollback', () => {
  test('successful toggle: one optimistic write, persisted, no error', async () => {
    const seedTask = makeTask();
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();

    await toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      createOperationTracker(),
      createPersistenceQueue(),
      seedConfirmed([toDisplay(seedTask)]),
      errorContainer.updateMutationError,
    );

    expect(tasksContainer.history).toHaveLength(1);
    expect(tasksContainer.getState()[0].completed).toBe(true);
    expect(errorContainer.getState()).toBeNull();

    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('failing toggle: optimistic write, then rollback to the original confirmed value + a scoped error', async () => {
    const seedTask = makeTask();
    const repository = new InMemoryTasksRepository([seedTask]);
    repository.failWith = new Error('disk full');
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();

    await toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      createOperationTracker(),
      createPersistenceQueue(),
      seedConfirmed([toDisplay(seedTask)]),
      errorContainer.updateMutationError,
    );

    expect(tasksContainer.history[0][0].completed).toBe(true); // optimistic
    expect(tasksContainer.getState()[0].completed).toBe(false); // rolled back
    expect(errorContainer.getState()).toEqual({ taskId: seedTask.id, message: expect.stringContaining("Couldn't save your change") });
  });

  test('no-op when the task id is not found', async () => {
    const repository = new InMemoryTasksRepository();
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([]);
    const errorContainer = createMutationErrorContainer();

    await toggleTaskWithRollback(
      'missing',
      service,
      tasksContainer.updateTasks,
      createOperationTracker(),
      createPersistenceQueue(),
      seedConfirmed([]),
      errorContainer.updateMutationError,
    );

    expect(tasksContainer.history).toHaveLength(1); // the no-op updater still runs once...
    expect(tasksContainer.getState()).toEqual([]); // ...but changes nothing
    expect(errorContainer.getState()).toBeNull();
  });

  test('two toggles fired from the same stale render snapshot still compute different next values', async () => {
    // Simulates the exact bug in finding #1 from the first review round:
    // TasksContext used to call toggleTaskWithRollback(tasks, id, ...) with
    // `tasks` captured from a render closure, so two rapid taps could both
    // read the SAME snapshot and both compute the same "next" completed
    // value. The fixed signature no longer takes a tasks array at all —
    // every read goes through updateTasks, which is backed by a plain
    // variable (a stand-in for TasksContext's ref), not React state.
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    const first = toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      persistence,
      confirmed,
      errorContainer.updateMutationError,
    );
    const second = toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      persistence,
      confirmed,
      errorContainer.updateMutationError,
    );
    await Promise.all([first, second]);

    // false -> true (tap 1) -> false (tap 2): an even number of toggles
    // from false must land back on false, never get stuck showing true
    // because both taps computed the same "next" value.
    expect(tasksContainer.getState()[0].completed).toBe(false);

    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(false);
  });

  test('three rapid same-task toggles (the ABA sequence: false -> true -> false -> true)', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    const toggle = () =>
      toggleTaskWithRollback(
        seedTask.id,
        service,
        tasksContainer.updateTasks,
        operations,
        persistence,
        confirmed,
        errorContainer.updateMutationError,
      );

    await Promise.all([toggle(), toggle(), toggle()]);

    // Three toggles from false: false -> true -> false -> true.
    expect(tasksContainer.getState()[0].completed).toBe(true);
    expect(operations.latest(seedTask.id)).toBe(3);
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('a successful mutation on one task does not clear a different task\'s still-relevant error', async () => {
    const taskA = makeTask({ id: 'a', completed: false });
    const taskB = makeTask({ id: 'b', completed: false });
    const repository = new InMemoryTasksRepository([taskA, taskB]);
    repository.beforeSetCompleted = async (id) => {
      if (id === 'a') throw new Error('disk full'); // A always fails
      // B always succeeds
    };
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(taskA), toDisplay(taskB)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(taskA), toDisplay(taskB)]);

    await toggleTaskWithRollback('a', service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(errorContainer.getState()).toEqual({ taskId: 'a', message: expect.any(String) });

    // B's unrelated, successful mutation must not touch A's error.
    await toggleTaskWithRollback('b', service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    expect(errorContainer.getState()).toEqual({ taskId: 'a', message: expect.any(String) });
    expect(tasksContainer.getState().find((t) => t.id === 'b')!.completed).toBe(true);
  });

  test('starting a new attempt on the SAME task that previously failed clears that task\'s old error', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    repository.failWith = new Error('disk full');
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    await toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(errorContainer.getState()).not.toBeNull();

    // Retry, this time it succeeds.
    repository.failWith = null;
    await toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(errorContainer.getState()).toBeNull();
  });
});

describe('toggleTaskWithRollback — persistence write ordering', () => {
  // These reproduce and guard against the persistence-ordering bug: operation
  // ids alone only protect *rollback* identity, they don't stop two
  // successful writes for the same task from reaching the repository out of
  // invocation order. A slow first write landing *after* a fast second write
  // would silently overwrite it — UI shows the second tap's value, but the
  // database holds the first tap's. Every test below drives
  // InMemoryTasksRepository.beforeSetCompleted to control exactly when each
  // write is allowed to "reach the repository", so write order is directly
  // observable rather than inferred from timing.

  test('an older operation resolving after a newer one still writes to the repository first (invocation order preserved)', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    const callOrder: string[] = [];
    const opOneGate = gate();
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      if (calls === 1) {
        callOrder.push('op1-start');
        await opOneGate.promise; // op1 is deliberately the slow one
        callOrder.push('op1-write');
        return;
      }
      callOrder.push(`op${calls}-write`);
    };

    const opOne = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    // op2 is issued while op1 is still pending — it must queue behind op1,
    // never race ahead of it.
    const opTwo = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(callOrder).toEqual(['op1-start']); // op2's write has not even started yet

    opOneGate.release();
    await Promise.all([opOne, opTwo]);

    expect(callOrder).toEqual(['op1-start', 'op1-write', 'op2-write']);
    expect(tasksContainer.getState()[0].completed).toBe(false); // false -> true -> false
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(false);
  });

  test('two rapid toggles where the first repository call is delayed: the database ends up matching the UI (the originally reported bug)', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    const firstWriteGate = gate();
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      if (calls === 1) await firstWriteGate.promise; // tap 1's write (false -> true) is slow
    };

    const tap1 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(true); // tap 1 optimistic

    const tap2 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(false); // tap 2 optimistic

    // Only now let tap 1's write proceed — it must be forced to apply
    // BEFORE tap 2's write is even attempted, not race in after it.
    firstWriteGate.release();
    await Promise.all([tap1, tap2]);

    expect(tasksContainer.getState()[0].completed).toBe(false); // UI: tap 2's value
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(false); // DB matches UI (previously this landed as `true`)
  });

  test('three rapid toggles whose repository delays would otherwise reverse write order still write in invocation order', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    const callOrder: number[] = [];
    const delaysMs = [20, 10, 0]; // op1 configured slowest, op3 fastest — reversed from invocation order
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      const n = calls;
      callOrder.push(n);
      await new Promise((resolve) => setTimeout(resolve, delaysMs[n - 1]));
    };

    const toggle = () =>
      toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    await Promise.all([toggle(), toggle(), toggle()]);

    // Each write only *starts* once the previous one has fully finished, so
    // the recorded start order is 1, 2, 3 regardless of the configured
    // per-call delays.
    expect(callOrder).toEqual([1, 2, 3]);
    expect(tasksContainer.getState()[0].completed).toBe(true); // false -> true -> false -> true
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('the queue continues after the first operation rejects: a same-task write queued behind it still runs and succeeds', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    const firstGate = gate();
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      if (calls === 1) {
        await firstGate.promise;
        throw new Error('network blip'); // op1's write fails
      }
      // op2 succeeds normally
    };

    const opOne = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(true); // op1 optimistic: false -> true

    // Issued while op1 is still blocked — must queue behind it.
    const opTwo = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(false); // op2 optimistic: true -> false

    firstGate.release();
    await Promise.all([opOne, opTwo]);

    expect(calls).toBe(2); // op2's write actually happened — op1's rejection didn't wedge the queue
    // op1 is stale by the time it rejects (op2 already superseded it), so no
    // rollback fires for it; op2 succeeded, so its value stands.
    expect(tasksContainer.getState()[0].completed).toBe(false);
    expect(errorContainer.getState()).toBeNull();
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(false);
  });

  test('independent task ids write concurrently — a blocked task A does not delay task B', async () => {
    const taskA = makeTask({ id: 'a', completed: false });
    const taskB = makeTask({ id: 'b', completed: false });
    const repository = new InMemoryTasksRepository([taskA, taskB]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(taskA), toDisplay(taskB)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(taskA), toDisplay(taskB)]);

    const gateA = gate();
    repository.beforeSetCompleted = async (id) => {
      if (id === 'a') await gateA.promise; // A's write is blocked indefinitely for now
    };

    const promiseA = toggleTaskWithRollback('a', service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    const promiseB = toggleTaskWithRollback('b', service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    // B must complete WITHOUT us ever releasing A's gate.
    await promiseB;
    expect(tasksContainer.getState().find((t) => t.id === 'b')!.completed).toBe(true);
    const persistedBeforeARelease = await repository.list();
    expect(persistedBeforeARelease.find((t) => t.id === 'b')!.completed).toBe(true);

    gateA.release();
    await promiseA;
    expect(tasksContainer.getState().find((t) => t.id === 'a')!.completed).toBe(true);
    const persistedAfter = await repository.list();
    expect(persistedAfter.find((t) => t.id === 'a')!.completed).toBe(true);
  });

  test('several interleaved same-task toggles with mixed artificial delays: the repository always ends up matching the UI', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]);

    const delaysMs = [20, 0, 15, 5, 0]; // scrambled — no consistent fastest/slowest pattern
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      const n = calls;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[n - 1]));
    };

    const toggle = () =>
      toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    await Promise.all([toggle(), toggle(), toggle(), toggle(), toggle()]);

    const finalUi = tasksContainer.getState()[0].completed;
    expect(finalUi).toBe(true); // 5 toggles from false: ends true
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(finalUi); // DB always agrees with UI, regardless of write timing
    expect(persistence.size()).toBe(0); // the queue entry for this task was cleaned up
  });
});

describe('toggleTaskWithRollback — rollback targets the last confirmed persisted value', () => {
  // These guard against the rollback-consistency bug: `wasCompleted` is
  // only the *previous optimistic* value, which is not necessarily
  // anything the repository ever actually held. Rolling back to it (rather
  // than to the task's last confirmed-persisted value) can leave the UI and
  // the database permanently disagreeing once two same-task writes fail in
  // a row, or once a later failure is chained behind an earlier one that
  // never persisted.

  test('two rapid same-task toggles where both persistence writes fail: UI and repository both return to the original confirmed value', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    repository.beforeSetCompleted = async () => {
      throw new Error('write failed'); // every write fails
    };
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]); // confirmed: false

    const toggle = () =>
      toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    await Promise.all([toggle(), toggle()]);

    expect(tasksContainer.getState()[0].completed).toBe(false); // back to the original confirmed value
    expect(confirmed.get(seedTask.id)).toBe(false); // confirmed never advanced — neither write ever persisted
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(false);
    expect(errorContainer.getState()).toEqual({ taskId: seedTask.id, message: expect.any(String) });
  });

  test('an earlier failed write followed by a latest failed write does not roll back to the never-confirmed optimistic value (the originally reported bug)', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]); // confirmed: false

    const firstGate = gate();
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      if (calls === 1) {
        await firstGate.promise;
        throw new Error('op1 failed'); // stale by the time it rejects — ignored
      }
      throw new Error('op2 failed'); // the latest operation — its rollback is the one that applies
    };

    const op1 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(true); // op1 optimistic: false -> true

    const op2 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(false); // op2 optimistic: true -> false (its `wasCompleted` is `true`, the trap)

    firstGate.release();
    await Promise.all([op1, op2]);

    // Old buggy behaviour rolled op2 back to `wasCompleted` (`true` — op1's
    // never-confirmed optimistic value), leaving the UI at `true` while the
    // database still held `false`. Correct behaviour rolls back to the
    // last actually-confirmed value, which is still `false`.
    expect(tasksContainer.getState()[0].completed).toBe(false);
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(false);
  });

  test('an earlier successful write followed by a latest failed write rolls back to the successful write\'s confirmed value', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      if (calls === 2) throw new Error('op2 failed');
      // op1 (call 1) succeeds
    };
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]); // confirmed: false

    const op1 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    const op2 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);
    await Promise.all([op1, op2]);

    // op1 (false -> true) succeeds, so confirmed becomes true; op2
    // (true -> false) fails and is latest, so it rolls back to the
    // confirmed value (true) — read directly from the tracker here, not
    // inferred from the UI alone.
    expect(confirmed.get(seedTask.id)).toBe(true);
    expect(tasksContainer.getState()[0].completed).toBe(true);
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('three rapid toggles with mixed success/failure outcomes where the final operation fails: rolls back to the last confirmed value, not an intermediate optimistic value', async () => {
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]); // confirmed: false

    // op1 (false -> true) succeeds. op2 (true -> false) fails but is
    // superseded by op3 before its failure is handled, so it's ignored. op3
    // (false -> true) is the latest and also fails — its `wasCompleted` is
    // `false` (op2's never-confirmed optimistic value), which must NOT be
    // what it rolls back to.
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      if (calls === 1) return; // op1 succeeds
      throw new Error(`op${calls} failed`); // op2 and op3 both fail
    };

    const toggle = () =>
      toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    await Promise.all([toggle(), toggle(), toggle()]);

    expect(calls).toBe(3);
    expect(confirmed.get(seedTask.id)).toBe(true); // only op1 ever persisted
    expect(tasksContainer.getState()[0].completed).toBe(true); // matches confirmed, not op2's stale optimistic value
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('confirmed state seeded from a loaded task list is used as the rollback target, even on the very first toggle', async () => {
    // Mirrors what TasksContext does on load: the repository already holds
    // `completed: true` for this task before any toggle ever runs, and
    // confirmed state is seeded from exactly that.
    const seedTask = makeTask({ completed: true });
    const repository = new InMemoryTasksRepository([seedTask]);
    repository.failWith = new Error('disk full');
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();
    const persistence = createPersistenceQueue();
    const confirmed = seedConfirmed([toDisplay(seedTask)]); // seeded: true — no write has ever succeeded in this test

    await toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, confirmed, errorContainer.updateMutationError);

    // Rolls back to the seeded confirmed value (true), proving
    // initialisation-from-load — not just from a prior successful write —
    // is honoured as a valid rollback source.
    expect(tasksContainer.getState()[0].completed).toBe(true);
  });
});

describe('createOperationTracker', () => {
  test('next() issues monotonically increasing ids per task', () => {
    const tracker = createOperationTracker();
    expect(tracker.next('a')).toBe(1);
    expect(tracker.next('a')).toBe(2);
    expect(tracker.next('a')).toBe(3);
  });

  test('counters are independent per task id', () => {
    const tracker = createOperationTracker();
    expect(tracker.next('a')).toBe(1);
    expect(tracker.next('b')).toBe(1);
    expect(tracker.next('a')).toBe(2);
    expect(tracker.next('b')).toBe(2);
  });

  test('latest() reflects the most recently issued id without advancing it', () => {
    const tracker = createOperationTracker();
    expect(tracker.latest('a')).toBe(0); // nothing issued yet
    tracker.next('a');
    tracker.next('a');
    expect(tracker.latest('a')).toBe(2);
    expect(tracker.latest('a')).toBe(2); // reading again doesn't change it
  });
});
