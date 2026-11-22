// ─────────────────────────────────────────────────────────────────────────────
// ASIGNADOR AUTÓNOMO DE MACRONUTRIENTES (Guías ISSN) Y DESCUENTO CALÓRICO
// Deriva déficit/superávit automáticamente desde objetivo + adiposidad basal,
// calcula proteína (1.4–2.0 g/kg base vs 2.3–3.1 g/kg FFM en déficit magro),
// protege el piso lipídico y glucídico vía Escudo Endocrino y descuenta WPI/O3.
// ─────────────────────────────────────────────────────────────────────────────

import type { BiologicalSex } from "./bmrEngine";
import {
  LIPID_FLOOR_MULTIPLIER,
  evaluateEndocrineShield,
  type EndocrineShieldResult,
} from "./endocrineShield";

export type TrainingGoal = "fat_loss" | "recomp" | "muscle_gain" | "general_health";
export type TrainingSchedule = "morning" | "afternoon" | "evening";
export type TrainingEnvironment = "home_bodyweight" | "home_bands_dumbbells" | "gym";

export interface GoalCaloricPlanInput {
  goal: TrainingGoal;
  tdee: number;
  weightKg: number;
  bodyFatPct: number | null | undefined;
  sex: BiologicalSex;
  isSleepProtectionActive: boolean;
  manualDeficitOverride?: number;
}

export interface GoalCaloricPlanResult {
  isLeanUser: boolean;
  weeklyLossRateDecimal: number;
  rawDeficitTarget: number;
  effectiveDeficitTarget: number;
  targetCalories: number;
  caloricCutPausedBySleep: boolean;
}

export interface SupplementMacroDeductions {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  activeItems: string[];
}

export interface MacroAllocationDistribution {
  mealsPerDay: number;
  intervalHours: string;
  proteinPerMealMinG: number;
  proteinPerMealMaxG: number;
  preSleepProteinNote: string | null;
}

export interface MacroAllocationInput {
  goal: TrainingGoal;
  tdee: number;
  weightKg: number;
  ffm: number;
  safeFFM: number;
  bodyFatPct: number | null | undefined;
  sex: BiologicalSex;
  trainingDaysPerWeek: number;
  trainingSchedule: TrainingSchedule;
  activityFactor: number;
  exerciseCalories: number;
  cnsReadiness?: number;
  sustainedLowEADays?: number;
  hasPerformanceDrop?: boolean;
  isSleepProtectionActive: boolean;
  labSuppressed?: boolean;
  manualDeficitOverride?: number;
  proteinMultiplierOverride?: number;
  fatMultiplierOverride?: number;
  supplementChecklist?: Record<string, boolean>;
  customSupplementDose?: Record<string, { doseOverride?: string }>;
}

export interface MacroAllocationResult {
  goalPlan: GoalCaloricPlanResult;
  targetCalories: number;
  totalMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  foodTargetMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  supplementDeductions: SupplementMacroDeductions;
  proteinBasis: string;
  effectiveProteinMultiplier: number;
  effectiveFatMultiplier: number;
  distribution: MacroAllocationDistribution;
  shield: EndocrineShieldResult;
}

