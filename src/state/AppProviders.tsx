import React from 'react';
import { CalendarSyncProvider } from './CalendarSyncContext';
import { HouseholdProvider } from './HouseholdContext';
import { MealPlanProvider } from './MealPlanContext';
import { RemindersProvider } from './RemindersContext';
import { TasksProvider } from './TasksContext';
import { TestNotificationProvider } from './TestNotificationContext';

type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>;

// Order matters: CalendarSyncProvider reads useReminders(), so RemindersProvider
// must appear before it in this list.
const providers: ProviderComponent[] = [
  TasksProvider,
  RemindersProvider,
  CalendarSyncProvider,
  MealPlanProvider,
  HouseholdProvider,
  TestNotificationProvider,
];

export function AppProviders({ children }: { children: React.ReactNode }) {
  return providers.reduceRight<React.ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children,
  );
}
