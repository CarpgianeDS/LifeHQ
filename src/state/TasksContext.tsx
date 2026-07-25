import React, { createContext, useContext, useMemo, useState } from 'react';
import { initialTasks } from '../data/mockTasks';
import type { Task } from '../types/models';

interface TasksContextValue {
  tasks: Task[];
  toggleTask: (id: string) => void;
  addTask: (task: Task) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const addTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const value = useMemo(() => ({ tasks, toggleTask, addTask }), [tasks]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within a TasksProvider');
  return ctx;
}
