// Base de datos de alimentos clínicos — macros por 100g
export interface FoodItem {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  emoji: string;
}

export const FOODS: FoodItem[] = [
  { id: "avena", name: "Avena", category: "Grano / Carbohidrato", kcal: 389, protein: 16.9, carbs: 66.3, fats: 6.9, emoji: "🥣" },
  { id: "arroz", name: "Arroz", category: "Grano / Carbohidrato", kcal: 360, protein: 6.6, carbs: 79.3, fats: 0.6, emoji: "🍚" },
  { id: "pollo", name: "Pechuga de Pollo", category: "Proteína magra", kcal: 165, protein: 31.0, carbs: 0.0, fats: 3.6, emoji: "🍗" },
  { id: "huevo", name: "Huevo Entero", category: "Proteína / Grasa", kcal: 155, protein: 13.0, carbs: 1.1, fats: 11.0, emoji: "🥚" },
  { id: "aguacate", name: "Aguacate", category: "Grasa saludable", kcal: 160, protein: 2.0, carbs: 8.5, fats: 14.7, emoji: "🥑" },
  { id: "almendras", name: "Almendras", category: "Grasa / Fibra", kcal: 579, protein: 21.2, carbs: 21.6, fats: 49.9, emoji: "🥜" },
  { id: "camote", name: "Camote / Batata", category: "Tubérculo / Carbohidrato", kcal: 86, protein: 1.6, carbs: 20.1, fats: 0.1, emoji: "🍠" },
  { id: "papa", name: "Papa Cocida", category: "Tubérculo / Carbohidrato", kcal: 87, protein: 1.9, carbs: 20.0, fats: 0.1, emoji: "🥔" },
  { id: "pasta_integral", name: "Pasta Integral", category: "Grano / Carbohidrato", kcal: 348, protein: 14.6, carbs: 75.0, fats: 1.5, emoji: "🍝" },
  { id: "quinoa", name: "Quinoa", category: "Grano / Carbohidrato", kcal: 368, protein: 14.1, carbs: 64.0, fats: 6.0, emoji: "🌾" },
  { id: "salmon", name: "Salmón", category: "Proteína / Grasa", kcal: 208, protein: 20.0, carbs: 0.0, fats: 13.0, emoji: "🐟" },
  { id: "atun", name: "Atún en Agua", category: "Proteína magra", kcal: 116, protein: 26.0, carbs: 0.0, fats: 1.0, emoji: "🐟" },
  { id: "res_magra", name: "Carne de Res Magra", category: "Proteína magra", kcal: 170, protein: 26.0, carbs: 0.0, fats: 7.0, emoji: "🥩" },
  { id: "cerdo_magro", name: "Lomo de Cerdo Magro", category: "Proteína magra", kcal: 143, protein: 26.0, carbs: 0.0, fats: 4.3, emoji: "🥩" },
  { id: "clara_huevo", name: "Clara de Huevo", category: "Proteína magra", kcal: 52, protein: 11.0, carbs: 0.7, fats: 0.2, emoji: "🥚" },
  { id: "pavo", name: "Pechuga de Pavo", category: "Proteína magra", kcal: 135, protein: 30.0, carbs: 0.0, fats: 1.5, emoji: "🦃" },
  { id: "cottage", name: "Queso Cottage", category: "Lácteo / Proteína", kcal: 98, protein: 11.0, carbs: 3.4, fats: 4.3, emoji: "🧀" },
  { id: "yogur_griego", name: "Yogur Griego 0%", category: "Lácteo / Proteína", kcal: 59, protein: 10.0, carbs: 3.6, fats: 0.4, emoji: "🥛" },
  { id: "lentejas", name: "Lentejas", category: "Legumbre / Carbohidrato", kcal: 353, protein: 25.0, carbs: 60.0, fats: 1.0, emoji: "🍲" },
  { id: "frijoles_negros", name: "Frijoles Negros", category: "Legumbre / Carbohidrato", kcal: 341, protein: 21.0, carbs: 62.0, fats: 1.4, emoji: "🍲" },
  { id: "nueces", name: "Nueces", category: "Grasa / Fibra", kcal: 654, protein: 15.2, carbs: 13.7, fats: 65.2, emoji: "🌰" },
  { id: "aceite_oliva", name: "Aceite de Oliva EV", category: "Grasa saludable", kcal: 884, protein: 0.0, carbs: 0.0, fats: 100.0, emoji: "🫒" },
  { id: "mantequilla_mani", name: "Mantequilla de Maní", category: "Grasa saludable", kcal: 588, protein: 25.0, carbs: 20.0, fats: 50.0, emoji: "🥜" },
  { id: "brocoli", name: "Brócoli", category: "Vegetal / Fibra", kcal: 34, protein: 2.8, carbs: 7.0, fats: 0.4, emoji: "🥦" },
  { id: "espinacas", name: "Espinacas", category: "Vegetal / Fibra", kcal: 23, protein: 2.9, carbs: 3.6, fats: 0.4, emoji: "🥬" },
  { id: "platano", name: "Plátano", category: "Fruta / Carbohidrato", kcal: 89, protein: 1.1, carbs: 22.8, fats: 0.3, emoji: "🍌" },
  { id: "manzana", name: "Manzana", category: "Fruta / Carbohidrato", kcal: 52, protein: 0.3, carbs: 13.8, fats: 0.2, emoji: "🍎" }
];

export interface MealPhase {
  id: string;
  name: string;
  phase: string;
  pct: number;
  protein: number;
  carbs: number;
  fats: number;
  fillProtein: number;
  fillCarbs: number;
  fillFats: number;
}

export const MEALS: MealPhase[] = [
  { id: "breakfast", name: "Desayuno", phase: "Fase de Mitigación de Cortisol", pct: 35, protein: 65, carbs: 88, fats: 24, fillProtein: 58, fillCarbs: 72, fillFats: 20 },
  { id: "lunch", name: "Almuerzo", phase: "Fase Glucémica Sostenida", pct: 30, protein: 56, carbs: 75, fats: 20, fillProtein: 40, fillCarbs: 55, fillFats: 14 },
  { id: "postworkout", name: "Post-Entrenamiento", phase: "Ventana de Absorción Anabólica", pct: 15, protein: 28, carbs: 38, fats: 6, fillProtein: 12, fillCarbs: 20, fillFats: 2 },
  { id: "dinner", name: "Cena", phase: "Fase de Recuperación Nocturna", pct: 20, protein: 37, carbs: 50, fats: 14, fillProtein: 0, fillCarbs: 0, fillFats: 0 },
];
