// ─────────────────────────────────────────────────────────────────────────────
// MOTOR ADAPTATIVO DE TDEE, FILTRO EMA-20 Y AMORTIGUACIÓN HÍDRICA
// Incluye calibración transparente de 14–30 días, exclusión de registros
// parciales, preservación de TDEE ante huecos y modificador progresivo por pasos.
// ─────────────────────────────────────────────────────────────────────────────

export const EMA_ALPHA = 0.095; // Ventana efectiva ~20 días: 2 / (20 + 1) ≈ 0.095
export const KCAL_PER_KG_TISSUE = 7700;
export const CALIBRATION_MIN_PAIRED_DAYS = 14;
export const CALIBRATION_TARGET_DAYS = 30;
export const CREATINE_DAMPING_WINDOW_DAYS = 21;

export type AlgorithmStatus = "calibrating" | "updating";

export interface DailyTelemetryEntry {
  date: string; // YYYY-MM-DD
  weightKg?: number;
  caloriesIntake?: number;
  steps?: number;
  sleepHours?: number;
  isPartialLog?: boolean;
  isHighCarbRefeed?: boolean;
  isMenstrualRetention?: boolean;
  performanceDrop?: boolean;
}

export interface HydrationDampingContext {
  creatineActive: boolean;
  creatineActivatedAt?: number | null;
  isHighCarbRefeed?: boolean;
  isMenstrualRetention?: boolean;
  nowMs?: number;
}

export interface HydrationDampingResult {
  active: boolean;
  dampingFactor: number; // 1.0 = sin amortiguación, 0.25 = atenúa 75% la caída de TDEE
  reasons: string[];
}

export interface AdaptiveTdeeInput {
  weightLogs: number[];
  bmr: number;
  activityFactor: number;
  biasFactor: number;
  dailySteps?: number;
  dailyTelemetryLogs?: DailyTelemetryEntry[];
  lastHighConfidenceTdee?: number | null;
  lastHighConfidenceEntriesCount?: number;
  hydrationContext: HydrationDampingContext;
}

export interface AdaptiveTdeeResult {
  trendWeight: number;
  emaSeries: number[];
  baselineTdee: number;
  adaptiveTdee: number;
  lastHighConfidenceTdee: number;
  lastHighConfidenceEntriesCount: number;
  stepModifierKcal: number;
  algorithmStatus: AlgorithmStatus;
  algorithmStatusBadge: string;
  calibrationProgressPct: number;
  validWeightDays: number;
  validPairedDays: number;
  hydrationDamping: HydrationDampingResult;
}

/**
 * 1. Filtro pasa-bajas exponencial (EMA-20, alpha = 0.095) sobre el historial diario de peso.
 */
export function calculateEMA20(
  weightLogs: number[] = [],
  alpha: number = EMA_ALPHA
): { trendWeight: number; series: number[] } {
  const validWeights = (weightLogs || []).filter(
    (w) => typeof w === "number" && Number.isFinite(w) && w > 20 && w < 350
  );

  if (validWeights.length === 0) {
    return { trendWeight: 70, series: [70] };
  }

  const series: number[] = [Number(validWeights[0].toFixed(2))];
  let trend = validWeights[0];

  for (let i = 1; i < validWeights.length; i++) {
    trend = validWeights[i] * alpha + trend * (1 - alpha);
    series.push(Number(trend.toFixed(2)));
  }

  return {
    trendWeight: Number(trend.toFixed(2)),
    series,
  };
}

/**
 * 2. Modificador progresivo basado en pasos diarios (NEAT dinámico).
 * Ajusta respecto al nivel de pasos implícito del factor de actividad basal.
 */
export function calculateStepModifierKcal(
  dailySteps: number | undefined,
  weightKg: number,
  activityFactor: number
): number {
  if (typeof dailySteps !== "number" || !Number.isFinite(dailySteps) || dailySteps < 0) {
    return 0;
  }

  const validWeight = Number.isFinite(weightKg) && weightKg > 20 ? weightKg : 70;
  const rawBaselineSteps = 3500 + Math.max(0, (activityFactor || 1.4) - 1.2) * 11000;
  const baselineSteps = Math.round(Math.max(4000, Math.min(11000, rawBaselineSteps)));

  const deltaSteps = dailySteps - baselineSteps;
  const kcalPer1000Steps = 0.5 * validWeight;
  const rawModifier = Math.round((deltaSteps / 1000) * kcalPer1000Steps);

  return Math.max(-250, Math.min(450, rawModifier));
}

