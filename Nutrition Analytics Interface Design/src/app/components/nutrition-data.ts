// Clinical food database — macro data per 100g
export interface FoodItem {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const FOODS: FoodItem[] = [
  { id: "avena", name: "Avena", category: "Grano / Carb", kcal: 389, protein: 16.9, carbs: 66.3, fats: 6.9 },
  { id: "arroz", name: "Arroz", category: "Grano / Carb", kcal: 360, protein: 6.6, carbs: 79.3, fats: 0.6 },
  { id: "pollo", name: "Pechuga de Pollo", category: "Proteína magra", kcal: 165, protein: 31.0, carbs: 0.0, fats: 3.6 },
  { id: "huevo", name: "Huevo", category: "Proteína / Grasa", kcal: 155, protein: 13.0, carbs: 1.1, fats: 11.0 },
  { id: "aguacate", name: "Aguacate", category: "Grasa saludable", kcal: 160, protein: 2.0, carbs: 8.5, fats: 14.7 },
  { id: "almendras", name: "Almendras", category: "Grasa / Fibra", kcal: 579, protein: 21.2, carbs: 21.6, fats: 49.9 },
];

export interface MealPhase {
  id: string;
  name: string;
  phase: string;
  pct: number;
  protein: number; // target grams
  carbs: number;
  fats: number;
  fillProtein: number; // logged grams
  fillCarbs: number;
  fillFats: number;
}

export const MEALS: MealPhase[] = [
  { id: "breakfast", name: "Breakfast", phase: "Cortisol Mitigation Phase", pct: 35, protein: 65, carbs: 88, fats: 24, fillProtein: 58, fillCarbs: 72, fillFats: 20 },
  { id: "lunch", name: "Lunch", phase: "Sustained Glycemic Phase", pct: 30, protein: 56, carbs: 75, fats: 20, fillProtein: 40, fillCarbs: 55, fillFats: 14 },
  { id: "postworkout", name: "Post-Workout", phase: "Anabolic Uptake Window", pct: 15, protein: 28, carbs: 38, fats: 6, fillProtein: 12, fillCarbs: 20, fillFats: 2 },
  { id: "dinner", name: "Dinner", phase: "Overnight Recovery Phase", pct: 20, protein: 37, carbs: 50, fats: 14, fillProtein: 0, fillCarbs: 0, fillFats: 0 },
];

export const BUDGET = { total: 2500, remaining: 850 };
