import { createPersistenceQueue } from './persistenceQueue';

/** A promise plus its resolve/reject, so a test can control exactly when a
 *  queued task settles instead of relying on timers. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createPersistenceQueue', () => {
  test('runs a single enqueued task and resolves with its value', async () => {
    const queue = createPersistenceQueue();
    const result = await queue.enqueue('a', async () => 42);
    expect(result).toBe(42);
  });

  test('same key: a task does not start until the previous one for that key has settled', async () => {
    const queue = createPersistenceQueue();
    const order: string[] = [];
    const first = deferred<void>();

    const p1 = queue.enqueue('task-1', async () => {
      order.push('start-1');
      await first.promise;
      order.push('end-1');
    });
    const p2 = queue.enqueue('task-1', async () => {
      order.push('start-2'); // must not happen until end-1
    });

    // Give the microtask queue a chance to run anything that *could* start.
    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual(['start-1']); // task 2 has NOT started yet

    first.resolve();
    await Promise.all([p1, p2]);
    expect(order).toEqual(['start-1', 'end-1', 'start-2']);
  });

  test('different keys run independently — a slow key does not block another key', async () => {
    const queue = createPersistenceQueue();
    const order: string[] = [];
    const slow = deferred<void>();

    const pSlow = queue.enqueue('slow-key', async () => {
      order.push('slow-start');
      await slow.promise;
      order.push('slow-end');
    });
    const pFast = queue.enqueue('fast-key', async () => {
      order.push('fast-start');
      order.push('fast-end');
    });

    await pFast; // fast-key's work completes without waiting on slow-key
    expect(order).toEqual(['slow-start', 'fast-start', 'fast-end']);

    slow.resolve();
    await pSlow;
    expect(order).toEqual(['slow-start', 'fast-start', 'fast-end', 'slow-end']);
  });

  test('a rejected task does not block later tasks queued for the same key', async () => {
    const queue = createPersistenceQueue();
    const order: string[] = [];

    const p1 = queue.enqueue('a', async () => {
      order.push('task-1');
      throw new Error('boom');
    });
    const p2 = queue.enqueue('a', async () => {
      order.push('task-2');
      return 'ok';
    });

    await expect(p1).rejects.toThrow('boom');
    await expect(p2).resolves.toBe('ok');
    expect(order).toEqual(['task-1', 'task-2']);
  });

  test('each enqueue call resolves/rejects with its own outcome, not a previous task\'s', async () => {
    const queue = createPersistenceQueue();
    await expect(queue.enqueue('a', async () => { throw new Error('first fails'); })).rejects.toThrow('first fails');
    // A fresh, independently-succeeding task queued right after must not
    // somehow inherit or be blocked by the previous rejection.
    await expect(queue.enqueue('a', async () => 'second succeeds')).resolves.toBe('second succeeds');
  });

  test('cleans up a key\'s entry once its chain fully drains', async () => {
    const queue = createPersistenceQueue();
    expect(queue.size()).toBe(0);
    await queue.enqueue('a', async () => 'done');
    expect(queue.size()).toBe(0);
  });

  test('size() reflects only keys with outstanding work, across multiple keys', async () => {
    const queue = createPersistenceQueue();
    const gate = deferred<void>();

    const pending = queue.enqueue('a', async () => {
      await gate.promise;
    });
    expect(queue.size()).toBe(1);

    await queue.enqueue('b', async () => undefined); // settles immediately
    expect(queue.size()).toBe(1); // 'a' still pending, 'b' already cleaned up

    gate.resolve();
    await pending;
    expect(queue.size()).toBe(0);
  });

  test('three same-key tasks with reversed artificial delays still run and settle in invocation order', async () => {
    const queue = createPersistenceQueue();
    const order: number[] = [];
    const delays = [30, 10, 0]; // task 1 is the slowest, task 3 the fastest

    const run = (n: number) =>
      queue.enqueue('a', async () => {
        order.push(n * 10 + 1); // "started" marker
        await new Promise((resolve) => setTimeout(resolve, delays[n - 1]));
        order.push(n * 10 + 2); // "finished" marker
      });

    await Promise.all([run(1), run(2), run(3)]);

    // Every task's start immediately follows the previous task's finish —
    // i.e. despite task 1 being configured as the slowest, task 2 never
    // even starts until task 1 is fully done, and likewise for task 3.
    expect(order).toEqual([11, 12, 21, 22, 31, 32]);
  });
});
