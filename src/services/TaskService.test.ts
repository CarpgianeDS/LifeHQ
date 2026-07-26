import { TaskService } from './TaskService';
import { TaskPersistenceError, TaskValidationError } from './errors';
import { InMemoryTasksRepository } from '../storage/repositories/InMemoryTasksRepository';
import type { NewTaskInput } from '../types/models';

const validInput: NewTaskInput = {
  title: 'Renew car insurance',
  module: 'bills',
  priority: 'high',
  dueAt: new Date().toISOString(),
  source: 'manual',
  notes: '',
  needsReview: false,
};

describe('TaskService', () => {
  test('create then list returns the created task, decorated with dueBucket/dueLabel', async () => {
    const service = new TaskService(new InMemoryTasksRepository());
    const created = await service.create(validInput);
    expect(created.title).toBe('Renew car insurance');
    expect(created.dueBucket).toBeDefined();
    expect(created.dueLabel).toBeDefined();

    const listed = await service.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(created.id);
  });

  test('setCompleted persists the change', async () => {
    const service = new TaskService(new InMemoryTasksRepository());
    const created = await service.create(validInput);
    expect(created.completed).toBe(false);

    const completed = await service.setCompleted(created.id, true);
    expect(completed.completed).toBe(true);

    const listed = await service.list();
    expect(listed[0].completed).toBe(true);
  });

  test('update persists a patch even though the current UI does not call it yet', async () => {
    const service = new TaskService(new InMemoryTasksRepository());
    const created = await service.create(validInput);

    const updated = await service.update(created.id, { title: 'Renew home insurance', notes: 'Updated' });
    expect(updated.title).toBe('Renew home insurance');
    expect(updated.notes).toBe('Updated');

    const listed = await service.list();
    expect(listed[0].title).toBe('Renew home insurance');
  });

  test('rejects an empty title before it reaches the repository', async () => {
    const repository = new InMemoryTasksRepository();
    const service = new TaskService(repository);
    await expect(service.create({ ...validInput, title: '   ' })).rejects.toThrow(TaskValidationError);
    expect(await repository.list()).toHaveLength(0);
  });

  test('rejects an unparseable due date before it reaches the repository', async () => {
    const repository = new InMemoryTasksRepository();
    const service = new TaskService(repository);
    await expect(service.create({ ...validInput, dueAt: 'not-a-date' })).rejects.toThrow(TaskValidationError);
    expect(await repository.list()).toHaveLength(0);
  });

  test('wraps a repository failure in a typed, user-safe TaskPersistenceError', async () => {
    const repository = new InMemoryTasksRepository();
    repository.failWith = new Error('SQLITE_IOERR: disk I/O error');
    const service = new TaskService(repository);

    await expect(service.list()).rejects.toThrow(TaskPersistenceError);
    await expect(service.list()).rejects.toThrow("Couldn't load tasks. Please try again.");
  });
});
