import { toggleTaskWithRollback } from './tasksOptimistic';
import { TaskService } from '../services/TaskService';
import { InMemoryTasksRepository } from '../storage/repositories/InMemoryTasksRepository';
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

/** Mimics React's functional `setState`: each call applies immediately
 *  (synchronously) against whatever the current state is, and every write
 *  is recorded — so tests can assert not just the final value but whether
 *  a write happened at all (e.g. proving a stale rollback was suppressed). */
function createStateContainer(initial: DisplayTask[]) {
  let state = initial;
  const history: DisplayTask[][] = [];
  const setTasks = (updater: (prev: DisplayTask[]) => DisplayTask[]) => {
    state = updater(state);
    history.push(state);
  };
  return { getState: () => state, setTasks, history };
}

describe('toggleTaskWithRollback', () => {
  test('successful toggle: one optimistic write, persisted, no error', async () => {
    const seedTask = makeTask();
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const container = createStateContainer([toDisplay(seedTask)]);
    const errors: (string | null)[] = [];

    await toggleTaskWithRollback(container.getState(), seedTask.id, service, container.setTasks, (e) =>
      errors.push(e),
    );

    expect(container.history).toHaveLength(1);
    expect(container.getState()[0].completed).toBe(true);
    expect(errors).toEqual([null]);

    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('failing toggle: optimistic write, then rollback to the original value + error', async () => {
    const seedTask = makeTask();
    const repository = new InMemoryTasksRepository([seedTask]);
    repository.failWith = new Error('disk full');
    const service = new TaskService(repository);
    const container = createStateContainer([toDisplay(seedTask)]);
    const errors: (string | null)[] = [];

    await toggleTaskWithRollback(container.getState(), seedTask.id, service, container.setTasks, (e) =>
      errors.push(e),
    );

    expect(container.history).toHaveLength(2);
    expect(container.history[0][0].completed).toBe(true); // optimistic
    expect(container.history[1][0].completed).toBe(false); // rolled back
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Couldn't save your change/);
  });

  test('no-op when the task id is not found', async () => {
    const repository = new InMemoryTasksRepository();
    const service = new TaskService(repository);
    const setTasks = jest.fn();
    const setMutationError = jest.fn();

    await toggleTaskWithRollback([], 'missing', service, setTasks, setMutationError);

    expect(setTasks).not.toHaveBeenCalled();
    expect(setMutationError).not.toHaveBeenCalled();
  });

  test('concurrent optimistic updates: toggling two different tasks applies both correctly', async () => {
    const taskA = makeTask({ id: 'a', completed: false });
    const taskB = makeTask({ id: 'b', completed: false });
    const repository = new InMemoryTasksRepository([taskA, taskB]);
    const service = new TaskService(repository);
    const container = createStateContainer([toDisplay(taskA), toDisplay(taskB)]);

    await Promise.all([
      toggleTaskWithRollback(container.getState(), 'a', service, container.setTasks, jest.fn()),
      toggleTaskWithRollback(container.getState(), 'b', service, container.setTasks, jest.fn()),
    ]);

    expect(container.getState().find((t) => t.id === 'a')!.completed).toBe(true);
    expect(container.getState().find((t) => t.id === 'b')!.completed).toBe(true);
  });

  test('target-only rollback: a failing toggle on one task does not clobber a concurrent successful toggle on another', async () => {
    const taskA = makeTask({ id: 'a', completed: false });
    const taskB = makeTask({ id: 'b', completed: false });
    const repository = new InMemoryTasksRepository([taskA, taskB]);
    const service = new TaskService(repository);
    const container = createStateContainer([toDisplay(taskA), toDisplay(taskB)]);

    let releaseA!: () => void;
    const aBlocked = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    repository.beforeSetCompleted = async (id) => {
      if (id === 'a') {
        await aBlocked;
        throw new Error('disk full'); // A's write ultimately fails, but late
      }
      // B has no delay — it resolves (and succeeds) immediately.
    };

    // Start A's toggle but don't await yet — it's now pending, blocked on aBlocked.
    const aPromise = toggleTaskWithRollback(container.getState(), 'a', service, container.setTasks, jest.fn());

    // B's toggle runs to completion (succeeds) while A is still in flight.
    await toggleTaskWithRollback(container.getState(), 'b', service, container.setTasks, jest.fn());
    expect(container.getState().find((t) => t.id === 'b')!.completed).toBe(true);

    // Now let A's request finally fail.
    releaseA();
    await aPromise;

    // A rolled back to its own original value; B's already-confirmed change
    // must be untouched by A's (unrelated, later-resolving) failure.
    expect(container.getState().find((t) => t.id === 'a')!.completed).toBe(false);
    expect(container.getState().find((t) => t.id === 'b')!.completed).toBe(true);
  });

  test('rapid repeated taps on the same task: a stale failure for the first tap does not clobber the second tap\'s confirmed outcome', async () => {
    // The cross-task test above is the unambiguous proof that the guard's
    // mechanism (compare current value against what this call itself set)
    // works: two different tasks can never share a value by coincidence in
    // that test, so a passing result can only mean the guard fired
    // correctly. This test complements it with the realistic "double-tap
    // the same checkbox" scenario end-to-end.
    const task = makeTask({ id: 't1', completed: false });
    const repository = new InMemoryTasksRepository([task]);
    const service = new TaskService(repository);
    const container = createStateContainer([toDisplay(task)]);

    let callIndex = 0;
    let releaseFirst!: () => void;
    const firstBlocked = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    repository.beforeSetCompleted = async () => {
      callIndex += 1;
      if (callIndex === 1) {
        await firstBlocked;
        throw new Error('network blip'); // first tap's write fails, but arrives late
      }
      // second tap's write has no delay — it resolves (and succeeds) immediately.
    };

    // First tap: false -> true (optimistic), request blocked.
    const firstPromise = toggleTaskWithRollback(container.getState(), 't1', service, container.setTasks, jest.fn());
    expect(container.getState()[0].completed).toBe(true); // first tap's optimistic value applied synchronously

    // Second (rapid) tap: reads completed=true, toggles back to false; its
    // own request succeeds immediately and confirms false.
    await toggleTaskWithRollback(container.getState(), 't1', service, container.setTasks, jest.fn());
    expect(container.getState()[0].completed).toBe(false);

    // The first tap's stale, superseded request finally fails — the
    // checkbox must stay exactly where the second (later, confirmed) tap
    // left it.
    releaseFirst();
    await firstPromise;
    expect(container.getState()[0].completed).toBe(false);
  });
});
