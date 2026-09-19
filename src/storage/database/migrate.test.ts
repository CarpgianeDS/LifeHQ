import { runMigrations } from './migrate';
import type { SQLiteDatabase } from 'expo-sqlite';

/** A minimal duck-typed stand-in for SQLiteDatabase covering just the three
 *  methods runMigrations actually calls. migrate.ts/migrations.ts only
 *  import `SQLiteDatabase` as a *type*, so this file never touches the real
 *  expo-sqlite module (which doesn't resolve under Jest in this project —
 *  see README's "Known limitations"). */
function createMockDb(initialUserVersion: number) {
  const calls: string[] = [];
  let userVersion = initialUserVersion;

  const db = {
    getFirstAsync: jest.fn(async () => ({ user_version: userVersion })),
    execAsync: jest.fn(async (sql: string) => {
      calls.push(sql);
      const match = sql.match(/PRAGMA user_version = (\d+)/);
      if (match) userVersion = Number(match[1]);
    }),
    withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => {
      calls.push('BEGIN');
      await fn();
      calls.push('COMMIT');
    }),
  };

  return { db: db as unknown as SQLiteDatabase, calls, getUserVersion: () => userVersion };
}

describe('runMigrations', () => {
  test('bumps user_version inside the same transaction as the migration', async () => {
    const { db, calls } = createMockDb(0);
    await runMigrations(db);

    const beginIndex = calls.indexOf('BEGIN');
    const commitIndex = calls.indexOf('COMMIT');
    const versionCallIndex = calls.findIndex((c) => c.includes('PRAGMA user_version ='));

    expect(beginIndex).toBeGreaterThanOrEqual(0);
    expect(versionCallIndex).toBeGreaterThan(beginIndex);
    expect(versionCallIndex).toBeLessThan(commitIndex);
  });

  test('leaves user_version at the latest migration version after running', async () => {
    const { db, getUserVersion } = createMockDb(0);
    await runMigrations(db);
    expect(getUserVersion()).toBe(1);
  });

  test('does not re-run migrations that are already applied', async () => {
    const { db, calls } = createMockDb(1); // already at the only migration's version
    await runMigrations(db);
    expect(calls).toHaveLength(0);
  });
});
