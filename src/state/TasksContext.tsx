import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { refreshDisplayTasks } from '../data/dueDate';
import { taskService } from '../services/taskServiceInstance';
import { toggleTaskWithRollback } from './tasksOptimistic';
import type { DisplayTask, NewTaskInput } from '../types/models';

interface TasksContextValue {
  tasks: DisplayTask[];
  loading: boolean;
  /** Fatal — the initial load itself failed, so there's nothing to show.
   *  Blocks the task list; `retry()` re-attempts the load. */
  loadError: string | null;
  /** Non-blocking — a create/update/toggle failed, but whatever tasks were
   *  already loaded are still valid and must stay visible. Cleared on the
   *  next successful mutation. */
  mutationError: string | null;
  toggleTask: (id: string) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<void>;
  retry: () => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

// How often to check whether the local calendar day has rolled over while
// the app stays open and in the foreground (e.g. left open overnight) — a
// day boundary can't be detected from an AppState 'active' transition alone
// since the app never backgrounds/foregrounds in that case. 60s is cheap
// and imperceptible; precision beyond "within a minute of midnight" isn't
// needed for a due-date label.
const DAY_CHANGE_POLL_MS = 60_000;

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);
    taskService
      .list()
      .then((loaded) => {
        if (cancelled) return;
        setTasks(loaded);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Couldn't load tasks. Please try again.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // Re-derive dueBucket/dueLabel (never refetch) when the app comes back to
  // the foreground, and periodically in case the calendar day rolls over
  // while the app stays open and active the whole time.
  useEffect(() => {
    function refreshDueStates() {
      setTasks((prev) => refreshDisplayTasks(prev));
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') refreshDueStates();
    });

    let lastSeenDay = new Date().toDateString();
    const dayChangeInterval = setInterval(() => {
      const currentDay = new Date().toDateString();
      if (currentDay !== lastSeenDay) {
        lastSeenDay = currentDay;
        refreshDueStates();
      }
    }, DAY_CHANGE_POLL_MS);

    return () => {
      subscription.remove();
      clearInterval(dayChangeInterval);
    };
  }, []);

  const toggleTask = (id: string) =>
    toggleTaskWithRollback(tasks, id, taskService, setTasks, setMutationError);

  const addTask = async (input: NewTaskInput) => {
    try {
      const created = await taskService.create(input);
      setTasks((prev) => [created, ...prev]);
      setMutationError(null);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Couldn't save the new task. Please try again.");
      throw err; // let the caller (e.g. QuickAddSheet) show its own local message too
    }
  };

  const retry = () => setReloadToken((n) => n + 1);

  const value = useMemo(
    () => ({ tasks, loading, loadError, mutationError, toggleTask, addTask, retry }),
    [tasks, loading, loadError, mutationError],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within a TasksProvider');
  return ctx;
}
