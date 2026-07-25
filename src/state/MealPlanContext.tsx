import React, { createContext, useContext, useMemo, useState } from 'react';
import { initialMealPlan, mealPools } from '../data/mealPools';
import type { MealPlanDay } from '../data/mealPools';

type TescoStatus = 'idle' | 'sending' | 'done';

interface MealPlanContextValue {
  mealPlan: MealPlanDay[];
  shuffleDay: (day: string) => void;
  shoppingChecked: Record<string, boolean>;
  toggleShoppingItem: (name: string) => void;
  tescoConnected: boolean;
  tescoConnecting: boolean;
  connectTesco: () => void;
  tescoStatus: TescoStatus;
  addToTescoBasket: () => void;
}

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

function randOther(current: number, length: number): number {
  if (length <= 1) return current;
  let n: number;
  do {
    n = Math.floor(Math.random() * length);
  } while (n === current);
  return n;
}

export function MealPlanProvider({ children }: { children: React.ReactNode }) {
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(initialMealPlan);
  const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>({});
  const [tescoConnected, setTescoConnected] = useState(false);
  const [tescoConnecting, setTescoConnecting] = useState(false);
  const [tescoStatus, setTescoStatus] = useState<TescoStatus>('idle');

  const shuffleDay = (day: string) => {
    setMealPlan((prev) =>
      prev.map((m) =>
        m.day === day
          ? {
              ...m,
              b: randOther(m.b, mealPools.breakfast.length),
              l: randOther(m.l, mealPools.lunch.length),
              d: randOther(m.d, mealPools.dinner.length),
            }
          : m,
      ),
    );
  };

  const toggleShoppingItem = (name: string) => {
    setShoppingChecked((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const connectTesco = () => {
    setTescoConnecting(true);
    setTimeout(() => {
      setTescoConnecting(false);
      setTescoConnected(true);
    }, 1400);
  };

  const addToTescoBasket = () => {
    setTescoStatus('sending');
    setTimeout(() => setTescoStatus('done'), 1300);
  };

  const value = useMemo(
    () => ({
      mealPlan,
      shuffleDay,
      shoppingChecked,
      toggleShoppingItem,
      tescoConnected,
      tescoConnecting,
      connectTesco,
      tescoStatus,
      addToTescoBasket,
    }),
    [mealPlan, shoppingChecked, tescoConnected, tescoConnecting, tescoStatus],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan must be used within a MealPlanProvider');
  return ctx;
}
