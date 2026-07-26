import type { SQLiteDatabase } from 'expo-sqlite';
import { migrations } from './migrations';

/** Runs every migration newer than the DB's current `PRAGMA user_version`,
 *  each in its own transaction, bumping `user_version` immediately after
 *  that step commits — so a crash mid-sequence resumes cleanly on next
 *  launch instead of re-running or skipping a step. */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
    });
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
  }
}
