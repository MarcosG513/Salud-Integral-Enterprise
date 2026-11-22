// ─────────────────────────────────────────────────────────────────────────────
// FACHADA UNIFICADA DE CÁLCULO CLÍNICO & FISIOLOGÍA METABÓLICA
// Salud Integral Enterprise V6.0 — Orquesta módulos desacoplados en src/engine/
// ─────────────────────────────────────────────────────────────────────────────

import {
  calculateBMR as computeBmrEngine,
  calculateSafeFFM,
  applyInitialExpenditureBias,
  type BiologicalSex,
  type BmrFormula,
} from "../engine/bmrEngine";
import {
  calculateEMA20 as computeEmaSeries,
  computeAdaptiveTdee,
  type AlgorithmStatus,
  type DailyTelemetryEntry,
} from "../engine/adaptiveTdee";
import {
  LIPID_FLOOR_MULTIPLIER,
  evaluateSleepProtection,
  evaluateEndocrineShield,
  type SleepProtectionResult,
  type EndocrineShieldResult,
} from "../engine/endocrineShield";
import {
  allocateMacros,
  deriveGoalCaloricPlan,
  type TrainingGoal,
  type TrainingSchedule,
  type MacroAllocationDistribution,
  type SupplementMacroDeductions,
} from "../engine/macroAllocator";

export { LIPID_FLOOR_MULTIPLIER };

export interface ClinicalMetricsOutput {
  trendWeight: number;
  ffm: number;
  isBodyFatEstimated: boolean;
  bmr: number;
  bmrMethod: string;
  bmrFormula: BmrFormula;
  tdee: number;
  baselineTdee: number;
  lastHighConfidenceTdee: number;
  lastHighConfidenceEntriesCount: number;
  initialBiasFactor: number;
  stepModifierKcal: number;
  algorithmStatus: AlgorithmStatus;
  algorithmStatusBadge: string;
  calibrationProgressPct: number;
  hydrationDampingActive: boolean;
  hydrationDampingReasons: string[];
  targetCalories: number;
  foodTargetCalories: number;
  effectiveDeficitTarget: number;
  caloricCutPausedBySleep: boolean;
  energyAvailability: number;
  isREDSTriggered: boolean;
  isHardClampActive: boolean;
  hydrationLiters: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
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
  macroDistribution: MacroAllocationDistribution;
  proteinBasis: string;
  sleepProtection: SleepProtectionResult;
  endocrineShield: EndocrineShieldResult;
  consumedMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  noxScore: number;
  doreyPercentage: number;
  training: {
    sets: string;
    intensity: string;
    isSNCOverrideActive: boolean;
    phaseName: string;
  };
}

/**
 * 1. Algoritmo de Suavizado de Tendencia de Peso (EMA-20 Window, alpha=0.095)
 */
export function calculateEMA20(weightLogs: number[] = [], alpha = 0.095): number {
  return computeEmaSeries(weightLogs, alpha).trendWeight;
}

/**
 * 2. Masa Libre de Grasa (FFM) con guard contra división por cero
 */
export function calculateFFM(
  trendWeight: number,
  bodyFat: number | null | undefined,
  height = 175,
  sex: BiologicalSex = "male"
): { ffm: number; safeFFM: number } {
  const { ffm, safeFFM } = calculateSafeFFM(trendWeight, bodyFat, height, sex);
  return { ffm, safeFFM };
}

/**
 * 3. Tasa Metabólica Basal (Cunningham 1980 / Katch-McArdle / Mifflin-St Jeor)
 */
export function calculateBMR(
  trendWeight: number,
  height: number,
  age: number,
  sex: BiologicalSex | string,
  bodyFat: number | null | undefined,
  _ffm?: number,
  trainingDaysPerWeek = 3,
  activityFactor = 1.4
): { bmr: number; bmrMethod: string; formula: BmrFormula } {
  const normalizedSex: BiologicalSex = sex === "female" ? "female" : "male";
  const res = computeBmrEngine({
    weightKg: trendWeight,
    heightCm: height,
    age,
    sex: normalizedSex,
    bodyFatPct: bodyFat,
    trainingDaysPerWeek,
    activityFactor,
  });
  return { bmr: res.bmr, bmrMethod: res.bmrMethod, formula: res.formula };
}

/**
 * 4. Disponibilidad Energética (EA) y Evaluación RED-S (Consenso IOC 2023)
 */
