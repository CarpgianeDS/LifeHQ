import type { SQLiteDatabase } from 'expo-sqlite';

export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          module TEXT NOT NULL,
          priority TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          source TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          needs_review INTEGER NOT NULL DEFAULT 0,
          due_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          household_id TEXT,
          created_by_member_id TEXT,
          updated_by_member_id TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
    },
  },
];