/**
 * 3. Amortiguación contra retención hídrica aguda:
 * Creatina (días 1-21 tras activación), refeed alto en carbohidratos o fase lútea/menstrual.
 */
export function evaluateHydrationDamping(
  ctx: HydrationDampingContext
): HydrationDampingResult {
  const reasons: string[] = [];
  const now = ctx.nowMs ?? Date.now();

  if (ctx.creatineActive) {
    if (ctx.creatineActivatedAt == null) {
      reasons.push("Retención hídrica intracelular por inicio de creatina");
    } else {
      const elapsedDays = (now - ctx.creatineActivatedAt) / (1000 * 60 * 60 * 24);
      if (elapsedDays >= 0 && elapsedDays <= CREATINE_DAMPING_WINDOW_DAYS) {
        reasons.push(
          `Saturación hídrica por creatina (día ${Math.max(1, Math.ceil(elapsedDays))}/21)`
        );
      }
    }
  }

  if (ctx.isHighCarbRefeed) {
    reasons.push("Refeed alto en carbohidratos (reposición glucógeno/agua)");
  }

  if (ctx.isMenstrualRetention) {
    reasons.push("Fase de retención hídrica menstrual");
  }

  const active = reasons.length > 0;
  return {
    active,
    dampingFactor: active ? 0.25 : 1.0,
    reasons,
  };
}

/**
 * 4. Cálculo del TDEE Adaptativo con manejo de huecos, exclusión de isPartialLog
 * y ventana de calibración transparente ('calibrating' -> 'updating').
 */
