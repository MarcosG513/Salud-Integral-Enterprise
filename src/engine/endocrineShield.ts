// ─────────────────────────────────────────────────────────────────────────────
// ESCUDO ENDOCRINO ADAPTATIVO (Consenso IOC 2023 RED-S & Regla de Sueño)
// Reemplaza el hard-clamp destructivo de carbohidratos a 0g y el umbral
// universal de 30 kcal/kg FFM por protección diferenciada por sexo y exposición
// sostenida + protección simultánea de piso lipídico y disponibilidad de carbos.
// ─────────────────────────────────────────────────────────────────────────────

import type { BiologicalSex } from "./bmrEngine";

export const LIPID_FLOOR_MULTIPLIER = 0.6; // g/kg peso corporal (piso hormonal mínimo)
export const EA_THRESHOLD_MALE = 25; // kcal/kg FFM/día (Consenso IOC 2023 hombres)
export const EA_THRESHOLD_FEMALE = 30; // kcal/kg FFM/día (Consenso IOC 2023 mujeres)
export const LOW_CARB_AVAILABILITY_FLOOR_HIGH_LOAD = 3.0; // g/kg/día en carga alta
export const LOW_CARB_AVAILABILITY_FLOOR_BASE = 2.0; // g/kg/día piso mínimo general
export const SLEEP_DEFICIT_THRESHOLD_HOURS = 6.5;
export const SLEEP_DEFICIT_MIN_NIGHTS = 3;

export interface SleepProtectionResult {
  isSleepProtectionActive: boolean;
  poorSleepNightsCount: number;
  averageRecentSleep: number;
  priorityRecommendation: string | null;
}

export interface EndocrineShieldParams {
  targetCalories: number;
  exerciseCalories: number;
  weightKg: number;
  ffm: number;
  safeFFM: number;
  sex: BiologicalSex;
  proteinGrams: number;
  fatGrams: number;
  trainingDaysPerWeek: number;
  activityFactor: number;
  cnsReadiness?: number;
  sustainedLowEADays?: number;
  hasPerformanceDrop?: boolean;
  isSleepProtectionActive?: boolean;
  labSuppressed?: boolean;
}

export interface EndocrineShieldResult {
  energyAvailability: number;
  eaThreshold: number;
  isLowEAAcute: boolean;
  isShieldTriggered: boolean;
  isLipidFloorApplied: boolean;
  isCarbFloorApplied: boolean;
  fatFloorGrams: number;
  carbFloorGrams: number;
  protectedFatGrams: number;
  adjustedTargetCalories: number;
  calorieCorrectionAdded: number;
  recommendedVolumeReductionPct: number;
  advisoryMessage: string | null;
}

/**
 * Evalúa la Regla de Protección por Sueño:
 * Si >= 3 noches recientes registran < 6.5 h de sueño (o promedio crónico < 6.5 h),
 * pausa automáticamente nuevos recortes calóricos y prioriza recuperación.
 */
export function evaluateSleepProtection(
  recentSleepHours: number[] = [],
  averageSleepHours = 7.5
): SleepProtectionResult {
  const validLogs = (recentSleepHours || []).filter(
    (h) => typeof h === "number" && Number.isFinite(h) && h > 0 && h <= 16
  );

  const windowLogs = validLogs.slice(-7);
  let poorSleepNightsCount = windowLogs.filter(
    (h) => h < SLEEP_DEFICIT_THRESHOLD_HOURS
  ).length;

  const validAvg =
    typeof averageSleepHours === "number" && Number.isFinite(averageSleepHours) && averageSleepHours > 0
      ? averageSleepHours
      : 7.5;

  const averageRecentSleep =
    windowLogs.length > 0
      ? Number(
          (windowLogs.reduce((acc, h) => acc + h, 0) / windowLogs.length).toFixed(2)
        )
      : Number(validAvg.toFixed(2));

  // Si no hay suficientes logs diarios aún, pero el promedio reportado es < 6.5h, activar protección
  if (windowLogs.length < SLEEP_DEFICIT_MIN_NIGHTS && validAvg < SLEEP_DEFICIT_THRESHOLD_HOURS) {
    poorSleepNightsCount = SLEEP_DEFICIT_MIN_NIGHTS;
  }

  const isSleepProtectionActive = poorSleepNightsCount >= SLEEP_DEFICIT_MIN_NIGHTS;

  const priorityRecommendation = isSleepProtectionActive
    ? `Deuda de sueño detectada (${poorSleepNightsCount} noches < ${SLEEP_DEFICIT_THRESHOLD_HOURS} h · media ${averageRecentSleep} h): se pausan nuevos recortes calóricos. Prioriza 7.5–8.5 h de descanso y reduce estrés.`
    : null;

  return {
    isSleepProtectionActive,
    poorSleepNightsCount,
    averageRecentSleep,
    priorityRecommendation,
  };
}

/**
 * Evalúa el Escudo Endocrino Adaptativo (Consenso IOC 2023 RED-S).
 * Protege simultáneamente el piso lipídico (>= 0.6 g/kg) y un piso seguro de
 * carbohidratos (>= 2.0-3.0 g/kg). Nunca comprime los carbohidratos a 0g:
 * ante riesgo RED-S corrige elevando calorías o reduciendo volumen de entreno.
 */
