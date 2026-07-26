import type { DisplayTask } from '../types/models';

export function computeNotifSummary(tasks: DisplayTask[]): string {
  const overdue = tasks.filter((t) => t.dueBucket === 'overdue' && !t.completed);
  const today = tasks.filter((t) => t.dueBucket === 'today' && !t.completed);
  const due = [...overdue, ...today];
  const n = due.length;
  if (n === 0) return 'Nothing due today — enjoy the break.';
  const names = due.slice(0, 2).map((t) => t.title).join(', ');
  const extra = n > 2 ? ` +${n - 2} more` : '';
  return `${n} task${n > 1 ? 's' : ''} due today: ${names}${extra}`;
}
