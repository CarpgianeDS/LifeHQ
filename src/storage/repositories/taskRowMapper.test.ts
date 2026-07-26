import { mapRowToTask, mapTaskToRow } from './taskRowMapper';
import type { TaskRow } from './taskRowMapper';
import type { Task } from '../../types/models';

const task: Task = {
  id: 'task_1',
  title: 'Pay council tax',
  module: 'bills',
  priority: 'high',
  completed: false,
  source: 'manual',
  notes: 'Direct debit failed',
  needsReview: false,
  dueAt: '2026-07-05T00:00:00.000Z',
  createdAt: '2026-07-01T09:00:00.000Z',
  updatedAt: '2026-07-01T09:00:00.000Z',
  householdId: null,
  createdByMemberId: null,
  updatedByMemberId: null,
};

const row: TaskRow = {
  id: 'task_1',
  title: 'Pay council tax',
  module: 'bills',
  priority: 'high',
  completed: 0,
  source: 'manual',
  notes: 'Direct debit failed',
  needs_review: 0,
  due_at: '2026-07-05T00:00:00.000Z',
  created_at: '2026-07-01T09:00:00.000Z',
  updated_at: '2026-07-01T09:00:00.000Z',
  household_id: null,
  created_by_member_id: null,
  updated_by_member_id: null,
};

describe('mapRowToTask / mapTaskToRow', () => {
  test('mapRowToTask converts snake_case + 0/1 booleans to a domain Task', () => {
    expect(mapRowToTask(row)).toEqual(task);
  });

  test('mapTaskToRow is the exact inverse', () => {
    expect(mapTaskToRow(task)).toEqual(row);
  });

  test('round-trips a completed task with needsReview true', () => {
    const completedTask: Task = { ...task, completed: true, needsReview: true };
    const roundTripped = mapRowToTask(mapTaskToRow(completedTask));
    expect(roundTripped).toEqual(completedTask);
  });

  test('round-trips a null dueAt (no due date)', () => {
    const noDueDate: Task = { ...task, dueAt: null };
    const roundTripped = mapRowToTask(mapTaskToRow(noDueDate));
    expect(roundTripped).toEqual(noDueDate);
    expect(roundTripped.dueAt).toBeNull();
  });

  test('round-trips householdId/createdByMemberId/updatedByMemberId when present', () => {
    const withHousehold: Task = {
      ...task,
      householdId: 'household_1',
      createdByMemberId: 'member_1',
      updatedByMemberId: 'member_2',
    };
    const roundTripped = mapRowToTask(mapTaskToRow(withHousehold));
    expect(roundTripped).toEqual(withHousehold);
  });
});
