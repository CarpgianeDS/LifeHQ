import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { runMigrations } from './migrate';
import { seedIfEmpty } from './seed';
import { TaskUnavailableError } from '../../services/errors';
import { createResettableAsyncSingleton } from '../resettableAsyncSingleton';

const DATABASE_NAME = 'lifehq.db';

async function initializeDatabase(): Promise<SQLiteDatabase> {
  // expo-sqlite's web backend needs Metro WASM config + COOP/COEP headers
  // this project doesn't set up (out of scope here — see README). Without
  // an explicit check, openDatabaseAsync's underlying worker fails to
  // bundle and the returned promise never resolves or rejects, leaving the
  // UI stuck on a loading spinner forever. Fail fast with a clear message
  // instead.
  if (Platform.OS === 'web') {
    throw new TaskUnavailableError(
      'Tasks are not available on web in this build — open the app on iOS or Android.',
    );
  }
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await runMigrations(db);
  await seedIfEmpty(db);
  return db;
}

/** Module-level singleton — not a React provider/Suspense boundary, so
 *  adding this doesn't touch App.tsx/AppProviders or affect any other
 *  (still in-memory) feature. First call opens the DB, runs pending
 *  migrations, and seeds first-run data; later calls reuse the same
 *  promise. If initialization fails, the cache resets (see
 *  createResettableAsyncSingleton) so calling this again — e.g. from the
 *  error card's Retry button — genuinely attempts a fresh connection
 *  instead of replaying the same cached rejection forever. */
export const getDatabase = createResettableAsyncSingleton(initializeDatabase);
