import { createResettableAsyncSingleton } from './resettableAsyncSingleton';

describe('createResettableAsyncSingleton', () => {
  test('caches a successful result — the factory only runs once', async () => {
    let calls = 0;
    const get = createResettableAsyncSingleton(async () => {
      calls += 1;
      return 'db';
    });

    await expect(get()).resolves.toBe('db');
    await expect(get()).resolves.toBe('db');
    expect(calls).toBe(1);
  });

  test('resets on rejection so the next call genuinely retries (database initialisation retry)', async () => {
    let calls = 0;
    const get = createResettableAsyncSingleton(async () => {
      calls += 1;
      if (calls === 1) throw new Error('disk unavailable');
      return 'db';
    });

    await expect(get()).rejects.toThrow('disk unavailable');
    expect(calls).toBe(1);

    // A second call after the failure must invoke the factory again, not
    // return the same cached rejected promise.
    await expect(get()).resolves.toBe('db');
    expect(calls).toBe(2);

    // And now that it has succeeded, it's cached again.
    await expect(get()).resolves.toBe('db');
    expect(calls).toBe(2);
  });

  test('concurrent calls while pending share the same in-flight promise', async () => {
    let calls = 0;
    let resolveFactory!: (value: string) => void;
    const get = createResettableAsyncSingleton(
      () =>
        new Promise<string>((resolve) => {
          calls += 1;
          resolveFactory = resolve;
        }),
    );

    const first = get();
    const second = get();
    resolveFactory('db');

    await expect(first).resolves.toBe('db');
    await expect(second).resolves.toBe('db');
    expect(calls).toBe(1);
  });

  test('repeated failures keep retrying rather than sticking on the first error', async () => {
    let calls = 0;
    const get = createResettableAsyncSingleton(async () => {
      calls += 1;
      throw new Error(`failure ${calls}`);
    });

    await expect(get()).rejects.toThrow('failure 1');
    await expect(get()).rejects.toThrow('failure 2');
    await expect(get()).rejects.toThrow('failure 3');
    expect(calls).toBe(3);
  });
});
