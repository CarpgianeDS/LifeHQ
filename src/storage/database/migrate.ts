import type { SQLiteDatabase } from 'expo-sqlite';
import { migrations } from './migrations';

/** Runs every migration newer than the DB's current `PRAGMA user_version`,
 *  each in its own transaction. The `user_version` bump happens *inside*
 *  that same transaction, right after the migration's own SQL — SQLite's
 *  `user_version` pragma is transactional, so a crash between the schema
 *  change and the version bump can no longer happen: either both commit
 *  together, or neither does, and a relaunch resumes (or safely re-applies)
 *  from a consistent state either way. */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
