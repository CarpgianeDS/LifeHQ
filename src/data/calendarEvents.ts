import type { CategoryKey } from '../theme/tokens';
import type { YMD } from './calendarDates';

export interface CalendarEvent extends YMD {
  id: string;
  title: string;
  time: string;
  module: CategoryKey;
}

export const calendarEvents: CalendarEvent[] = [
  { id: 'c1', y: 2026, m: 6, d: 6, title: 'Bin collection', time: '7:00 AM', module: 'house' },
  { id: 'c2', y: 2026, m: 6, d: 7, title: 'Dentist check-up', time: '11:30 AM', module: 'admin' },
  { id: 'c3', y: 2026, m: 6, d: 8, title: 'Pay council tax', time: '9:00 AM', module: 'bills' },
  { id: 'c4', y: 2026, m: 6, d: 8, title: 'Renew car insurance', time: '6:00 PM', module: 'bills' },
  { id: 'c5', y: 2026, m: 6, d: 9, title: 'Book MOT test', time: '9:00 AM', module: 'admin' },
  { id: 'c6', y: 2026, m: 6, d: 10, title: "Oisin's health check", time: '10:00 AM', module: 'oisin' },
  { id: 'c7', y: 2026, m: 6, d: 11, title: 'Weekly shop', time: '10:00 AM', module: 'house' },
  { id: 'c8', y: 2026, m: 6, d: 13, title: 'Bin collection', time: '7:00 AM', module: 'house' },
  { id: 'c9', y: 2026, m: 6, d: 15, title: 'Renew home insurance', time: '9:00 AM', module: 'bills' },
  { id: 'c10', y: 2026, m: 6, d: 17, title: 'Oisin nursery settling-in', time: '9:30 AM', module: 'oisin' },
  { id: 'c11', y: 2026, m: 6, d: 20, title: 'Bin collection', time: '7:00 AM', module: 'house' },
  { id: 'c12', y: 2026, m: 6, d: 23, title: 'Passport renewal appointment', time: '2:00 PM', module: 'admin' },
  { id: 'c13', y: 2026, m: 6, d: 25, title: 'Weekly shop', time: '10:00 AM', module: 'house' },
  { id: 'c14', y: 2026, m: 6, d: 27, title: 'Bin collection', time: '7:00 AM', module: 'house' },
  { id: 'c15', y: 2026, m: 6, d: 28, title: 'Annual boiler service', time: '10:00 AM', module: 'house' },
];

export function eventsForDate(ymd: YMD): CalendarEvent[] {
  return calendarEvents.filter((e) => e.y === ymd.y && e.m === ymd.m && e.d === ymd.d);
}
