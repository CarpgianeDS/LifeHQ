export interface YMD {
  y: number;
  m: number;
  d: number;
}

// Fixed "today" for this prototype's mock data (matches the dashboard's
// "Wednesday, 8 July" date and the design handoff's calendar events).
export const TODAY: YMD = { y: 2026, m: 6, d: 8 };

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const weekdayNames = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
export const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function toDate(ymd: YMD): Date {
  return new Date(ymd.y, ymd.m, ymd.d);
}

export function mondayIndex(ymd: YMD): number {
  return (toDate(ymd).getDay() + 6) % 7;
}

export function addDaysObj(ymd: YMD, n: number): YMD {
  const dt = toDate(ymd);
  dt.setDate(dt.getDate() + n);
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}

export function sameYMD(a: YMD, b: YMD): boolean {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

export function formatFull(ymd: YMD): string {
  return `${weekdayNames[toDate(ymd).getDay()]}, ${ymd.d} ${monthNames[ymd.m]}`;
}

export const weekDates: YMD[] = (() => {
  const start = addDaysObj(TODAY, -mondayIndex(TODAY));
  return [0, 1, 2, 3, 4, 5, 6].map((i) => addDaysObj(start, i));
})();
