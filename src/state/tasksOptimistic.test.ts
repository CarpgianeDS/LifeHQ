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

describe('toggleTaskWithRollback', () => {
  test('successful toggle: one optimistic setTasks call, persisted, no error', async () => {
    const seedTask = makeTask();
    const repository = new InMemoryTasksRepository([seedTask]);
    const service = new TaskService(repository);
    const tasks = [toDisplay(seedTask)];

    const setTasksCalls: DisplayTask[][] = [];
    const errors: (string | null)[] = [];

    await toggleTaskWithRollback(
      tasks,
      seedTask.id,
      service,
      (t) => setTasksCalls.push(t),
      (e) => errors.push(e),
    );

    expect(setTasksCalls).toHaveLength(1);
    expect(setTasksCalls[0][0].completed).toBe(true);
    expect(errors).toHaveLength(0);

    const persisted = await repository.list();
    expect(persisted[0].completed).toBe(true);
  });

  test('failing toggle: optimistic update, then rollback to the original array + error', async () => {
    const seedTask = makeTask();
    const repository = new InMemoryTasksRepository([seedTask]);
    repository.failWith = new Error('disk full');
    const service = new TaskService(repository);
    const tasks = [toDisplay(seedTask)];

    const setTasksCalls: DisplayTask[][] = [];
    const errors: (string | null)[] = [];

    await toggleTaskWithRollback(
      tasks,
      seedTask.id,
      service,
      (t) => setTasksCalls.push(t),
      (e) => errors.push(e),
    );

    expect(setTasksCalls).toHaveLength(2);
    expect(setTasksCalls[0][0].completed).toBe(true); // optimistic flip
    expect(setTasksCalls[1]).toBe(tasks); // rolled back to the original array
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Couldn't save your change/);
  });

  test('no-op when the task id is not found', async () => {
    const repository = new InMemoryTasksRepository();
    const service = new TaskService(repository);
    const setTasks = jest.fn();
    const setError = jest.fn();

    await toggleTaskWithRollback([], 'missing', service, setTasks, setError);

    expect(setTasks).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });
});
