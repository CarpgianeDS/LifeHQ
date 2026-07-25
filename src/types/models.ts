import type { CategoryKey, PriorityKey } from '../theme/tokens';
import type { Role } from '../data/roles';

export type DueBucket = 'overdue' | 'today' | 'upcoming';

export type TaskSource = 'manual' | 'watch_voice' | 'email';

export interface Task {
  id: string;
  title: string;
  module: CategoryKey;
  dueLabel: string;
  dueBucket: DueBucket;
  priority: PriorityKey;
  completed: boolean;
  source: TaskSource;
  notes: string;
  needsReview: boolean;
}

export interface EmailSuggestion {
  id: string;
  title: string;
  module: CategoryKey;
  confidence: number;
  detail: string;
  dueLabel: string;
  dueBucket: DueBucket;
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
