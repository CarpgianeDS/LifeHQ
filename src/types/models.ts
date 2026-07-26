import type { Role } from '../data/roles';

// Domain types. The theme layer (src/theme/tokens.ts) maps these keys to
// colors — it does not define them — so the domain model never depends on
// presentation.
export type CategoryKey = 'house' | 'bills' | 'admin' | 'oisin';
export type PriorityKey = 'high' | 'medium' | 'low';

export type DueBucket = 'overdue' | 'today' | 'upcoming';

export type TaskSource = 'manual' | 'watch_voice' | 'email';

export interface Task {
  id: string;
  title: string;
  module: CategoryKey;
  /** Canonical ISO 8601 timestamp. Null means no due date has been set. */
  dueAt: string | null;
  priority: PriorityKey;
  completed: boolean;
  source: TaskSource;
  notes: string;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
  /** Unused today — schema headroom for future household task sharing. */
  householdId: string | null;
  createdByMemberId: string | null;
  updatedByMemberId: string | null;
}

/** What screens actually read: a Task plus display fields derived from `dueAt`. */
export type DisplayTask = Task & {
  dueLabel: string;
  dueBucket: DueBucket;
};

export interface NewTaskInput {
  title: string;
  module: CategoryKey;
  priority: PriorityKey;
  dueAt: string;
  source: TaskSource;
  notes: string;
  needsReview: boolean;
}

export type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'module' | 'priority' | 'dueAt' | 'notes' | 'needsReview'>
>;

export interface EmailSuggestion {
  id: string;
  title: string;
  module: CategoryKey;
  confidence: number;
  detail: string;
  dueAt: string;
}

export interface Reminder {
  id: string;
  taskId: string | null;
  title: string;
  time: string;
  recurring: boolean;
  completed: boolean;
  daysOut: number;
  module: CategoryKey;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type InviteStatus = 'sending' | 'pending';

export interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  status: InviteStatus;
}
