import { createOperationTracker, toggleTaskWithRollback } from './tasksOptimistic';
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
      errorContainer.updateMutationError,
    );

    expect(tasksContainer.history).toHaveLength(1); // the no-op updater still runs once...
    expect(tasksContainer.getState()).toEqual([]); // ...but changes nothing
    expect(errorContainer.getState()).toBeNull();
  });

  test('two toggles fired from the same stale render snapshot still compute different next values', async () => {
    // Simulates the exact bug in finding #1: TasksContext used to call
    // toggleTaskWithRollback(tasks, id, ...) with `tasks` captured from a
    // render closure, so two rapid taps could both read the SAME snapshot
    // and both compute the same "next" completed value. The fixed
    // signature no longer takes a tasks array at all — every read goes
    // through updateTasks, which is backed by a plain variable (a stand-in
    // for TasksContext's ref), not React state. Calling the function twice
    // without awaiting in between must therefore still see the first
    // call's effect.
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();

    // Fire both taps back-to-back with no await between them — the
    // "fast second tap" scenario from the finding.
    const first = toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      errorContainer.updateMutationError,
    );
    const second = toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
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

    const toggle = () =>
      toggleTaskWithRollback(
        seedTask.id,
        service,
        tasksContainer.updateTasks,
        operations,
        errorContainer.updateMutationError,
      );

    await Promise.all([toggle(), toggle(), toggle()]);

    // Three toggles from false: false -> true -> false -> true.
    expect(tasksContainer.getState()[0].completed).toBe(true);
    expect(operations.latest(seedTask.id)).toBe(3);
    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('an older failed operation resolving after a newer successful one does not roll back the newer result (ABA-safe via operation id, not boolean value)', async () => {
    // Constructed so the naive boolean-value compare-and-swap from the
    // previous round would get this WRONG: operation 1 goes false->true and
    // fails late; operation 2 (true->false) and operation 3 (false->true)
    // both resolve first and succeed, leaving the confirmed value at
    // `true` — the exact same boolean operation 1 originally set. A value-
    // based guard would see "current (true) === my nextCompleted (true)"
    // and incorrectly roll back to `false`. The operation-id guard must
    // recognise operation 1 is no longer the latest (operation 3 is) and
    // skip the rollback entirely.
    const seedTask = makeTask({ completed: false });
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasksContainer = createTasksContainer([toDisplay(seedTask)]);
    const errorContainer = createMutationErrorContainer();
    const operations = createOperationTracker();

    let releaseFirst!: () => void;
    const firstBlocked = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let callIndex = 0;
    repository.beforeSetCompleted = async () => {
      callIndex += 1;
      if (callIndex === 1) {
        await firstBlocked;
        throw new Error('network blip'); // operation 1's write fails, but arrives last
      }
      // operations 2 and 3 resolve immediately and succeed.
    };

    const firstPromise = toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      errorContainer.updateMutationError,
    );
    expect(tasksContainer.getState()[0].completed).toBe(true); // op1 optimistic

    await toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      errorContainer.updateMutationError,
    ); // op2: true -> false, succeeds
    await toggleTaskWithRollback(
      seedTask.id,
      service,
      tasksContainer.updateTasks,
      operations,
      errorContainer.updateMutationError,
    ); // op3: false -> true, succeeds
    expect(tasksContainer.getState()[0].completed).toBe(true);

    releaseFirst();
    await firstPromise;

    // op1's stale failure must be a complete no-op: value stays `true`
    // (op3's confirmed result) and no error is set for it.
    expect(tasksContainer.getState()[0].completed).toBe(true);
    expect(errorContainer.getState()).toBeNull();
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

    await toggleTaskWithRollback('a', service, tasksContainer.updateTasks, operations, errorContainer.updateMutationError);
    expect(errorContainer.getState()).toEqual({ taskId: 'a', message: expect.any(String) });

    // B's unrelated, successful mutation must not touch A's error.
    await toggleTaskWithRollback('b', service, tasksContainer.updateTasks, operations, errorContainer.updateMutationError);

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

    await toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, errorContainer.updateMutationError);
    expect(errorContainer.getState()).not.toBeNull();

    // Retry, this time it succeeds.
    repository.failWith = null;
    await toggleTaskWithRollback(seedTask.id, service, tasksContainer.updateTasks, operations, errorContainer.updateMutationError);
    expect(errorContainer.getState()).toBeNull();
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