export function calculateEnergyAvailability(
  targetCalories: number,
  exerciseCalories: number,
  safeFFM: number,
  ffm: number,
  sex: BiologicalSex = "male"
): { energyAvailability: number; isREDSTriggered: boolean } {
  const res = evaluateEndocrineShield({
    targetCalories,
    exerciseCalories,
    weightKg: ffm > 0 ? ffm * 1.15 : 70,
    ffm,
    safeFFM,
    sex,
    proteinGrams: 120,
    fatGrams: 50,
    trainingDaysPerWeek: 3,
    activityFactor: 1.4,
  });
  return {
    energyAvailability: res.energyAvailability,
    isREDSTriggered: res.isShieldTriggered,
  };
}

/**
 * 5. Índice de Óxido Nítrico Endotelial (NOx Index)
 */
export function calculateNOxScore(
  citrullineGrams: number = 0,
  citrullineTimingMin: number = 0
): number {
  let noxScore = 0;
  if (citrullineGrams >= 6 && citrullineGrams <= 8) noxScore += 60;
  else if (citrullineGrams > 0) noxScore += 30;

  if (citrullineTimingMin >= 30 && citrullineTimingMin <= 45) noxScore += 40;
  else if (citrullineTimingMin > 0) noxScore += 15;

  return noxScore;
}

/**
 * 6. Cumplimiento del Protocolo Dorey (Suelo Pélvico)
 */
export function calculateDoreyPercentage(doreySessionsPerWeek: number = 0): number {
  return Math.min(100, Math.round(((doreySessionsPerWeek || 0) / 4) * 100));
}

/**
 * 7. Landmarks de Volumen de Hipertrofia y Regulación
 */
export function calculateMesocycleLandmarks(
  mesocycleWeek: number = 1,
  cnsReadiness: number = 100,
  currentDeficitTarget: number = 0,
  shieldReductionPct: number = 0
) {
  const isCaloricDeficitActive = currentDeficitTarget > 0;
  const isSNCOverrideActive = cnsReadiness < 70 || shieldReductionPct > 0 || (isCaloricDeficitActive && cnsReadiness < 75);

  let hypertrophySetsText = "";
  let intensityTargetText = "";

  if (shieldReductionPct > 0) {
    hypertrophySetsText = `Reducción protectora -${shieldReductionPct}% volumen`;
    intensityTargetText = "RIR 2-3 (Escudo Endocrino)";
  } else {
    switch (mesocycleWeek) {
      case 1:
        hypertrophySetsText = "10 - 12 series semanales (MEV)";
        intensityTargetText = "RIR 2-3 (Carga base)";
        break;
      case 2:
        hypertrophySetsText = "12 - 16 series semanales (MAV-1)";
        intensityTargetText = "RIR 2 (Progresivo)";
        break;
      case 3:
      case 4:
        if (isSNCOverrideActive) {
          hypertrophySetsText = "10 - 14 series semanales (Control)";
          intensityTargetText = "RIR 2 (Protección por Recuperación)";
        } else {
          hypertrophySetsText =
            mesocycleWeek === 3
              ? "15 - 18 series semanales (MAV-2)"
              : "18 - 22 series semanales (MRV)";
          intensityTargetText = mesocycleWeek === 3 ? "RIR 1-2" : "RIR 0-2 (Aislamiento a 0)";
        }
        break;
      case 5:
        hypertrophySetsText = "4 - 8 series semanales (Mantenimiento)";
        intensityTargetText = "RIR 3-4 (Descarga Clínica)";
        break;
      default:
        hypertrophySetsText = "10 - 15 series semanales";
        intensityTargetText = "RIR 2";
    }
  }

  return {
    sets: hypertrophySetsText,
    intensity: intensityTargetText,
    isSNCOverrideActive,
    phaseName: mesocycleWeek === 5 ? "Descarga" : mesocycleWeek === 4 ? "MRV" : "Acumulación",
  };
}

function inferGoalFromLegacyDeficit(deficitTarget: number | undefined): TrainingGoal {
  if (typeof deficitTarget !== "number" || !Number.isFinite(deficitTarget)) return "fat_loss";
  if (deficitTarget >= 200) return "fat_loss";
  if (deficitTarget > 0) return "recomp";
  if (deficitTarget < 0) return "muscle_gain";
  return "general_health";
}

/**
 * Función Maestra: Calcula todas las métricas clínicas en un pase determinista
 */
