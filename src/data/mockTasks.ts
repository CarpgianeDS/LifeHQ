import type { EmailSuggestion } from '../types/models';
import { isoDaysFromNow } from './dueDate';

/** First-run seed data for the tasks table (src/storage/database/seed.ts).
 *  `dueOffsetDays` is resolved to a concrete `dueAt` ISO timestamp at seed
 *  time, relative to whenever the app is first launched. */
export interface SeedTask {
  title: string;
  module: 'house' | 'bills' | 'admin' | 'oisin';
  priority: 'high' | 'medium' | 'low';
  dueOffsetDays: number;
  completed: boolean;
  notes: string;
}

export const seedTasks: SeedTask[] = [
  { title: 'Renew car insurance', module: 'bills', priority: 'high', dueOffsetDays: 0, completed: false, notes: 'Policy with current provider. Compare renewal quote before Friday.' },
  { title: 'Book MOT test', module: 'admin', priority: 'medium', dueOffsetDays: 1, completed: false, notes: 'Due before the 30th. Local garage on Elm St has availability.' },
  { title: 'Pay council tax', module: 'bills', priority: 'high', dueOffsetDays: -3, completed: false, notes: 'Direct debit failed this month — pay manually via the council portal.' },
  { title: 'Replace boiler filter', module: 'house', priority: 'low', dueOffsetDays: 0, completed: true, notes: 'Annual service reminder.' },
  { title: 'Passport renewal', module: 'admin', priority: 'medium', dueOffsetDays: 14, completed: false, notes: 'Expires in 6 weeks — apply online to avoid rush fees.' },
  { title: 'Dentist check-up', module: 'admin', priority: 'low', dueOffsetDays: 5, completed: false, notes: 'Six-month check-up. Call to confirm the time.' },
  { title: "Book Oisin's 2-year health check", module: 'oisin', priority: 'medium', dueOffsetDays: 7, completed: false, notes: 'Health visitor review — call GP surgery to book.' },
  { title: "Renew Oisin's nursery place", module: 'oisin', priority: 'medium', dueOffsetDays: 21, completed: false, notes: 'Confirm days and pay the deposit before the new term.' },
];

export const initialEmailSuggestions: EmailSuggestion[] = [
  { id: 'e1', title: 'Car insurance renewal', module: 'bills', confidence: 0.91, detail: 'From: Aviva · due in 4 weeks', dueAt: isoDaysFromNow(28) },
  { id: 'e2', title: 'Home insurance renewal', module: 'bills', confidence: 0.88, detail: 'From: Halifax · due in 3 weeks', dueAt: isoDaysFromNow(21) },
  { id: 'e3', title: 'Council tax bill', module: 'bills', confidence: 0.67, detail: 'From: Local Council · amount unclear', dueAt: isoDaysFromNow(10) },
];