function parseOverrideGrams(raw: string | undefined, defaultGrams: number): number {
  if (!raw) return defaultGrams;
  const match = raw.replace(",", ".").match(/(\d+(\.\d+)?)/);
  if (!match) return defaultGrams;
  const parsed = parseFloat(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultGrams;
}

/**
 * Deriva déficit/superávit objetivo desde la meta y adiposidad basal,
 * aplicando tasas más conservadoras en usuarios magros y respetando la Regla de Sueño.
 */
export function deriveGoalCaloricPlan(
  input: GoalCaloricPlanInput
): GoalCaloricPlanResult {
  const {
    goal,
    tdee,
    weightKg,
    bodyFatPct,
    sex,
    isSleepProtectionActive,
    manualDeficitOverride,
  } = input;

  const validTdee = Number.isFinite(tdee) && tdee > 800 ? tdee : 2000;
  const validWeight = Number.isFinite(weightKg) && weightKg > 20 ? weightKg : 70;

  const hasReliableBodyFat =
    typeof bodyFatPct === "number" && Number.isFinite(bodyFatPct) && bodyFatPct >= 3;
  const isLeanUser = hasReliableBodyFat
    ? sex === "female"
      ? (bodyFatPct as number) <= 22
      : (bodyFatPct as number) <= 14
    : false;

  let weeklyLossRateDecimal = 0;
  let rawDeficitTarget = 0;

  if (
    typeof manualDeficitOverride === "number" &&
    Number.isFinite(manualDeficitOverride)
  ) {
    rawDeficitTarget = Math.round(manualDeficitOverride);
    weeklyLossRateDecimal =
      rawDeficitTarget > 0
        ? Math.min(0.02, Number(((rawDeficitTarget * 7) / (validWeight * 7700)).toFixed(4)))
        : 0;
  } else {
    switch (goal) {
      case "fat_loss":
        if (isLeanUser) {
          weeklyLossRateDecimal = 0.005; // 0.5%/sem conservador en usuarios magros
          rawDeficitTarget = Math.min(400, Math.round(validTdee * 0.15));
        } else {
          weeklyLossRateDecimal = 0.0085; // 0.85%/sem sostenible
          rawDeficitTarget = Math.min(550, Math.round(validTdee * 0.2));
        }
        break;
      case "recomp":
        if (isLeanUser) {
          weeklyLossRateDecimal = 0;
          rawDeficitTarget = 0;
        } else {
          weeklyLossRateDecimal = 0.002;
          rawDeficitTarget = Math.min(180, Math.round(validTdee * 0.06));
        }
        break;
      case "muscle_gain":
        weeklyLossRateDecimal = 0;
        rawDeficitTarget = -250; // Superávit controlado de +250 kcal
        break;
      case "general_health":
      default:
        weeklyLossRateDecimal = 0;
        rawDeficitTarget = 0;
        break;
    }
  }

  let effectiveDeficitTarget = rawDeficitTarget;
  let caloricCutPausedBySleep = false;

  // Regla de Protección por Sueño: pausa recortes si >=3 noches < 6.5h
  if (isSleepProtectionActive && effectiveDeficitTarget > 0) {
    effectiveDeficitTarget = 0;
    caloricCutPausedBySleep = true;
  }

  const targetCalories = Math.max(1200, Math.round(validTdee - effectiveDeficitTarget));

  return {
    isLeanUser,
    weeklyLossRateDecimal,
    rawDeficitTarget,
    effectiveDeficitTarget,
    targetCalories,
    caloricCutPausedBySleep,
  };
}

/**
 * Calcula descuento automático de macros por suplementos calóricos activos (Whey y Omega-3).
 */
export function calculateSupplementMacroDeductions(
  supplementChecklist: Record<string, boolean> = {},
  customSupplementDose: Record<string, { doseOverride?: string }> = {}
): SupplementMacroDeductions {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  const activeItems: string[] = [];

  if (supplementChecklist?.wpi) {
    const grams = parseOverrideGrams(customSupplementDose?.wpi?.doseOverride, 30);
    const scale = grams / 30;
    const p = Math.round(25 * scale);
    const c = Number((1.5 * scale).toFixed(1));
    const f = Number((0.5 * scale).toFixed(1));
    protein += p;
    carbs += c;
    fat += f;
    calories += Math.round(p * 4 + c * 4 + f * 9);
    activeItems.push(`Suero WPI (${grams}g)`);
  }

  if (supplementChecklist?.o3) {
    const grams = parseOverrideGrams(customSupplementDose?.o3?.doseOverride, 2);
    const f = Number(grams.toFixed(1));
    fat += f;
    calories += Math.round(f * 9);
    activeItems.push(`Omega-3 (${grams}g)`);
  }

  return {
    calories,
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    activeItems,
  };
}

/**
 * Asignación autónoma completa de macronutrientes según guías ISSN,
 * Escudo Endocrino IOC 2023, distribución de tomas y descuento WPI/O3.
 */
export function allocateMacros(input: MacroAllocationInput): MacroAllocationResult {
  const {
    goal,
    tdee,
    weightKg,
    ffm,
    safeFFM,
    bodyFatPct,
    sex,
    trainingDaysPerWeek,
    trainingSchedule,
    activityFactor,
    exerciseCalories,
    cnsReadiness = 85,
    sustainedLowEADays = 0,
    hasPerformanceDrop = false,
    isSleepProtectionActive,
    labSuppressed = false,
    manualDeficitOverride,
    proteinMultiplierOverride,
    fatMultiplierOverride,
    supplementChecklist = {},
    customSupplementDose = {},
  } = input;

  const validWeight = Number.isFinite(weightKg) && weightKg > 20 ? weightKg : 70;

  const goalPlan = deriveGoalCaloricPlan({
    goal,
    tdee,
    weightKg: validWeight,
    bodyFatPct,
    sex,
    isSleepProtectionActive,
    manualDeficitOverride,
  });

  const isDeficit = goalPlan.effectiveDeficitTarget > 0;

  // 1. Proteína (ISSN): 1.4–2.0 g/kg en mantenimiento/superávit; 2.3–3.1 g/kg FFM en déficit magro
  let proteinGrams = 0;
  let proteinBasis = "Peso Corporal (ISSN 1.4–2.0 g/kg)";
  let effectiveProteinMultiplier = 1.8;

  if (
    typeof proteinMultiplierOverride === "number" &&
    Number.isFinite(proteinMultiplierOverride) &&
    proteinMultiplierOverride > 0.8
  ) {
    effectiveProteinMultiplier = Number(proteinMultiplierOverride.toFixed(2));
    proteinGrams = Math.round(validWeight * effectiveProteinMultiplier);
    proteinBasis = "Ajuste Manual";
  } else if (goalPlan.isLeanUser && isDeficit && trainingDaysPerWeek >= 2 && ffm > 0) {
    // Escala entre 2.3 y 3.1 g/kg FFM según severidad del déficit y días de fuerza
    const deficitIntensity = Math.min(1, goalPlan.effectiveDeficitTarget / 500);
    const rawFfmMult = 2.35 + deficitIntensity * 0.45 + (trainingDaysPerWeek >= 4 ? 0.15 : 0);
    effectiveProteinMultiplier = Number(Math.max(2.3, Math.min(3.1, rawFfmMult)).toFixed(2));
    proteinGrams = Math.round(ffm * effectiveProteinMultiplier);
    proteinBasis = "FFM (ISSN Déficit Magro 2.3–3.1 g/kg)";
  } else {
    let baseMult = 1.6;
    if (trainingDaysPerWeek >= 5 || goal === "recomp" || isDeficit) {
      baseMult = 2.0;
    } else if (trainingDaysPerWeek >= 3) {
      baseMult = 1.8;
    } else if (goal === "general_health") {
      baseMult = 1.5;
    }
    if (sex === "female" && baseMult > 1.8 && !isDeficit) {
      baseMult = 1.8;
    }
    effectiveProteinMultiplier = Number(Math.max(1.4, Math.min(2.0, baseMult)).toFixed(2));
    proteinGrams = Math.round(validWeight * effectiveProteinMultiplier);
    proteinBasis = "Peso Corporal (ISSN 1.4–2.0 g/kg)";
  }

  // 2. Grasas con piso mínimo hormonal innegociable de 0.6 g/kg/día
  let fatFactor = goal === "fat_loss" ? 0.75 : goal === "muscle_gain" ? 0.95 : 0.85;
  if (sex === "female" && fatFactor < 0.95) {
    fatFactor += 0.1;
  }
  if (
    typeof fatMultiplierOverride === "number" &&
    Number.isFinite(fatMultiplierOverride) &&
    fatMultiplierOverride > 0
  ) {
    fatFactor = fatMultiplierOverride;
  }
  const effectiveFatMultiplier = Number(Math.max(LIPID_FLOOR_MULTIPLIER, fatFactor).toFixed(2));
  const rawFatGrams = validWeight * effectiveFatMultiplier;

  // 3. Escudo Endocrino Adaptativo IOC 2023 (sin comprimir carbohidratos a 0g)
  const shield = evaluateEndocrineShield({
    targetCalories: goalPlan.targetCalories,
    exerciseCalories,
    weightKg: validWeight,
    ffm,
    safeFFM,
    sex,
    proteinGrams,
    fatGrams: rawFatGrams,
    trainingDaysPerWeek,
    activityFactor,
    cnsReadiness,
    sustainedLowEADays,
    hasPerformanceDrop,
    isSleepProtectionActive,
    labSuppressed,
  });

  const finalFatGrams = Math.round(shield.protectedFatGrams);
  const remainingForCarbs =
    shield.adjustedTargetCalories - proteinGrams * 4 - finalFatGrams * 9;
  const carbGrams = Math.max(
    shield.carbFloorGrams,
    Math.round(remainingForCarbs / 4)
  );

  const finalTargetCalories = Math.max(
    shield.adjustedTargetCalories,
    Math.round(proteinGrams * 4 + finalFatGrams * 9 + carbGrams * 4)
  );

  // 4. Descuento de suplementos calóricos activos (Whey / Omega-3) sobre metas de alimentos sólidos
  const supplementDeductions = calculateSupplementMacroDeductions(
    supplementChecklist,
    customSupplementDose
  );

  const totalMacros = {
    protein: proteinGrams,
    carbs: carbGrams,
    fat: finalFatGrams,
  };

  const foodTargetMacros = {
    protein: Math.max(0, proteinGrams - supplementDeductions.protein),
    carbs: Math.max(0, carbGrams - supplementDeductions.carbs),
    fat: Math.max(0, finalFatGrams - supplementDeductions.fat),
  };

  // 5. Reparto de tomas proteicas cada 3–4 h (20–40 g / 0.25–0.40 g/kg)
  const mealsPerDay = Math.max(
    3,
    Math.min(5, Math.round(proteinGrams / Math.max(25, Math.min(38, validWeight * 0.35))))
  );
  const proteinPerMealMinG = Math.max(20, Math.min(40, Math.round(validWeight * 0.25)));
  const proteinPerMealMaxG = Math.max(proteinPerMealMinG, Math.min(40, Math.round(validWeight * 0.4)));
  const preSleepProteinNote =
    trainingSchedule === "evening"
      ? "Entreno nocturno: sugiere toma pre-sueño de 30–40 g de proteína (digestión lenta) 30–45 min antes de dormir."
      : null;

  return {
    goalPlan,
    targetCalories: finalTargetCalories,
    totalMacros,
    foodTargetMacros,
    supplementDeductions,
    proteinBasis,
    effectiveProteinMultiplier,
    effectiveFatMultiplier,
    distribution: {
      mealsPerDay,
      intervalHours: "cada 3–4 h",
      proteinPerMealMinG,
      proteinPerMealMaxG,
      preSleepProteinNote,
    },
    shield,
  };
}