export function computeAdaptiveTdee(input: AdaptiveTdeeInput): AdaptiveTdeeResult {
  const {
    weightLogs,
    bmr,
    activityFactor,
    biasFactor,
    dailySteps,
    dailyTelemetryLogs = [],
    lastHighConfidenceTdee,
    lastHighConfidenceEntriesCount = 0,
    hydrationContext,
  } = input;

  // Excluir registros parciales de cualquier cálculo de regresión energética
  const nonPartialLogs = dailyTelemetryLogs.filter((entry) => !entry.isPartialLog);

  const nonPartialTelemetryWeights = nonPartialLogs
    .map((entry) => entry.weightKg)
    .filter((w): w is number => typeof w === "number" && Number.isFinite(w) && w > 20);

  // Fuente unificada de pesos diarios para EMA-20
  const combinedWeightStream =
    weightLogs && weightLogs.length >= nonPartialTelemetryWeights.length
      ? weightLogs
      : nonPartialTelemetryWeights;

  const { trendWeight, series: emaSeries } = calculateEMA20(combinedWeightStream, EMA_ALPHA);

  const validWeightDays = Math.max(
    (weightLogs || []).filter((w) => typeof w === "number" && Number.isFinite(w) && w > 20).length,
    nonPartialTelemetryWeights.length
  );

  // Días pareados completos (peso + calorías + no parcial)
  const pairedEntries = nonPartialLogs.filter(
    (entry) =>
      typeof entry.weightKg === "number" &&
      Number.isFinite(entry.weightKg) &&
      entry.weightKg > 20 &&
      typeof entry.caloriesIntake === "number" &&
      Number.isFinite(entry.caloriesIntake) &&
      entry.caloriesIntake > 400
  );

  const validPairedDays = pairedEntries.length;

  // Modificador de pasos (usa dailySteps directo o el último registro de telemetría con pasos)
  const latestTelemetrySteps = [...nonPartialLogs]
    .reverse()
    .find((entry) => typeof entry.steps === "number" && Number.isFinite(entry.steps))?.steps;
  const effectiveSteps = dailySteps ?? latestTelemetrySteps;
  const stepModifierKcal = calculateStepModifierKcal(effectiveSteps, trendWeight, activityFactor);

  const baselineTdee = Math.max(
    1000,
    Math.round(bmr * (activityFactor || 1.4) * (biasFactor || 1)) + stepModifierKcal
  );

  // Señales agudas de retención hídrica en los últimos 3 días de telemetría
  const recentTelemetry = nonPartialLogs.slice(-3);
  const telemetryHasRefeed = recentTelemetry.some((e) => e.isHighCarbRefeed);
  const telemetryHasMenstrual = recentTelemetry.some((e) => e.isMenstrualRetention);

  const hydrationDamping = evaluateHydrationDamping({
    ...hydrationContext,
    isHighCarbRefeed: hydrationContext.isHighCarbRefeed || telemetryHasRefeed,
    isMenstrualRetention: hydrationContext.isMenstrualRetention || telemetryHasMenstrual,
  });

  // Estado del algoritmo: 'calibrating' los primeros 14–30 días, 'updating' tras converger
  const hasConverged =
    validPairedDays >= CALIBRATION_MIN_PAIRED_DAYS ||
    validWeightDays >= CALIBRATION_TARGET_DAYS;

  const algorithmStatus: AlgorithmStatus = hasConverged ? "updating" : "calibrating";
  const algorithmStatusBadge = hasConverged
    ? "Actualizando TDEE"
    : "Calibrando algoritmo";

  const pairedProgress = validPairedDays / CALIBRATION_MIN_PAIRED_DAYS;
  const weightProgress = validWeightDays / CALIBRATION_TARGET_DAYS;
  const calibrationProgressPct = hasConverged
    ? 100
    : Math.min(99, Math.max(5, Math.round(Math.max(pairedProgress, weightProgress) * 100)));

  // Arrastrar último TDEE de alta confianza si existen huecos sin reiniciar historial
  const hasPreviousHighConfidence =
    typeof lastHighConfidenceTdee === "number" &&
    Number.isFinite(lastHighConfidenceTdee) &&
    lastHighConfidenceTdee >= 1000;

  const referenceTdee = hasPreviousHighConfidence
    ? Math.round(lastHighConfidenceTdee as number)
    : baselineTdee;

  let adaptiveTdee = referenceTdee;
  let updatedHighConfidenceTdee = referenceTdee;
  let updatedEntriesCount = lastHighConfidenceEntriesCount;

  if (
    hasConverged &&
    validPairedDays >= CALIBRATION_MIN_PAIRED_DAYS &&
    (validPairedDays > lastHighConfidenceEntriesCount || !hasPreviousHighConfidence)
  ) {
    // Regresión energética sobre los últimos hasta 28 días pareados no parciales
    const windowEntries = pairedEntries.slice(-28);
    const windowWeights = windowEntries.map((e) => e.weightKg as number);
    const { series: windowEma } = calculateEMA20(windowWeights, EMA_ALPHA);

    const startEma = windowEma[0];
    const endEma = windowEma[windowEma.length - 1];
    const spanDays = Math.max(CALIBRATION_MIN_PAIRED_DAYS - 1, windowEntries.length - 1);

    const avgIntake =
      windowEntries.reduce((acc, e) => acc + (e.caloriesIntake || 0), 0) /
      windowEntries.length;

    const deltaWeightKg = endEma - startEma;
    const rawEmpiricalTdee = avgIntake - (deltaWeightKg / spanDays) * KCAL_PER_KG_TISSUE;
    const boundedEmpirical = Math.max(1000, Math.min(5500, rawEmpiricalTdee));

    const rawDelta = boundedEmpirical - referenceTdee;

    // Si el algoritmo detecta caída de TDEE mientras hay retención hídrica aguda, atenúa el recorte
    const dampedDelta =
      rawDelta < 0 && hydrationDamping.active
        ? rawDelta * hydrationDamping.dampingFactor
        : rawDelta;

    const clampedStep = Math.max(-150, Math.min(150, dampedDelta));
    adaptiveTdee = Math.max(1000, Math.round(referenceTdee + clampedStep));
    updatedHighConfidenceTdee = adaptiveTdee;
    updatedEntriesCount = validPairedDays;
  } else if (hasConverged && !hasPreviousHighConfidence && validWeightDays >= CALIBRATION_TARGET_DAYS) {
    adaptiveTdee = baselineTdee;
    updatedHighConfidenceTdee = baselineTdee;
    updatedEntriesCount = Math.max(lastHighConfidenceEntriesCount, validPairedDays);
  } else if (!hasPreviousHighConfidence) {
    adaptiveTdee = baselineTdee;
    updatedHighConfidenceTdee = baselineTdee;
  }

  return {
    trendWeight,
    emaSeries,
    baselineTdee,
    adaptiveTdee,
    lastHighConfidenceTdee: updatedHighConfidenceTdee,
    lastHighConfidenceEntriesCount: updatedEntriesCount,
    stepModifierKcal,
    algorithmStatus,
    algorithmStatusBadge,
    calibrationProgressPct,
    validWeightDays,
    validPairedDays,
    hydrationDamping,
  };
}
