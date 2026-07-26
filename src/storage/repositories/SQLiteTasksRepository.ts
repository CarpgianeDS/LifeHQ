import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../database/client';
import { generateId } from '../id';
import { mapRowToTask, mapTaskToRow } from './taskRowMapper';
import type { TaskRow } from './taskRowMapper';
import type { NewTaskInput, Task, UpdateTaskInput } from '../../types/models';
import type { TasksRepository } from './TasksRepository';

export class SQLiteTasksRepository implements TasksRepository {
  async list(): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY created_at DESC');
    return rows.map(mapRowToTask);
  }

  async create(input: NewTaskInput): Promise<Task> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId('task'),
      title: input.title,
      module: input.module,
      priority: input.priority,
      dueAt: input.dueAt,
      completed: false,
      source: input.source,
      notes: input.notes,
      needsReview: input.needsReview,
      createdAt: now,
      updatedAt: now,
      householdId: null,
      createdByMemberId: null,
      updatedByMemberId: null,
    };
    const row = mapTaskToRow(task);
    await db.runAsync(
      `INSERT INTO tasks
        (id, title, module, priority, completed, source, notes, needs_review, due_at, created_at, updated_at, household_id, created_by_member_id, updated_by_member_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id,
      row.title,
      row.module,
      row.priority,
      row.completed,
      row.source,
      row.notes,
      row.needs_review,
      row.due_at,
      row.created_at,
      row.updated_at,
      row.household_id,
      row.created_by_member_id,
      row.updated_by_member_id,
    );
    return task;
  }

  async update(id: string, patch: UpdateTaskInput): Promise<Task> {
    const db = await getDatabase();
    const existing = await this.getById(db, id);
    const updated: Task = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const row = mapTaskToRow(updated);
    await db.runAsync(
      `UPDATE tasks
       SET title = ?, module = ?, priority = ?, notes = ?, needs_review = ?, due_at = ?, updated_at = ?
       WHERE id = ?`,
      row.title,
      row.module,
      row.priority,
      row.notes,
      row.needs_review,
      row.due_at,
      row.updated_at,
      id,
    );
    return updated;
  }

  async setCompleted(id: string, completed: boolean): Promise<Task> {
    const db = await getDatabase();
    const existing = await this.getById(db, id);
    const updated: Task = { ...existing, completed, updatedAt: new Date().toISOString() };
    await db.runAsync(
      'UPDATE tasks SET completed = ?, updated_at = ? WHERE id = ?',
      updated.completed ? 1 : 0,
      updated.updatedAt,
      id,
    );
    return updated;
  }

  private async getById(db: SQLiteDatabase, id: string): Promise<Task> {
    const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', id);
    if (!row) throw new Error(`Task not found: ${id}`);
    return mapRowToTask(row);
  }
}
