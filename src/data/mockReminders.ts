import type { Reminder } from '../types/models';

export const initialReminders: Reminder[] = [
  { id: 'r1', taskId: 't1', title: 'Renew car insurance', time: 'Today · 6:00 PM', recurring: false, completed: false, daysOut: 0, module: 'bills' },
  { id: 'r2', taskId: 't3', title: 'Pay council tax', time: 'Overdue · 3 days', recurring: false, completed: false, daysOut: -3, module: 'bills' },
  { id: 'r4', taskId: null, title: 'Bin collection', time: 'Every Tuesday · 7:00 AM', recurring: true, completed: false, daysOut: 2, module: 'house' },
  { id: 'r3', taskId: 't5', title: 'Passport renewal', time: 'In 2 weeks · 9:00 AM', recurring: false, completed: false, daysOut: 14, module: 'admin' },
  { id: 'r5', taskId: 't6', title: 'Dentist check-up', time: 'In 5 days · 11:30 AM', recurring: false, completed: false, daysOut: 5, module: 'admin' },
  { id: 'r6', taskId: null, title: 'Renew home insurance', time: 'In 3 weeks · 9:00 AM', recurring: false, completed: false, daysOut: 21, module: 'bills' },
  { id: 'r7', taskId: null, title: 'Annual boiler service', time: 'In 6 weeks · 10:00 AM', recurring: false, completed: false, daysOut: 42, module: 'house' },
  { id: 'r8', taskId: null, title: 'Car service', time: 'Next month · 2:00 PM', recurring: false, completed: false, daysOut: 33, module: 'bills' },
];
