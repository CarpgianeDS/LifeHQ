import { computeDueBucket, computeDueLabel, isoDaysFromNow, refreshDisplayTasks, toDisplayTask } from './dueDate';

const NOW = new Date(2026, 6, 8, 12, 0, 0); // Wed 8 July 2026, noon

describe('computeDueBucket / computeDueLabel', () => {
  test('overdue by one day', () => {
    const due = isoDaysFromNow(-1, NOW);
    expect(computeDueBucket(due, NOW)).toBe('overdue');
    expect(computeDueLabel(due, NOW)).toBe('Overdue · 1 day');
  });

  test('overdue by several days', () => {
    const due = isoDaysFromNow(-3, NOW);
    expect(computeDueBucket(due, NOW)).toBe('overdue');
    expect(computeDueLabel(due, NOW)).toBe('Overdue · 3 days');
  });

  test('same calendar day, different time of day', () => {
    const now = new Date(2026, 6, 8, 23, 0, 0);
    const due = new Date(2026, 6, 8, 1, 0, 0).toISOString();
    expect(computeDueBucket(due, now)).toBe('today');
    expect(computeDueLabel(due, now)).toBe('Today');
  });

  test('midnight boundary: 4 minutes apart but different calendar day', () => {
    const now = new Date(2026, 6, 8, 23, 58, 0);
    const due = new Date(2026, 6, 9, 0, 2, 0).toISOString();
    expect(computeDueBucket(due, now)).toBe('upcoming');
    expect(computeDueLabel(due, now)).toBe('Tomorrow');
  });

  test('tomorrow', () => {
    const due = isoDaysFromNow(1, NOW);
    expect(computeDueBucket(due, NOW)).toBe('upcoming');
    expect(computeDueLabel(due, NOW)).toBe('Tomorrow');
  });

  test.each([2, 3, 4, 5, 6])('%i days ahead formats as "In %i days"', (n) => {
    const due = isoDaysFromNow(n, NOW);
    expect(computeDueBucket(due, NOW)).toBe('upcoming');
    expect(computeDueLabel(due, NOW)).toBe(`In ${n} days`);
  });

  test.each([
    [7, 'In 1 week'],
    [14, 'In 2 weeks'],
    [21, 'In 3 weeks'],
  ])('%i days ahead formats as "%s"', (n, label) => {
    const due = isoDaysFromNow(n as number, NOW);
    expect(computeDueBucket(due, NOW)).toBe('upcoming');
    expect(computeDueLabel(due, NOW)).toBe(label);
  });

  test('non-multiple-of-7 week-scale offset falls back to day count', () => {
    const due = isoDaysFromNow(10, NOW);
    expect(computeDueLabel(due, NOW)).toBe('In 10 days');
  });

  test('crosses a month and year boundary', () => {
    const now = new Date(2025, 11, 30); // 30 Dec 2025
    const due = new Date(2026, 0, 4).toISOString(); // 4 Jan 2026 = +5 days
    expect(computeDueBucket(due, now)).toBe('upcoming');
    expect(computeDueLabel(due, now)).toBe('In 5 days');
  });

  test('invalid date string is treated as no due date, never throws', () => {
    expect(() => computeDueBucket('not-a-real-date', NOW)).not.toThrow();
    expect(computeDueBucket('not-a-real-date', NOW)).toBe('upcoming');
    expect(computeDueLabel('not-a-real-date', NOW)).toBe('No due date');
  });

  test('null due date', () => {
    expect(computeDueBucket(null, NOW)).toBe('upcoming');
    expect(computeDueLabel(null, NOW)).toBe('No due date');
  });

  test('undefined due date behaves the same as null', () => {
    expect(computeDueBucket(undefined, NOW)).toBe('upcoming');
    expect(computeDueLabel(undefined, NOW)).toBe('No due date');
  });
});

describe('toDisplayTask', () => {
  test('attaches dueBucket and dueLabel derived from dueAt', () => {
    const task = {
      id: 't1',
      title: 'Pay council tax',
      module: 'bills' as const,
      dueAt: isoDaysFromNow(-3, NOW),
      priority: 'high' as const,
      completed: false,
      source: 'manual' as const,
      notes: '',
      needsReview: false,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      householdId: null,
      createdByMemberId: null,
      updatedByMemberId: null,
    };
    const display = toDisplayTask(task, NOW);
    expect(display.dueBucket).toBe('overdue');
    expect(display.dueLabel).toBe('Overdue · 3 days');
    expect(display.id).toBe('t1');
  });
});

describe('refreshDisplayTasks', () => {
  const baseTask = {
    id: 't1',
    title: 'Replace boiler filter',
    module: 'house' as const,
    priority: 'low' as const,
    completed: false,
    source: 'manual' as const,
    notes: '',
    needsReview: false,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    householdId: null,
    createdByMemberId: null,
    updatedByMemberId: null,
  };

  test('due-state refresh after the calendar day changes: a task due "today" becomes overdue once the day rolls over', () => {
    const dueAt = isoDaysFromNow(0, NOW); // due today, relative to NOW
    const displayTask = toDisplayTask({ ...baseTask, dueAt }, NOW);
    expect(displayTask.dueBucket).toBe('today');
    expect(displayTask.dueLabel).toBe('Today');

    const tomorrow = isoDaysFromNow(1, NOW);
    const refreshed = refreshDisplayTasks([displayTask], new Date(tomorrow));

    expect(refreshed[0].dueBucket).toBe('overdue');
    expect(refreshed[0].dueLabel).toBe('Overdue · 1 day');
    // Nothing else about the task changes — only the derived display fields.
    expect(refreshed[0].id).toBe('t1');
    expect(refreshed[0].completed).toBe(false);
  });

  test('an upcoming task becomes "today" once the calendar day catches up to it', () => {
    const dueAt = isoDaysFromNow(1, NOW); // due tomorrow, relative to NOW
    const displayTask = toDisplayTask({ ...baseTask, dueAt }, NOW);
    expect(displayTask.dueBucket).toBe('upcoming');

    const nextDay = isoDaysFromNow(1, NOW);
    const refreshed = refreshDisplayTasks([displayTask], new Date(nextDay));

    expect(refreshed[0].dueBucket).toBe('today');
    expect(refreshed[0].dueLabel).toBe('Today');
  });

  test('refreshing with the same day is a no-op', () => {
    const dueAt = isoDaysFromNow(2, NOW);
    const displayTask = toDisplayTask({ ...baseTask, dueAt }, NOW);
    const refreshed = refreshDisplayTasks([displayTask], NOW);
    expect(refreshed[0].dueBucket).toBe(displayTask.dueBucket);
    expect(refreshed[0].dueLabel).toBe(displayTask.dueLabel);
  });
});

describe('isoDaysFromNow', () => {
  test('produces a parseable ISO string offset by the given number of days', () => {
    const iso = isoDaysFromNow(5, NOW);
    const parsed = new Date(iso);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
    expect(parsed.getDate()).toBe(13);
  });
});
