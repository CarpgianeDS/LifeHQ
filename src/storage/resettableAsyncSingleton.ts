/** Memoizes an async factory, but clears the cache on rejection so the next
 *  call genuinely retries instead of replaying the same cached failure
 *  forever. Deliberately has zero dependency on expo-sqlite (or anything
 *  else) — pure, generic, and unit-testable — so `getDatabase`'s
 *  reset-on-failure behavior can be verified without a real database. */
export function createResettableAsyncSingleton<T>(factory: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | null = null;

  return () => {
    if (!cached) {
      cached = factory().catch((error: unknown) => {
        cached = null;
        throw error;
      });
    }
    return cached;
  };
}
