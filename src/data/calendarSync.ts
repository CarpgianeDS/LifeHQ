export type ProviderKey = 'google' | 'outlook' | 'icloud';

export const providerNames: Record<ProviderKey, string> = {
  google: 'Gmail',
  outlook: 'Outlook',
  icloud: 'iCalendar',
};

export const providerIconColors: Record<ProviderKey, string> = {
  google: '#B5651D',
  outlook: '#3B5B7D',
  icloud: '#4F7D5D',
};

export const providerOrder: ProviderKey[] = ['google', 'outlook', 'icloud'];

interface SyncSampleEvent {
  title: string;
  time: string;
  daysOut: number;
}

export const calendarSyncPool: Record<ProviderKey, SyncSampleEvent[]> = {
  google: [
    { title: "Oisin's swimming lesson", time: 'Sat · 10:00 AM', daysOut: 6 },
    { title: 'Recycling collection', time: 'Mon · 7:00 AM', daysOut: 9 },
  ],
  outlook: [
    { title: 'Annual eye test', time: 'In 2 weeks · 4:00 PM', daysOut: 13 },
    { title: 'MOT reminder from garage', time: 'In 3 weeks · 9:00 AM', daysOut: 20 },
  ],
  icloud: [
    { title: 'Family movie night', time: 'Fri · 7:30 PM', daysOut: 4 },
    { title: 'Boiler service follow-up', time: 'In 4 weeks · 11:00 AM', daysOut: 28 },
  ],
};
