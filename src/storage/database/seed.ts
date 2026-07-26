import type { SQLiteDatabase } from 'expo-sqlite';
import { isoDaysFromNow } from '../../data/dueDate';
import { seedTasks } from '../../data/mockTasks';
import { generateId } from '../id';

const SEED_MARKER_KEY = 'tasks_seeded';

/** Pure — whether first-run seeding should happen, given whatever `app_meta`
 *  row (if any) was found for the seed marker key. Unit-testable without a
 *  database: seeding should happen only when no marker row exists yet. */
export function shouldSeed(markerRow: { value: string } | null): boolean {
  return markerRow === null;
}

/** Inserts the mock tasks once, on first launch only, guarded by a
 *  persisted marker rather than an empty-table check — so a user who
 *  intentionally deletes every task never has samples silently recreated. */
export async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const marker = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    SEED_MARKER_KEY,
  );

  if (!shouldSeed(marker ?? null)) return;

  await db.withTransactionAsync(async () => {
    const now = new Date();
    const nowIso = now.toISOString();

    for (const seed of seedTasks) {
      await db.runAsync(
        `INSERT INTO tasks
          (id, title, module, priority, completed, source, notes, needs_review, due_at, created_at, updated_at, household_id, created_by_member_id, updated_by_member_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
        generateId('task'),
        seed.title,
        seed.module,
        seed.priority,
        seed.completed ? 1 : 0,
        'manual',
        seed.notes,
        0,
        isoDaysFromNow(seed.dueOffsetDays, now),
        nowIso,
        nowIso,
      );
    }

    await db.runAsync(
      'INSERT INTO app_meta (key, value) VALUES (?, ?)',
      SEED_MARKER_KEY,
      nowIso,
    );
  });
}
