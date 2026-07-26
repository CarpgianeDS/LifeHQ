import { SQLiteTasksRepository } from '../storage/repositories/SQLiteTasksRepository';
import { TaskService } from './TaskService';

/** The single composition point (not AppProviders/React Context — TaskService
 *  has no React dependency, so a plain module is simpler): wires the real
 *  SQLite-backed repository once, here. TasksContext imports this. Tests
 *  construct their own `new TaskService(new InMemoryTasksRepository())`
 *  instead and never import this file. */
export const taskService = new TaskService(new SQLiteTasksRepository());
