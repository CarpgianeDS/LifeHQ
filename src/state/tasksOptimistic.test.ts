import { createOperationTracker, toggleTaskWithRollback } from './tasksOptimistic';
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
      errorContainer.updateMutationError,
    );

    expect(tasksContainer.history).toHaveLength(1);
    expect(tasksContainer.getState()[0].completed).toBe(true);
    expect(errorContainer.getState()).toBeNull();

    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('failing toggle: optimistic write, then rollback to the original value + a scoped error', async () => {
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

    const first = toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      persistence,
      errorContainer.updateMutationError,
    );
    const second = toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      persistence,
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

    const toggle = () =>
      toggleTaskWithRollback(
        seedTask.id,
        service,
        tasksContainer.updateTasks,
        operations,
        persistence,
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

    await toggleTaskWithRollback('a', service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
    expect(errorContainer.getState()).toEqual({ taskId: 'a', message: expect.any(String) });

    // B's unrelated, successful mutation must not touch A's error.
    await toggleTaskWithRollback('b', service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);

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

    await toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
    expect(errorContainer.getState()).not.toBeNull();

    // Retry, this time it succeeds.
    repository.failWith = null;
    await toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
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

    const opOne = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
    // op2 is issued while op1 is still pending — it must queue behind op1,
    // never race ahead of it.
    const opTwo = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);

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

    const firstWriteGate = gate();
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      if (calls === 1) await firstWriteGate.promise; // tap 1's write (false -> true) is slow
    };

    const tap1 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(true); // tap 1 optimistic

    const tap2 = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
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
      toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);

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

    const opOne = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
    expect(tasksContainer.getState()[0].completed).toBe(true); // op1 optimistic: false -> true

    // Issued while op1 is still blocked — must queue behind it.
    const opTwo = toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
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

    const gateA = gate();
    repository.beforeSetCompleted = async (id) => {
      if (id === 'a') await gateA.promise; // A's write is blocked indefinitely for now
    };

    const promiseA = toggleTaskWithRollback('a', service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);
    const promiseB = toggleTaskWithRollback('b', service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);

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

    const delaysMs = [20, 0, 15, 5, 0]; // scrambled — no consistent fastest/slowest pattern
    let calls = 0;
    repository.beforeSetCompleted = async () => {
      calls += 1;
      const n = calls;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[n - 1]));
    };

    const toggle = () =>
      toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, persistence, errorContainer.updateMutationError);

    await Promise.all([toggle(), toggle(), toggle(), toggle(), toggle()]);

    const finalUi = tasksContainer.getState()[0].completed;
    expect(finalUi).toBe(true); // 5 toggles from false: ends true
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(finalUi); // DB always agrees with UI, regardless of write timing
    expect(persistence.size()).toBe(0); // the queue entry for this task was cleaned up
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
