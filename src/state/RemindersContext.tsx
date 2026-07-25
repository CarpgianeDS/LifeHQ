import React, { createContext, useContext, useMemo, useState } from 'react';
import { initialReminders } from '../data/mockReminders';
import type { CategoryKey } from '../theme/tokens';
import type { Reminder } from '../types/models';

interface RemindersContextValue {
  reminders: Reminder[];
  toggleComplete: (id: string) => void;
  snooze: (id: string, label: string) => void;
  setCategory: (id: string, module: CategoryKey) => void;
  addReminders: (newOnes: Reminder[]) => void;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);

  const toggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
    );
  };

  const snooze = (id: string, label: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, time: `Snoozed · ${label}` } : r)),
    );
  };

  const setCategory = (id: string, module: CategoryKey) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, module } : r)));
  };

  const addReminders = (newOnes: Reminder[]) => {
    setReminders((prev) => [...newOnes, ...prev]);
  };

  const value = useMemo(
    () => ({ reminders, toggleComplete, snooze, setCategory, addReminders }),
    [reminders],
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used within a RemindersProvider');
  return ctx;
}
