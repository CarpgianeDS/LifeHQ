import type { EmailSuggestion, Task } from '../types/models';

export const initialTasks: Task[] = [
  { id: 't1', title: 'Renew car insurance', module: 'bills', dueLabel: 'Today', dueBucket: 'today', priority: 'high', completed: false, source: 'manual', notes: 'Policy with current provider. Compare renewal quote before Friday.', needsReview: false },
  { id: 't2', title: 'Book MOT test', module: 'admin', dueLabel: 'Tomorrow', dueBucket: 'upcoming', priority: 'medium', completed: false, source: 'manual', notes: 'Due before the 30th. Local garage on Elm St has availability.', needsReview: false },
  { id: 't3', title: 'Pay council tax', module: 'bills', dueLabel: 'Overdue · 3 days', dueBucket: 'overdue', priority: 'high', completed: false, source: 'manual', notes: 'Direct debit failed this month — pay manually via the council portal.', needsReview: false },
  { id: 't4', title: 'Replace boiler filter', module: 'house', dueLabel: 'Today', dueBucket: 'today', priority: 'low', completed: true, source: 'manual', notes: 'Annual service reminder.', needsReview: false },
  { id: 't5', title: 'Passport renewal', module: 'admin', dueLabel: 'In 2 weeks', dueBucket: 'upcoming', priority: 'medium', completed: false, source: 'manual', notes: 'Expires in 6 weeks — apply online to avoid rush fees.', needsReview: false },
  { id: 't6', title: 'Dentist check-up', module: 'admin', dueLabel: 'In 5 days', dueBucket: 'upcoming', priority: 'low', completed: false, source: 'manual', notes: 'Six-month check-up. Call to confirm the time.', needsReview: false },
  { id: 't7', title: "Book Oisin's 2-year health check", module: 'oisin', dueLabel: 'In 1 week', dueBucket: 'upcoming', priority: 'medium', completed: false, source: 'manual', notes: 'Health visitor review — call GP surgery to book.', needsReview: false },
  { id: 't8', title: "Renew Oisin's nursery place", module: 'oisin', dueLabel: 'In 3 weeks', dueBucket: 'upcoming', priority: 'medium', completed: false, source: 'manual', notes: 'Confirm days and pay the deposit before the new term.', needsReview: false },
];

export const initialEmailSuggestions: EmailSuggestion[] = [
  { id: 'e1', title: 'Car insurance renewal', module: 'bills', confidence: 0.91, detail: 'From: Aviva · due in 4 weeks', dueLabel: 'In 4 weeks', dueBucket: 'upcoming' },
  { id: 'e2', title: 'Home insurance renewal', module: 'bills', confidence: 0.88, detail: 'From: Halifax · due in 3 weeks', dueLabel: 'In 3 weeks', dueBucket: 'upcoming' },
  { id: 'e3', title: 'Council tax bill', module: 'bills', confidence: 0.67, detail: 'From: Local Council · amount unclear', dueLabel: 'Due in 10 days', dueBucket: 'upcoming' },
];
