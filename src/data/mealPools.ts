export interface MealOption {
  title: string;
  toddlerAdapt: string;
  ingredients: [name: string, category: string][];
}

export const mealPools = {
  breakfast: [
    { title: 'Porridge with banana & cinnamon', toddlerAdapt: 'Toddler: mash banana in, serve warm', ingredients: [['Porridge oats', 'Pantry'], ['Banana', 'Produce'], ['Cinnamon', 'Pantry'], ['Milk', 'Dairy & Eggs']] },
    { title: 'Scrambled eggs & wholemeal toast', toddlerAdapt: 'Toddler: cut toast into soldiers', ingredients: [['Eggs', 'Dairy & Eggs'], ['Wholemeal bread', 'Bakery'], ['Butter', 'Dairy & Eggs']] },
    { title: 'Greek yogurt with berries & granola', toddlerAdapt: 'Toddler: crush granola, quarter berries', ingredients: [['Greek yogurt', 'Dairy & Eggs'], ['Mixed berries', 'Produce'], ['Granola', 'Pantry']] },
    { title: 'Pancakes with stewed apple', toddlerAdapt: 'Toddler: cut into strips, no syrup', ingredients: [['Flour', 'Pantry'], ['Eggs', 'Dairy & Eggs'], ['Milk', 'Dairy & Eggs'], ['Apples', 'Produce']] },
    { title: 'Avocado toast with soft-boiled egg', toddlerAdapt: 'Toddler: mash avocado, small egg pieces', ingredients: [['Avocado', 'Produce'], ['Sourdough bread', 'Bakery'], ['Eggs', 'Dairy & Eggs']] },
  ],
  lunch: [
    { title: 'Veggie pasta with hidden-veg sauce', toddlerAdapt: 'Toddler: extra-soft pasta shapes', ingredients: [['Pasta', 'Pantry'], ['Tomato sauce', 'Pantry'], ['Carrots', 'Produce'], ['Courgette', 'Produce']] },
    { title: 'Chicken & sweet potato traybake', toddlerAdapt: 'Toddler: shred chicken, mash sweet potato', ingredients: [['Chicken thighs', 'Meat & Fish'], ['Sweet potato', 'Produce'], ['Olive oil', 'Pantry']] },
    { title: 'Lentil soup with soft bread', toddlerAdapt: 'Toddler: blend smoother, cool before serving', ingredients: [['Red lentils', 'Pantry'], ['Carrots', 'Produce'], ['Onion', 'Produce'], ['Bread', 'Bakery']] },
    { title: 'Fish fingers with peas & mash', toddlerAdapt: 'Toddler: check for bones, mash peas', ingredients: [['Fish fingers', 'Meat & Fish'], ['Peas', 'Produce'], ['Potatoes', 'Produce']] },
    { title: 'Quesadillas with black beans', toddlerAdapt: 'Toddler: cut into small triangles', ingredients: [['Tortillas', 'Bakery'], ['Black beans', 'Pantry'], ['Cheddar cheese', 'Dairy & Eggs']] },
  ],
  dinner: [
    { title: 'Salmon, rice & steamed broccoli', toddlerAdapt: 'Toddler: flake salmon, soften broccoli', ingredients: [['Salmon fillets', 'Meat & Fish'], ['Rice', 'Pantry'], ['Broccoli', 'Produce']] },
    { title: 'Beef mince cottage pie', toddlerAdapt: 'Toddler: cool well, small spoonfuls', ingredients: [['Beef mince', 'Meat & Fish'], ['Potatoes', 'Produce'], ['Carrots', 'Produce'], ['Onion', 'Produce']] },
    { title: 'Chicken stir-fry with soft noodles', toddlerAdapt: 'Toddler: no chilli, cut noodles shorter', ingredients: [['Chicken breast', 'Meat & Fish'], ['Noodles', 'Pantry'], ['Stir-fry vegetables', 'Produce'], ['Soy sauce', 'Pantry']] },
    { title: 'Veggie chilli with rice', toddlerAdapt: 'Toddler: mild portion, no chilli spice', ingredients: [['Kidney beans', 'Pantry'], ['Rice', 'Pantry'], ['Tomatoes', 'Produce'], ['Onion', 'Produce']] },
    { title: 'Roast chicken with root vegetables', toddlerAdapt: 'Toddler: shred chicken, mash veg', ingredients: [['Whole chicken', 'Meat & Fish'], ['Potatoes', 'Produce'], ['Carrots', 'Produce'], ['Parsnips', 'Produce']] },
  ],
} satisfies Record<'breakfast' | 'lunch' | 'dinner', MealOption[]>;

export type MealSlot = keyof typeof mealPools;

export interface MealPlanDay {
  day: string;
  b: number;
  l: number;
  d: number;
}

export const initialMealPlan: MealPlanDay[] = [
  { day: 'Monday', b: 0, l: 0, d: 0 },
  { day: 'Tuesday', b: 1, l: 1, d: 1 },
  { day: 'Wednesday', b: 2, l: 2, d: 2 },
  { day: 'Thursday', b: 3, l: 3, d: 3 },
  { day: 'Friday', b: 4, l: 4, d: 4 },
  { day: 'Saturday', b: 0, l: 2, d: 4 },
  { day: 'Sunday', b: 1, l: 3, d: 0 },
];
