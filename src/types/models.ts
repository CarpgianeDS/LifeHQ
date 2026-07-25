import type { CategoryKey, PriorityKey } from '../theme/tokens';

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
