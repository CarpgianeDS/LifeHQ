import { mealPools } from './mealPools';
import type { MealPlanDay } from './mealPools';

export interface ShoppingItem {
  name: string;
  category: string;
  count: number;
}

export interface ShoppingGroup {
  category: string;
  items: ShoppingItem[];
}

const CATEGORY_ORDER = ['Produce', 'Dairy & Eggs', 'Meat & Fish', 'Bakery', 'Pantry'];

export function buildShoppingGroups(mealPlan: MealPlanDay[]): ShoppingGroup[] {
  const counts = new Map<string, ShoppingItem>();
  const order: string[] = [];

  for (const m of mealPlan) {
    const meals = [mealPools.breakfast[m.b], mealPools.lunch[m.l], mealPools.dinner[m.d]];
    for (const meal of meals) {
      for (const [name, category] of meal.ingredients) {
        const existing = counts.get(name);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(name, { name, category, count: 1 });
          order.push(name);
        }
      }
    }
  }

  return CATEGORY_ORDER.map((category) => ({
    category,
    items: order
      .filter((name) => counts.get(name)!.category === category)
      .map((name) => counts.get(name)!),
  })).filter((g) => g.items.length > 0);
}

export function countUnchecked(
  groups: ShoppingGroup[],
  shoppingChecked: Record<string, boolean>,
): number {
  return groups.reduce(
    (sum, g) => sum + g.items.filter((it) => !shoppingChecked[it.name]).length,
    0,
  );
}
