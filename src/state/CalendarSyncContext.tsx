import React, { createContext, useContext, useMemo, useState } from 'react';
import { categorizeText } from '../data/categorize';
import { calendarSyncPool, providerNames } from '../data/calendarSync';
import type { ProviderKey } from '../data/calendarSync';
import { useReminders } from './RemindersContext';
import type { Reminder } from '../types/models';

export type ProviderStatus = 'idle' | 'connecting' | 'connected';

interface CalendarSyncContextValue {
  providers: Record<ProviderKey, ProviderStatus>;
  connectedCount: number;
  toggleProvider: (key: ProviderKey) => void;
}

const CalendarSyncContext = createContext<CalendarSyncContextValue | null>(null);

export function CalendarSyncProvider({ children }: { children: React.ReactNode }) {
  const { addReminders } = useReminders();
  const [providers, setProviders] = useState<Record<ProviderKey, ProviderStatus>>({
    google: 'idle',
    outlook: 'idle',
    icloud: 'idle',
  });

  const toggleProvider = (key: ProviderKey) => {
    if (providers[key] === 'connected') {
      setProviders((prev) => ({ ...prev, [key]: 'idle' }));
      return;
    }
    if (providers[key] === 'connecting') return;
    setProviders((prev) => ({ ...prev, [key]: 'connecting' }));
    setTimeout(() => {
      const synced: Reminder[] = calendarSyncPool[key].map((ev, i) => ({
        id: `sync-${key}-${Date.now()}-${i}`,
        taskId: null,
        title: ev.title,
        time: `${ev.time} · Synced from ${providerNames[key]}`,
        recurring: false,
        completed: false,
        daysOut: ev.daysOut,
        module: categorizeText(ev.title),
      }));
      addReminders(synced);
      setProviders((prev) => ({ ...prev, [key]: 'connected' }));
    }, 1300);
  };

  const connectedCount = Object.values(providers).filter((v) => v === 'connected').length;

  const value = useMemo(
    () => ({ providers, connectedCount, toggleProvider }),
    [providers, connectedCount],
  );

  return <CalendarSyncContext.Provider value={value}>{children}</CalendarSyncContext.Provider>;
}

export function useCalendarSync() {
  const ctx = useContext(CalendarSyncContext);
  if (!ctx) throw new Error('useCalendarSync must be used within a CalendarSyncProvider');
  return ctx;
}
