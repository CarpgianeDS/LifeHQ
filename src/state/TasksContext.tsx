import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { refreshDisplayTasks } from '../data/dueDate';
import { taskService } from '../services/taskServiceInstance';
import { createOperationTracker, toggleTaskWithRollback } from './tasksOptimistic';
import type { MutationError } from './tasksOptimistic';
import type { DisplayTask, NewTaskInput } from '../types/models';

interface TasksContextValue {
  tasks: DisplayTask[];
  loading: boolean;
  /** Fatal — the initial load itself failed, so there's nothing to show.
   *  Blocks the task list; `retry()` re-attempts the load. */
  loadError: string | null;
  /** Non-blocking — a create/update/toggle failed, but whatever tasks were
   *  already loaded are still valid and must stay visible. Scoped to the
   *  specific task (or the reserved "new task" key) that produced it, so an
   *  unrelated mutation's success can never clear it — see
   *  tasksOptimistic.ts. */
  mutationError: MutationError | null;
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

// Sentinel task id for addTask's own errors — never collides with a real
// task id, so it can share the same taskId-scoped clearing rule as toggle
// errors without ever being cleared by (or clearing) an unrelated toggle.
const NEW_TASK_ERROR_KEY = 'new-task';

export function TasksProvider({ children }: { children: React.ReactNode }) {
  // tasksRef is the single source of truth read/written synchronously by
  // updateTasks; `tasks` state exists only to trigger re-renders. This is
  // what lets two rapid taps each see the other's already-applied change
  // instead of both reading the same stale render snapshot — a React state
  // setter's updater isn't guaranteed to run before the next line executes,
  // but a plain ref read/write is.
  const tasksRef = useRef<DisplayTask[]>([]);
  const [tasks, setTasksState] = useState<DisplayTask[]>([]);
  const updateTasks = useCallback((updater: (prev: DisplayTask[]) => DisplayTask[]): DisplayTask[] => {
    const next = updater(tasksRef.current);
    tasksRef.current = next;
    setTasksState(next);
    return next;
  }, []);

  const mutationErrorRef = useRef<MutationError | null>(null);
  const [mutationError, setMutationErrorState] = useState<MutationError | null>(null);
  const updateMutationError = useCallback((updater: (prev: MutationError | null) => MutationError | null) => {
    const next = updater(mutationErrorRef.current);
    mutationErrorRef.current = next;
    setMutationErrorState(next);
  }, []);

  const operationsRef = useRef<ReturnType<typeof createOperationTracker> | null>(null);
  if (operationsRef.current === null) operationsRef.current = createOperationTracker();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);
    taskService
      .list()
      .then((loaded) => {
        if (cancelled) return;
        updateTasks(() => loaded);
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
  }, [reloadToken, updateTasks]);

  // Re-derive dueBucket/dueLabel (never refetch) when the app comes back to
  // the foreground, and periodically in case the calendar day rolls over
  // while the app stays open and active the whole time.
  useEffect(() => {
    function refreshDueStates() {
      updateTasks((prev) => refreshDisplayTasks(prev));
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
  }, [updateTasks]);

  const toggleTask = (id: string) =>
    toggleTaskWithRollback(id, taskService, updateTasks, operationsRef.current!, updateMutationError);

  const addTask = async (input: NewTaskInput) => {
    updateMutationError((prev) => (prev && prev.taskId === NEW_TASK_ERROR_KEY ? null : prev));
    try {
      const created = await taskService.create(input);
      updateTasks((prev) => [created, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save the new task. Please try again.";
      updateMutationError(() => ({ taskId: NEW_TASK_ERROR_KEY, message }));
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