export function computeClinicalMetrics(
  profile: any = {},
  foodLogs: any[] = [],
  supplementChecklist: Record<string, boolean> = {},
  customSupplementDose: Record<string, { doseOverride?: string }> = {},
  labSuppressed = false
): ClinicalMetricsOutput {
  const pesoFallback =
    typeof profile.peso === "number" && Number.isFinite(profile.peso) && profile.peso > 20
      ? profile.peso
      : 70;
  const weightLogs: number[] =
    Array.isArray(profile.weightLogs) && profile.weightLogs.length > 0
      ? profile.weightLogs
      : [pesoFallback];

  const rawBodyFat: number | null =
    profile.bodyFat === null
      ? null
      : typeof profile.bodyFat === "number" && Number.isFinite(profile.bodyFat)
      ? profile.bodyFat
      : null;

  const height = Number(profile.talla ?? profile.height ?? 175);
  const age = Number(profile.edad ?? profile.age ?? 30);
  const sex: BiologicalSex =
    (profile.sexoBiologico ?? profile.sex) === "female" ? "female" : "male";
  const activityFactor = Number(profile.nivelActividad ?? profile.activityFactor ?? 1.4);
  const trainingDaysPerWeek = Math.max(
    2,
    Number(profile.diasEntrenoSemana ?? profile.trainingFrequency ?? 4)
  );
  const goal: TrainingGoal =
    profile.objetivo ?? inferGoalFromLegacyDeficit(profile.deficitTarget);
  const trainingSchedule: TrainingSchedule = profile.horarioEntreno ?? "afternoon";

  const exerciseCalories = Number(profile.exerciseCalories ?? 350);
  const citrullineGrams = Number(profile.citrullineGrams ?? 8);
  const citrullineTimingMin = Number(profile.citrullineTimingMin ?? 35);
  const doreySessionsPerWeek = Number(profile.doreySessionsPerWeek ?? 0);
  const cnsReadiness = Number(profile.cnsReadiness ?? 85);
  const mesocycleWeek = Number(profile.mesocycleWeek ?? 1);

  const dailyTelemetryLogs: DailyTelemetryEntry[] = Array.isArray(profile.dailyTelemetryLogs)
    ? profile.dailyTelemetryLogs
    : [];

  const sleepLogs: number[] =
    Array.isArray(profile.sleepLogs) && profile.sleepLogs.length > 0
      ? profile.sleepLogs
      : dailyTelemetryLogs
          .map((d) => d.sleepHours)
          .filter((h): h is number => typeof h === "number" && Number.isFinite(h));

  const averageSleepHours = Number(profile.horasSuenoPromedio ?? 7.5);

  const manualDeficitOverride =
    profile.isDeficitManualOverride && typeof profile.deficitTarget === "number"
      ? profile.deficitTarget
      : undefined;

  const currentProteinMultiplier =
    profile.factorProteina !== undefined ? Number(profile.factorProteina) : undefined;
  const currentFatMultiplier =
    profile.factorGrasa !== undefined ? Number(profile.factorGrasa) : undefined;

  // 1. Regla de Protección por Sueño (>=3 noches < 6.5h pausa recortes)
  const sleepProtection = evaluateSleepProtection(sleepLogs, averageSleepHours);

  // 2. Tendencia de Peso EMA-20 preliminar para FFM & BMR
  const preliminaryTrendWeight = computeEmaSeries(weightLogs).trendWeight;

  // 3. Cascada BMR (Katch-McArdle / Cunningham 1980 / Fallback Mifflin-St Jeor)
  const bmrRes = computeBmrEngine({
    weightKg: preliminaryTrendWeight,
    heightCm: height,
    age,
    sex,
    bodyFatPct: rawBodyFat,
    trainingDaysPerWeek,
    activityFactor,
  });

  // 4. Sesgo Inicial del gasto energético según tasa semanal objetivo
  const rawEstimatedTdee = Math.round(bmrRes.bmr * activityFactor);
  const preliminaryPlan = deriveGoalCaloricPlan({
    goal,
    tdee: rawEstimatedTdee,
    weightKg: preliminaryTrendWeight,
    bodyFatPct: rawBodyFat,
    sex,
    isSleepProtectionActive: sleepProtection.isSleepProtectionActive,
    manualDeficitOverride,
  });
  const { biasFactor } = applyInitialExpenditureBias(
    rawEstimatedTdee,
    preliminaryPlan.weeklyLossRateDecimal
  );

  // 5. Motor Adaptativo de TDEE con amortiguación hídrica y pasos diarios
  const creatineActive = Boolean(supplementChecklist?.cre);
  const adaptive = computeAdaptiveTdee({
    weightLogs,
    bmr: bmrRes.bmr,
    activityFactor,
    biasFactor,
    dailySteps: profile.dailySteps,
    dailyTelemetryLogs,
    lastHighConfidenceTdee: profile.lastHighConfidenceTdee,
    lastHighConfidenceEntriesCount: profile.lastHighConfidenceEntriesCount ?? 0,
    hydrationContext: {
      creatineActive,
      creatineActivatedAt: profile.creatineActivatedAt,
      isHighCarbRefeed: Boolean(profile.isHighCarbRefeed),
      isMenstrualRetention: Boolean(profile.isMenstrualRetention),
    },
  });

  // 6. Señales de caída de rendimiento o baja disponibilidad sostenida
  const hasPerformanceDrop = dailyTelemetryLogs.slice(-3).some((d) => d.performanceDrop);
  const sustainedLowEADays = Number(profile.sustainedLowEADays ?? 0);

  // 7. Asignación de Macros (ISSN) + Escudo Endocrino IOC 2023 + Descuento WPI/O3
  const allocation = allocateMacros({
    goal,
    tdee: adaptive.adaptiveTdee,
    weightKg: adaptive.trendWeight,
    ffm: bmrRes.ffm,
    safeFFM: bmrRes.safeFFM,
    bodyFatPct: rawBodyFat,
    sex,
    trainingDaysPerWeek,
    trainingSchedule,
    activityFactor,
    exerciseCalories,
    cnsReadiness,
    sustainedLowEADays,
    hasPerformanceDrop,
    isSleepProtectionActive: sleepProtection.isSleepProtectionActive,
    labSuppressed,
    manualDeficitOverride,
    proteinMultiplierOverride: currentProteinMultiplier,
    fatMultiplierOverride: currentFatMultiplier,
    supplementChecklist,
    customSupplementDose,
  });

  const targetCalories = allocation.targetCalories;
  const foodTargetCalories = Math.max(
    0,
    targetCalories - allocation.supplementDeductions.calories
  );

  // 8. Hidratación Diaria Total
  const hydrationLiters = Number(
    (adaptive.trendWeight * 0.033 + Math.max(0, activityFactor - 1.0) * 1.5).toFixed(2)
  );

  // 9. Consumo real de Food Logs
  let consumedCalories = 0;
  let consumedProtein = 0;
  let consumedCarbs = 0;
  let consumedFat = 0;

  foodLogs.forEach((item: any) => {
    const factor = (item.grams || 100) / 100;
    consumedCalories += (item.kcal || 0) * factor;
    consumedProtein += (item.protein || 0) * factor;
    consumedCarbs += (item.carbs || 0) * factor;
    consumedFat += (item.fats || 0) * factor;
  });

  // 10. NOx Index & Dorey
  const noxScore = calculateNOxScore(citrullineGrams, citrullineTimingMin);
  const doreyPercentage = calculateDoreyPercentage(doreySessionsPerWeek);

  // 11. Landmarks del Mesociclo con respeto del Escudo Endocrino
  const training = calculateMesocycleLandmarks(
    mesocycleWeek,
    cnsReadiness,
    allocation.goalPlan.effectiveDeficitTarget,
    allocation.shield.recommendedVolumeReductionPct
  );

  return {
    trendWeight: adaptive.trendWeight,
    ffm: bmrRes.ffm,
    isBodyFatEstimated: bmrRes.isEstimatedFFM,
    bmr: bmrRes.bmr,
    bmrMethod: bmrRes.bmrMethod,
    bmrFormula: bmrRes.formula,
    tdee: adaptive.adaptiveTdee,
    baselineTdee: adaptive.baselineTdee,
    lastHighConfidenceTdee: adaptive.lastHighConfidenceTdee,
    lastHighConfidenceEntriesCount: adaptive.lastHighConfidenceEntriesCount,
    initialBiasFactor: biasFactor,
    stepModifierKcal: adaptive.stepModifierKcal,
    algorithmStatus: adaptive.algorithmStatus,
    algorithmStatusBadge: adaptive.algorithmStatusBadge,
    calibrationProgressPct: adaptive.calibrationProgressPct,
    hydrationDampingActive: adaptive.hydrationDamping.active,
    hydrationDampingReasons: adaptive.hydrationDamping.reasons,
    targetCalories,
    foodTargetCalories,
    effectiveDeficitTarget: allocation.goalPlan.effectiveDeficitTarget,
    caloricCutPausedBySleep: allocation.goalPlan.caloricCutPausedBySleep,
    energyAvailability: allocation.shield.energyAvailability,
    isREDSTriggered: allocation.shield.isShieldTriggered,
    isHardClampActive:
      allocation.shield.isLipidFloorApplied || allocation.shield.isCarbFloorApplied,
    hydrationLiters,
    macros: allocation.foodTargetMacros,
    totalMacros: allocation.totalMacros,
    foodTargetMacros: allocation.foodTargetMacros,
    supplementDeductions: allocation.supplementDeductions,
    macroDistribution: allocation.distribution,
    proteinBasis: allocation.proteinBasis,
    sleepProtection,
    endocrineShield: allocation.shield,
    consumedMacros: {
      calories: Math.round(consumedCalories),
      protein: Number(consumedProtein.toFixed(1)),
      carbs: Number(consumedCarbs.toFixed(1)),
      fat: Number(consumedFat.toFixed(1)),
    },
    noxScore,
    doreyPercentage,
    training,
  };
}
