// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE TASA METABÓLICA BASAL (BMR) Y MASA LIBRE DE GRASA (FFM)
// Evidencia 2023-2026: Diferenciación Katch-McArdle vs. Cunningham (1980)
// y fallback determinista Mifflin-St Jeor cuando % grasa es opcional/ausente.
// ─────────────────────────────────────────────────────────────────────────────

export type BiologicalSex = "male" | "female";

export type BmrFormula = "KATCH_MCARDLE" | "CUNNINGHAM_1980" | "MIFFLIN_ST_JEOR";

export interface FfmResult {
  ffm: number;
  safeFFM: number;
  isBodyFatReliable: boolean;
  isEstimatedFFM: boolean;
}

export interface BmrParams {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  bodyFatPct: number | null | undefined;
  trainingDaysPerWeek?: number;
  activityFactor?: number;
  preferCunningham?: boolean;
}

export interface BmrResult {
  bmr: number;
  bmrMethod: string;
  formula: BmrFormula;
  ffm: number;
  safeFFM: number;
  isBodyFatReliable: boolean;
  isEstimatedFFM: boolean;
}

export interface BiasAdjustmentResult {
  adjustedTdee: number;
  biasFactor: number;
}

/**
 * Calcula la Masa Libre de Grasa (FFM) con blindaje contra divisiones por cero
 * y estimación conservadora de Boer cuando el % de grasa corporal es opcional (null).
 */
export function calculateSafeFFM(
  weightKg: number,
  bodyFatPct: number | null | undefined,
  heightCm: number,
  sex: BiologicalSex
): FfmResult {
  const validWeight = Number.isFinite(weightKg) && weightKg > 20 ? weightKg : 70;
  const validHeight = Number.isFinite(heightCm) && heightCm > 100 ? heightCm : 175;

  const isBodyFatReliable =
    typeof bodyFatPct === "number" &&
    Number.isFinite(bodyFatPct) &&
    bodyFatPct >= 3 &&
    bodyFatPct <= 60;

  let rawFfm: number;
  let isEstimatedFFM = false;

  if (isBodyFatReliable) {
    rawFfm = validWeight * (1 - (bodyFatPct as number) / 100);
  } else {
    isEstimatedFFM = true;
    const boerRaw =
      sex === "female"
        ? 0.252 * validWeight + 0.473 * validHeight - 48.3
        : 0.407 * validWeight + 0.267 * validHeight - 19.2;
    const minBound = 0.5 * validWeight;
    const maxBound = 0.92 * validWeight;
    rawFfm = Math.max(minBound, Math.min(maxBound, boerRaw));
  }

  const roundedFfm = Number(rawFfm.toFixed(2));
  const ffm = !Number.isFinite(roundedFfm) || roundedFfm <= 0 ? 0 : roundedFfm;
  const safeFFM = ffm > 0 ? ffm : 0.001;

  return {
    ffm,
    safeFFM,
    isBodyFatReliable,
    isEstimatedFFM,
  };
}

/**
 * Cascada BMR:
 * 1) Si existe % grasa fiable -> Cunningham (1980) [500 + 22 * FFM] para deportistas
 *    con alta carga (>=4 días y AF >=1.55) o Katch-McArdle [370 + 21.6 * FFM] para base.
 * 2) Si % grasa es null/inválido -> Fallback automático Mifflin-St Jeor.
 */
export function calculateBMR(params: BmrParams): BmrResult {
  const {
    weightKg,
    heightCm,
    age,
    sex,
    bodyFatPct,
    trainingDaysPerWeek = 3,
    activityFactor = 1.4,
    preferCunningham = false,
  } = params;

  const validWeight = Number.isFinite(weightKg) && weightKg > 20 ? weightKg : 70;
  const validHeight = Number.isFinite(heightCm) && heightCm > 100 ? heightCm : 175;
  const validAge = Number.isFinite(age) && age > 10 && age <= 110 ? age : 30;
  const normalizedSex: BiologicalSex = sex === "female" ? "female" : "male";

  const { ffm, safeFFM, isBodyFatReliable, isEstimatedFFM } = calculateSafeFFM(
    validWeight,
    bodyFatPct,
    validHeight,
    normalizedSex
  );

  let rawBmr = 0;
  let formula: BmrFormula = "MIFFLIN_ST_JEOR";
  let bmrMethod = "MIFFLIN-ST JEOR";

  if (isBodyFatReliable && ffm > 0) {
    const useCunningham =
      preferCunningham || (trainingDaysPerWeek >= 4 && activityFactor >= 1.55);

    if (useCunningham) {
      rawBmr = 500 + 22 * ffm;
      formula = "CUNNINGHAM_1980";
      bmrMethod = "CUNNINGHAM (1980)";
    } else {
      rawBmr = 370 + 21.6 * ffm;
      formula = "KATCH_MCARDLE";
      bmrMethod = "KATCH-MCARDLE";
    }
  } else {
    const sexOffset = normalizedSex === "male" ? 5 : -161;
    rawBmr = 10 * validWeight + 6.25 * validHeight - 5 * validAge + sexOffset;
    formula = "MIFFLIN_ST_JEOR";
    bmrMethod = "MIFFLIN-ST JEOR";
  }

  const bmr = Math.max(800, Math.round(Number.isFinite(rawBmr) ? rawBmr : 1600));

  return {
    bmr,
    bmrMethod,
    formula,
    ffm,
    safeFFM,
    isBodyFatReliable,
    isEstimatedFFM,
  };
}

/**
 * Sesgo inicial del gasto según tasa semanal de pérdida objetivo:
 * TDEE_ajustado = TDEE_bruto * (1 - 4 * tasaSemanalDecimal)
 * Ejemplo: 1% semanal (0.01) => factor 0.96 (-4% de amortiguación adaptativa inicial).
 */
export function applyInitialExpenditureBias(
  rawTdee: number,
  weeklyWeightLossRateDecimal: number
): BiasAdjustmentResult {
  const safeTdee = Number.isFinite(rawTdee) && rawTdee > 0 ? rawTdee : 1800;
  const clampedRate = Math.max(
    0,
    Math.min(
      0.03,
      Number.isFinite(weeklyWeightLossRateDecimal) ? weeklyWeightLossRateDecimal : 0
    )
  );
  const biasFactor = Number((1 - 4 * clampedRate).toFixed(4));
  const adjustedTdee = Math.round(safeTdee * biasFactor);

  return {
    adjustedTdee,
    biasFactor,
  };
}
