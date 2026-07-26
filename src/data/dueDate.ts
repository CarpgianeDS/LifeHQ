import type { DisplayTask, DueBucket, Task } from '../types/models';

/** Local midnight for the given date, used so bucket/label comparisons are
 *  by calendar day, never by raw millisecond distance. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDueAt(dueAt: string | null | undefined): Date | null {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole calendar days from `now`'s date to `due`'s date (negative = past). */
function calendarDaysDiff(due: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / msPerDay);
}

export function computeDueBucket(dueAt: string | null | undefined, now: Date = new Date()): DueBucket {
  const due = parseDueAt(dueAt);
  if (!due) return 'upcoming';
  const diff = calendarDaysDiff(due, now);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  return 'upcoming';
}

export function computeDueLabel(dueAt: string | null | undefined, now: Date = new Date()): string {
  const due = parseDueAt(dueAt);
  if (!due) return 'No due date';

  const diff = calendarDaysDiff(due, now);
  if (diff < 0) {
    const n = -diff;
    return `Overdue · ${n} day${n === 1 ? '' : 's'}`;
  }
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  if (diff % 7 === 0) {
    const weeks = diff / 7;
    return `In ${weeks} week${weeks === 1 ? '' : 's'}`;
  }
  return `In ${diff} days`;
}

export function toDisplayTask(task: Task, now: Date = new Date()): DisplayTask {
  return {
    ...task,
    dueBucket: computeDueBucket(task.dueAt, now),
    dueLabel: computeDueLabel(task.dueAt, now),
  };
}

/** Re-derives `dueBucket`/`dueLabel` for already-loaded tasks against a
 *  fresh `now`, without touching anything else about them. Used to refresh
 *  the display when the app becomes active again or the local calendar day
 *  changes — a task due "today" at 11pm should read "Overdue" if the app is
 *  still open (or reopened) after midnight, without needing a DB refetch. */
export function refreshDisplayTasks(tasks: DisplayTask[], now: Date = new Date()): DisplayTask[] {
  return tasks.map((t) => ({
    ...t,
    dueBucket: computeDueBucket(t.dueAt, now),
    dueLabel: computeDueLabel(t.dueAt, now),
  }));
}

/** ISO timestamp `days` calendar days from `from` (default now) — used by
 *  seed data and email-suggestion mock data to express a due date as a
 *  relative offset. */
export function isoDaysFromNow(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
