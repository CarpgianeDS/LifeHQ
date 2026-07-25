import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

interface TestNotificationContextValue {
  visible: boolean;
  trigger: () => void;
}

const TestNotificationContext = createContext<TestNotificationContextValue | null>(null);

export function TestNotificationProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const trigger = () => {
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 3800);
  };

  const value = useMemo(() => ({ visible, trigger }), [visible]);

  return (
    <TestNotificationContext.Provider value={value}>{children}</TestNotificationContext.Provider>
  );
}

export function useTestNotification() {
  const ctx = useContext(TestNotificationContext);
  if (!ctx) throw new Error('useTestNotification must be used within a TestNotificationProvider');
  return ctx;
}
