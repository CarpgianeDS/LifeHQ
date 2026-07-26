import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { taskService } from '../services/taskServiceInstance';
import { toggleTaskWithRollback } from './tasksOptimistic';
import type { DisplayTask, NewTaskInput } from '../types/models';

interface TasksContextValue {
  tasks: DisplayTask[];
  loading: boolean;
  error: string | null;
  toggleTask: (id: string) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<void>;
  retry: () => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    taskService
      .list()
      .then((loaded) => {
        if (cancelled) return;
        setTasks(loaded);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load tasks. Please try again.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const toggleTask = (id: string) =>
    toggleTaskWithRollback(tasks, id, taskService, setTasks, setError);

  const addTask = async (input: NewTaskInput) => {
    const created = await taskService.create(input);
    setTasks((prev) => [created, ...prev]);
  };

  const retry = () => setReloadToken((n) => n + 1);

  const value = useMemo(
    () => ({ tasks, loading, error, toggleTask, addTask, retry }),
    [tasks, loading, error],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within a TasksProvider');
  return ctx;
}
