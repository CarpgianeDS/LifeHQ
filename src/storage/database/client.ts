import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { runMigrations } from './migrate';
import { seedIfEmpty } from './seed';
import { TaskUnavailableError } from '../../services/errors';

const DATABASE_NAME = 'lifehq.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

/** Module-level singleton — not a React provider/Suspense boundary, so
 *  adding this doesn't touch App.tsx/AppProviders or affect any other
 *  (still in-memory) feature. First call opens the DB, runs pending
 *  migrations, and seeds first-run data; later calls reuse the same
 *  promise. */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      // expo-sqlite's web backend needs Metro WASM config + COOP/COEP
      // headers this project doesn't set up (out of scope here — see
      // README). Without an explicit check, openDatabaseAsync's underlying
      // worker fails to bundle and the returned promise never resolves or
      // rejects, leaving the UI stuck on a loading spinner forever. Fail
      // fast with a clear message instead.
      if (Platform.OS === 'web') {
        throw new TaskUnavailableError(
          'Tasks are not available on web in this build — open the app on iOS or Android.',
        );
      }
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await runMigrations(db);
      await seedIfEmpty(db);
      return db;
    })();
  }
  return dbPromise;
}