export function evaluateEndocrineShield(
  params: EndocrineShieldParams
): EndocrineShieldResult {
  const {
    targetCalories,
    exerciseCalories,
    weightKg,
    ffm,
    safeFFM,
    sex,
    proteinGrams,
    fatGrams,
    trainingDaysPerWeek,
    activityFactor,
    cnsReadiness = 85,
    sustainedLowEADays = 0,
    hasPerformanceDrop = false,
    isSleepProtectionActive = false,
    labSuppressed = false,
  } = params;

  const validWeight = Number.isFinite(weightKg) && weightKg > 20 ? weightKg : 70;
  const eaThreshold = sex === "female" ? EA_THRESHOLD_FEMALE : EA_THRESHOLD_MALE;

  const rawEA = (targetCalories - (exerciseCalories || 0)) / (safeFFM > 0 ? safeFFM : 0.001);
  const energyAvailability = Number.isFinite(rawEA) ? Number(rawEA.toFixed(2)) : 0;

  const isLowEAAcute = ffm <= 0 || !Number.isFinite(rawEA) || energyAvailability < eaThreshold;

  // Disparo por exposición sostenida o caída de rendimiento/sueño/SNC/analítica, o déficit severo agudo
  const hasConcomitantRisk =
    sustainedLowEADays >= 5 ||
    hasPerformanceDrop ||
    isSleepProtectionActive ||
    cnsReadiness < 65 ||
    labSuppressed;

  const isShieldTriggered =
    ffm <= 0 ||
    !Number.isFinite(rawEA) ||
    energyAvailability < eaThreshold - 5 ||
    (isLowEAAcute && hasConcomitantRisk);

  // Piso lipídico innegociable (0.6 g/kg)
  const fatFloorGrams = Number((validWeight * LIPID_FLOOR_MULTIPLIER).toFixed(1));
  const isLipidFloorApplied = fatGrams < fatFloorGrams;
  const protectedFatGrams = Math.max(fatGrams, fatFloorGrams);

  // Piso seguro de carbohidratos (evita Low Carbohydrate Availability < 3 g/kg bajo carga alta)
  const isHighTrainingLoad =
    trainingDaysPerWeek >= 4 || exerciseCalories >= 400 || activityFactor >= 1.55;
  const carbMultiplier = isHighTrainingLoad
    ? LOW_CARB_AVAILABILITY_FLOOR_HIGH_LOAD
    : LOW_CARB_AVAILABILITY_FLOOR_BASE;
  const carbFloorGrams = Math.round(validWeight * carbMultiplier);

  // Calorías mínimas para sostener proteína + pisos simultáneos de grasa y carbohidratos
  const minCaloriesForFloors = Math.round(
    proteinGrams * 4 + protectedFatGrams * 9 + carbFloorGrams * 4
  );

  // Calorías mínimas para restaurar Disponibilidad Energética segura por sexo
  const eaRecoveryCalories = isShieldTriggered
    ? Math.round(eaThreshold * (safeFFM > 0 ? safeFFM : validWeight * 0.8) + (exerciseCalories || 0))
    : targetCalories;

  const adjustedTargetCalories = Math.max(
    targetCalories,
    minCaloriesForFloors,
    eaRecoveryCalories
  );

  const calorieCorrectionAdded = Math.max(0, Math.round(adjustedTargetCalories - targetCalories));
  const rawCarbsWithoutFloor = (targetCalories - proteinGrams * 4 - protectedFatGrams * 9) / 4;
  const isCarbFloorApplied = rawCarbsWithoutFloor < carbFloorGrams;

  const recommendedVolumeReductionPct = isShieldTriggered
    ? energyAvailability < eaThreshold - 5
      ? 35
      : 20
    : 0;

  let advisoryMessage: string | null = null;
  if (isShieldTriggered) {
    advisoryMessage = `Escudo Endocrino IOC 2023 activo (EA ${energyAvailability} < umbral ${eaThreshold} kcal/kg FFM): se compensó con +${calorieCorrectionAdded} kcal (protegiendo mínimo ${carbFloorGrams} g carbos y ${Math.round(fatFloorGrams)} g grasas) y se sugiere reducir volumen de entreno un ${recommendedVolumeReductionPct}%.`;
  } else if (isCarbFloorApplied || isLipidFloorApplied) {
    advisoryMessage = `Protección metabólica activa: ajuste de piso seguro (${carbFloorGrams} g carbohidratos / ${Math.round(fatFloorGrams)} g grasas) sin sacrificar disponibilidad glucídica ni salud hormonal.`;
  }

  return {
    energyAvailability,
    eaThreshold,
    isLowEAAcute,
    isShieldTriggered,
    isLipidFloorApplied,
    isCarbFloorApplied,
    fatFloorGrams,
    carbFloorGrams,
    protectedFatGrams,
    adjustedTargetCalories,
    calorieCorrectionAdded,
    recommendedVolumeReductionPct,
    advisoryMessage,
  };
}
