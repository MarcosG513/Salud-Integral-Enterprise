// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE ENTRENAMIENTO AGNÓSTICO CASA / GIMNASIO (GUÍAS ACSM 2026)
// Incluye conteo fraccionado 0.5x (Pelland 2026), Doble Progresión automática,
// Deloads Reactivos objetivos (MV: 4–8 series) y Regla de Entreno Concurrente.
// Integra directamente recommendedVolumeReductionPct y sleepProtection de Fase 1.
// ─────────────────────────────────────────────────────────────────────────────

import {
  TRAINING_EXERCISE_CATALOG,
  MUSCLE_LANDMARKS,
  type CatalogExercise,
  type MuscleId,
  type SvgCueKey,
} from "../data/training-catalog";
import type { SleepProtectionResult } from "./endocrineShield";
import type { TrainingEnvironment, TrainingGoal } from "./macroAllocator";
import type {
  TrainingModality,
  ExperienceLevel,
  ConcurrentCardioConfig,
  WorkoutHistoryEntry,
} from "../context/clinical-engine-context";

export interface AcsmPrescription {
  modality: TrainingModality;
  modalityLabel: string;
  loadSpectrumLabel: string;
  repMin: number;
  repMax: number;
  repRangeLabel: string;
  baseSetsPerExercise: number;
  weeklyMuscleMin: number;
  weeklyMuscleMax: number;
  compoundRirLabel: string;
  isolationRirLabel: string;
  targetRirMax: number;
  restSeconds: number;
  restLabel: string;
  techniqueNote: string;
}

export interface WarmupSet {
  setNumber: number;
  loadKg: number | null;
  reps: string;
  cue: string;
}

export interface DoubleProgressionAdvice {
  status: "ready_to_progress" | "maintaining" | "stalled";
  badgeText: string;
  recommendation: string;
  suggestedNextLoadKg?: number;
}

export interface PlannedExercise {
  id: string;
  name: string;
  pattern: string;
  isCompound: boolean;
  primaryMuscle: MuscleId;
  synergistMuscles: MuscleId[];
  sets: number;
  repMin: number;
  repMax: number;
  repRange: string;
  rirTarget: string;
  targetRir: number;
  loadKg: number;
  restSeconds: number;
  nextProgressionCue: string;
  svgCueKey: SvgCueKey;
  executionCue: string;
  warmupSets: WarmupSet[];
  progressionAdvice: DoubleProgressionAdvice;
  isCustom?: boolean;
}

export interface PlannedSessionDay {
  dayIndex: number;
  dayCode: string;
  focusLabel: string;
  exercises: PlannedExercise[];
}

export interface MuscleFractionalVolume {
  muscleId: MuscleId;
  name: string;
  directSets: number;
  synergistSets: number;
  totalFractionalSets: number;
  mev: number;
  mav: number;
  mrv: number;
  mvMin: number;
  mvMax: number;
  zoneLabel: "MV (Mantenimiento)" | "SUB-MEV" | "ACSM Óptimo (≥10)" | "AVANZADO (15–20+)" | "SOBRE-MRV";
}

export interface ReactiveDeloadResult {
  isReactiveDeloadActive: boolean;
  reasons: string[];
  maintenanceVolumeRange: string;
  stalledExercises: string[];
}

export interface ConcurrentTrainingGuidance {
  enabled: boolean;
  intensity: "low" | "high";
  hoursGap: number;
  isCompliant: boolean;
  headline: string;
  recommendation: string;
}

export interface TrainingPlanInput {
  entornoEntreno: TrainingEnvironment;
  diasEntrenoSemana: number;
  objetivo: TrainingGoal;
  modality: TrainingModality;
  experienceLevel: ExperienceLevel;
  mesocycleWeek: number;
  endocrineVolumeReductionPct: number;
  sleepProtection: SleepProtectionResult;
  workoutHistory: WorkoutHistoryEntry[];
  concurrentCardio: ConcurrentCardioConfig;
  loadOverrides?: Record<string, number>;
  customExercises?: CatalogExercise[];
}

export interface TrainingPlanOutput {
  environmentLabel: string;
  splitTitle: string;
  prescription: AcsmPrescription;
  sessions: PlannedSessionDay[];
  weeklyMuscleVolume: MuscleFractionalVolume[];
  reactiveDeload: ReactiveDeloadResult;
  concurrentGuidance: ConcurrentTrainingGuidance;
  appliedVolumeReductionPct: number;
  autoRegulationSummary: string;
}

/**
 * 1. Parámetros oficiales ACSM 2026 según modalidad y nivel de experiencia.
 */
export function getAcsm2026Prescription(
  modality: TrainingModality,
  experienceLevel: ExperienceLevel,
  environment: TrainingEnvironment
): AcsmPrescription {
  const isHomeLight = environment === "home_bodyweight";

  switch (modality) {
    case "strength":
      if (experienceLevel === "beginner") {
        return {
          modality,
          modalityLabel: "Fuerza Máxima (Principiante)",
          loadSpectrumLabel: "50–70% 1RM",
          repMin: 12,
          repMax: 15,
          repRangeLabel: "12–15",
          baseSetsPerExercise: 2,
          weeklyMuscleMin: 8,
          weeklyMuscleMax: 12,
          compoundRirLabel: "RIR 2–4",
          isolationRirLabel: "RIR 2–3",
          targetRirMax: 4,
          restSeconds: 180,
          restLabel: "3 min",
          techniqueNote: "Compuestos al inicio · Consolidación técnica en rango completo.",
        };
      }
      return {
        modality,
        modalityLabel: "Fuerza Máxima",
        loadSpectrumLabel: "≥80% 1RM",
        repMin: isHomeLight ? 5 : 1,
        repMax: isHomeLight ? 8 : 5,
        repRangeLabel: isHomeLight ? "5–8 (palanca exigente)" : "1–5",
        baseSetsPerExercise: 3,
        weeklyMuscleMin: 8,
        weeklyMuscleMax: 14,
        compoundRirLabel: "RIR 1–4",
        isolationRirLabel: "RIR 1–3",
        targetRirMax: 4,
        restSeconds: 240,
        restLabel: "3–5 min",
        techniqueNote: "Levantamientos compuestos principales al inicio · Descanso largo 3–5 min.",
      };

    case "power":
      return {
        modality,
        modalityLabel: "Potencia Explosiva",
        loadSpectrumLabel: "30–70% 1RM",
        repMin: 3,
        repMax: 5,
        repRangeLabel: "4×4–5 (≤24 reps totales)",
        baseSetsPerExercise: 4, // 4 * 5 = 20 <= 24 reps totales por ejercicio
        weeklyMuscleMin: 6,
        weeklyMuscleMax: 12,
        compoundRirLabel: "Vel. Máxima (RIR 3–5)",
        isolationRirLabel: "RIR 2–3",
        targetRirMax: 5,
        restSeconds: 180,
        restLabel: "3 min",
        techniqueNote: "Máxima intención de velocidad concéntrica sin acumular fatiga metabólica (series × reps ≤ 24).",
      };

    case "endurance":
      return {
        modality,
        modalityLabel: "Resistencia Muscular",
        loadSpectrumLabel: "40–60% 1RM",
        repMin: 15,
        repMax: 20,
        repRangeLabel: "15–20+",
        baseSetsPerExercise: 3,
        weeklyMuscleMin: 10,
        weeklyMuscleMax: 16,
        compoundRirLabel: "RIR 1–3",
        isolationRirLabel: "RIR 1–2",
        targetRirMax: 3,
        restSeconds: 45,
        restLabel: "30–60 s",
        techniqueNote: "Densidad metabólica controlada con descansos breves de 30–60 s.",
      };

    case "hypertrophy":
    default: {
      const weeklyMin =
        experienceLevel === "advanced" ? 20 : experienceLevel === "intermediate" ? 15 : 10;
      const weeklyMax =
        experienceLevel === "advanced" ? 24 : experienceLevel === "intermediate" ? 20 : 15;
      const repMin = environment === "gym" ? 8 : 10;
      const repMax = environment === "gym" ? 15 : 20;

      return {
        modality: "hypertrophy",
        modalityLabel: "Hipertrofia Estructural",
        loadSpectrumLabel: "30–100% 1RM (60–80% práctico)",
        repMin,
        repMax,
        repRangeLabel: `${repMin}–${repMax}`,
        baseSetsPerExercise: experienceLevel === "beginner" ? 3 : 4,
        weeklyMuscleMin: weeklyMin,
        weeklyMuscleMax: weeklyMax,
        compoundRirLabel: "RIR 1–3",
        isolationRirLabel: "RIR 0–2 (0 solo aislamiento)",
        targetRirMax: 3,
        restSeconds: 150,
        restLabel: "2–3 min",
        techniqueNote:
          "Rango completo y control excéntrico natural · Descanso 2–3 min (sin tempo rígido ni fallo obligatorio en compuestos).",
      };
    }
  }
}

/**
 * 2. Autogenerador de series de calentamiento progresivas por ejercicio.
 */
export function generateWarmupSets(
  workingLoadKg: number,
  isCompound: boolean,
  environment: TrainingEnvironment
): WarmupSet[] {
  if (workingLoadKg <= 0 || environment === "home_bodyweight") {
    return isCompound
      ? [
          { setNumber: 1, loadKg: null, reps: "10 reps", cue: "Movilidad articular + rango fluido sin fatiga" },
          { setNumber: 2, loadKg: null, reps: "6 reps", cue: "Activación submáxima en variante controlada" },
        ]
      : [{ setNumber: 1, loadKg: null, reps: "8–10 reps", cue: "Aproximación ligera de activación" }];
  }

  const roundLoad = (pct: number) => Math.max(2, Math.round((workingLoadKg * pct) / 0.5) * 0.5);

  if (!isCompound) {
    return [
      {
        setNumber: 1,
        loadKg: roundLoad(0.5),
        reps: "10 reps",
        cue: "50% de carga de trabajo · Conexión articular limpia",
      },
    ];
  }

  return [
    {
      setNumber: 1,
      loadKg: roundLoad(0.4),
      reps: "10 reps",
      cue: "40% · Lubricación articular y velocidad fluida",
    },
    {
      setNumber: 2,
      loadKg: roundLoad(0.65),
      reps: "6 reps",
      cue: "65% · Potenciación neuromuscular",
    },
    {
      setNumber: 3,
      loadKg: roundLoad(0.85),
      reps: "3 reps",
      cue: "85% · Aproximación sin acumular fatiga",
    },
  ];
}

/**
 * 3. Doble Progresión Automática por rango de reps y RIR objetivo.
 */
export function evaluateDoubleProgression(
  exercise: {
    id: string;
    name: string;
    sets: number;
    repMin: number;
    repMax: number;
    targetRir: number;
    loadKg: number;
    nextProgressionCue: string;
  },
  history: WorkoutHistoryEntry[]
): DoubleProgressionAdvice {
  const occurrences = (history || [])
    .map((session) =>
      session.exercises.find((e) => e.id === exercise.id || e.name === exercise.name)
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (occurrences.length === 0) {
    return {
      status: "maintaining",
      badgeText: "Progresión Base",
      recommendation:
        exercise.loadKg > 0
          ? `Completa todas las series en ${exercise.repMax} reps a RIR objetivo para subir +5–10% de carga.`
          : `Al alcanzar ${exercise.repMax} reps limpias en todas las series: ${exercise.nextProgressionCue}.`,
    };
  }

  const latest = occurrences[occurrences.length - 1];
  const prev = occurrences.length >= 2 ? occurrences[occurrences.length - 2] : null;

  const hitTopRange =
    latest.completedSetsCount >= Math.max(2, exercise.sets) &&
    latest.repsAchieved >= exercise.repMax &&
    latest.observedRir >= Math.max(0, exercise.targetRir - 1);

  if (hitTopRange) {
    if (exercise.loadKg > 0) {
      const incrementPct = exercise.loadKg >= 60 ? 0.05 : 0.075;
      const step = Math.max(1, Math.round((exercise.loadKg * incrementPct) / 0.5) * 0.5);
      const nextLoad = Number((exercise.loadKg + step).toFixed(1));
      return {
        status: "ready_to_progress",
        badgeText: `Subir a ${nextLoad} kg (+${Math.round(incrementPct * 100)}%)`,
        recommendation: `Techo del rango (${exercise.repMax} reps) alcanzado dentro de RIR. Incrementa a ${nextLoad} kg.`,
        suggestedNextLoadKg: nextLoad,
      };
    }

    return {
      status: "ready_to_progress",
      badgeText: "Escalar Variante / Banda",
      recommendation: `Techo alcanzado (${exercise.repMax} reps): ${exercise.nextProgressionCue}.`,
    };
  }

  if (
    prev &&
    latest.loadKg * latest.repsAchieved <= prev.loadKg * prev.repsAchieved &&
    latest.observedRir <= 1
  ) {
    return {
      status: "stalled",
      badgeText: "Meseta Detectada",
      recommendation:
        "Rendimiento estancado con esfuerzo alto. Prioriza técnica y recuperación antes de aumentar carga.",
    };
  }

  return {
    status: "maintaining",
    badgeText: "Acumulando Reps",
    recommendation: `Mantén la carga actual y busca añadir +1 rep por sesión hasta alcanzar ${exercise.repMax} reps.`,
  };
}

/**
 * 4. Deloads Reactivos objetivos (sin encuestas subjetivas de congestión/agujetas).
 * Analiza historial real de compuestos (2–3 sesiones), deuda de sueño y Escudo Endocrino.
 */
export function evaluateReactiveDeload(params: {
  workoutHistory: WorkoutHistoryEntry[];
  sleepProtection: SleepProtectionResult;
  endocrineVolumeReductionPct: number;
  mesocycleWeek: number;
}): ReactiveDeloadResult {
  const { workoutHistory, sleepProtection, endocrineVolumeReductionPct, mesocycleWeek } = params;

  const reasons: string[] = [];
  const stalledExercises: string[] = [];

  // Analizar caídas o estancamiento en los últimos levantamientos compuestos (2-3 sesiones)
  const compoundMap = new Map<
    string,
    { name: string; scores: number[]; rirs: number[] }
  >();

  (workoutHistory || []).slice(-12).forEach((session) => {
    session.exercises
      .filter((ex) => ex.isCompound)
      .forEach((ex) => {
        const key = ex.id;
        const score = (ex.loadKg > 0 ? ex.loadKg : 20) * Math.max(1, ex.repsAchieved);
        const existing = compoundMap.get(key) || { name: ex.name, scores: [], rirs: [] };
        existing.scores.push(score);
        existing.rirs.push(ex.observedRir);
        compoundMap.set(key, existing);
      });
  });

  compoundMap.forEach((entry) => {
    if (entry.scores.length >= 3) {
      const s = entry.scores.slice(-3);
      const r = entry.rirs.slice(-2);
      const isFlatOrRegressing = s[1] <= s[0] && s[2] <= s[1];
      const highFatigueRir = r.some((rir) => rir <= 1);
      if (isFlatOrRegressing && highFatigueRir) {
        stalledExercises.push(entry.name);
      }
    }
  });

  if (stalledExercises.length >= 2) {
    reasons.push(
      `Estancamiento objetivo durante 2–3 sesiones consecutivas en básicos (${stalledExercises.slice(0, 2).join(", ")}) con RIR exigido.`
    );
  }

  if (sleepProtection.isSleepProtectionActive) {
    reasons.push(
      `Deuda de sueño activa (${sleepProtection.poorSleepNightsCount} noches < 6.5 h): se reduce volumen preservando la intensidad mecánica.`
    );
  }

  if (endocrineVolumeReductionPct >= 25) {
    reasons.push(
      `Escudo Endocrino IOC 2023 activado (-${endocrineVolumeReductionPct}% volumen para restaurar disponibilidad energética).`
    );
  }

  const isScheduledWeek5 = mesocycleWeek === 5;
  if (isScheduledWeek5 && reasons.length === 0) {
    reasons.push("Semana 5 de descarga programada · Resensibilización a volumen de mantenimiento.");
  }

  const isReactiveDeloadActive =
    isScheduledWeek5 || stalledExercises.length >= 2 || endocrineVolumeReductionPct >= 25;

  return {
    isReactiveDeloadActive,
    reasons,
    maintenanceVolumeRange: "MV: 4–8 series/músculo/semana (cargas intactas)",
    stalledExercises,
  };
}

/**
 * 5. Regla de Entrenamiento Concurrente (Cardio + Fuerza el mismo día).
 */
export function evaluateConcurrentTrainingRule(
  cardio: ConcurrentCardioConfig
): ConcurrentTrainingGuidance {
  if (!cardio?.enabled) {
    return {
      enabled: false,
      intensity: "low",
      hoursGap: 0,
      isCompliant: true,
      headline: "Sin cardio concurrente en el mismo día",
      recommendation:
        "Si agregas cardio el mismo día: realiza fuerza tras cardio suave de baja intensidad, o separa cardio intenso >= 3 h con recarga glucídica.",
    };
  }

  if (cardio.intensity === "high") {
    const isCompliant = cardio.hoursGap >= 3;
    return {
      enabled: true,
      intensity: "high",
      hoursGap: cardio.hoursGap,
      isCompliant,
      headline: isCompliant
        ? `Cardio intenso separado (${cardio.hoursGap} h ≥ 3 h)`
        : `Alerta de interferencia: separación actual ${cardio.hoursGap} h (< 3 h)`,
      recommendation: isCompliant
        ? "Cumple separación mínima de >= 3 h. Incluye una comida rica en carbohidratos (40–60 g) entre ambas sesiones para reponer glucógeno."
        : "Separa el cardio intenso y la fuerza al menos >= 3 horas e ingiere una comida rica en carbohidratos entre sesiones para evitar interferencia sobre fuerza/hipertrofia.",
    };
  }

  return {
    enabled: true,
    intensity: "low",
    hoursGap: cardio.hoursGap,
    isCompliant: true,
    headline: "Cardio ligero compatible (Zona 1–2)",
    recommendation:
      "El entrenamiento de fuerza puede ejecutarse inmediatamente después de cardio ligero sin agotamiento de glucógeno ni penalización hipertrófica.",
  };
}

/**
 * 6. Conteo Fraccionado de Volumen Semanal (Pelland 2026: 1.0x agonista + 0.5x sinergistas).
 */
export function calculateFractionalWeeklyVolume(
  sessions: PlannedSessionDay[],
  isDeloadActive = false
): MuscleFractionalVolume[] {
  const directMap = new Map<MuscleId, number>();
  const synergistMap = new Map<MuscleId, number>();

  MUSCLE_LANDMARKS.forEach((m) => {
    directMap.set(m.id, 0);
    synergistMap.set(m.id, 0);
  });

  sessions.forEach((day) => {
    day.exercises.forEach((ex) => {
      directMap.set(ex.primaryMuscle, (directMap.get(ex.primaryMuscle) || 0) + ex.sets);
      ex.synergistMuscles.forEach((syn) => {
        synergistMap.set(syn, (synergistMap.get(syn) || 0) + ex.sets * 0.5);
      });
    });
  });

  return MUSCLE_LANDMARKS.map((m) => {
    const directSets = Number((directMap.get(m.id) || 0).toFixed(1));
    const synergistSets = Number((synergistMap.get(m.id) || 0).toFixed(1));
    const totalFractionalSets = Number((directSets + synergistSets).toFixed(1));

    let zoneLabel: MuscleFractionalVolume["zoneLabel"] = "ACSM Óptimo (≥10)";
    if (isDeloadActive) {
      zoneLabel = "MV (Mantenimiento)";
    } else if (totalFractionalSets > m.mrv) {
      zoneLabel = "SOBRE-MRV";
    } else if (totalFractionalSets >= 15) {
      zoneLabel = "AVANZADO (15–20+)";
    } else if (totalFractionalSets >= m.mev) {
      zoneLabel = "ACSM Óptimo (≥10)";
    } else {
      zoneLabel = "SUB-MEV";
    }

    return {
      muscleId: m.id,
      name: m.name,
      directSets,
      synergistSets,
      totalFractionalSets,
      mev: m.mev,
      mav: m.mav,
      mrv: m.mrv,
      mvMin: m.mvMin,
      mvMax: m.mvMax,
      zoneLabel,
    };
  });
}

function buildWeeklySplitTemplate(daysPerWeek: number): Array<{
  dayCode: string;
  focusLabel: string;
  slotOrder: Array<CatalogExercise["slotGroup"]>;
}> {
  const safeDays = Math.max(2, Math.min(6, Math.round(daysPerWeek || 4)));

  if (safeDays <= 3) {
    return Array.from({ length: safeDays }).map((_, i) => ({
      dayCode: `Día ${String.fromCharCode(65 + i)}`,
      focusLabel:
        i === 0
          ? "Cuerpo Completo A (Compuestos Base)"
          : i === 1
          ? "Cuerpo Completo B (Tracción & Bisagra)"
          : "Cuerpo Completo C (Hipertrofia Equilibrada)",
      slotOrder: ["upper_push", "upper_pull", "lower_knee", "lower_hip", "isolation"],
    }));
  }

  if (safeDays === 4) {
    return [
      {
        dayCode: "Día A",
        focusLabel: "Torso A · Empuje y Tracción Horizontal",
        slotOrder: ["upper_push", "upper_pull", "isolation"],
      },
      {
        dayCode: "Día B",
        focusLabel: "Pierna A · Rodilla Dominante y Core",
        slotOrder: ["lower_knee", "lower_hip", "isolation"],
      },
      {
        dayCode: "Día C",
        focusLabel: "Torso B · Hombro Vertical y Espalda",
        slotOrder: ["upper_pull", "upper_push", "isolation"],
      },
      {
        dayCode: "Día D",
        focusLabel: "Pierna B · Bisagra de Cadera y Unilateral",
        slotOrder: ["lower_hip", "lower_knee", "isolation"],
      },
    ];
  }

  // 5 o 6 días: Push / Pull / Legs / Upper / Lower
  const base5 = [
    {
      dayCode: "Día 1",
      focusLabel: "Empuje (Pecho, Hombro y Tríceps)",
      slotOrder: ["upper_push", "isolation"] as Array<CatalogExercise["slotGroup"]>,
    },
    {
      dayCode: "Día 2",
      focusLabel: "Tracción (Espalda, Posterior y Bíceps)",
      slotOrder: ["upper_pull", "isolation"] as Array<CatalogExercise["slotGroup"]>,
    },
    {
      dayCode: "Día 3",
      focusLabel: "Pierna Completa (Cuádriceps, Isquios y Core)",
      slotOrder: ["lower_knee", "lower_hip", "isolation"] as Array<CatalogExercise["slotGroup"]>,
    },
    {
      dayCode: "Día 4",
      focusLabel: "Torso Mixto (Frecuencia 2x ACSM)",
      slotOrder: ["upper_push", "upper_pull", "isolation"] as Array<CatalogExercise["slotGroup"]>,
    },
    {
      dayCode: "Día 5",
      focusLabel: "Pierna y Cadena Posterior (Frecuencia 2x)",
      slotOrder: ["lower_hip", "lower_knee", "isolation"] as Array<CatalogExercise["slotGroup"]>,
    },
  ];

  if (safeDays === 6) {
    base5.push({
      dayCode: "Día 6",
      focusLabel: "Accesorios y Aislamiento Estético",
      slotOrder: ["upper_pull", "isolation"],
    });
  }
  return base5;
}

/**
 * 7. Generador Maestro del Plan de Entrenamiento Casa / Gimnasio (ACSM 2026)
 * Integrado con Escudo Endocrino y Protección por Sueño (Fase 1).
 */
export function generateTrainingPlan(input: TrainingPlanInput): TrainingPlanOutput {
  const {
    entornoEntreno,
    diasEntrenoSemana,
    modality,
    experienceLevel,
    mesocycleWeek,
    endocrineVolumeReductionPct,
    sleepProtection,
    workoutHistory,
    concurrentCardio,
    loadOverrides = {},
    customExercises = [],
  } = input;

  const envLabelMap: Record<TrainingEnvironment, string> = {
    home_bodyweight: "Casa · Sin Equipo (Peso Corporal)",
    home_bands_dumbbells: "Casa · Bandas Elásticas y Mancuernas",
    gym: "Gimnasio · Equipamiento Completo",
  };

  const prescription = getAcsm2026Prescription(modality, experienceLevel, entornoEntreno);
  const reactiveDeload = evaluateReactiveDeload({
    workoutHistory,
    sleepProtection,
    endocrineVolumeReductionPct,
    mesocycleWeek,
  });
  const concurrentGuidance = evaluateConcurrentTrainingRule(concurrentCardio);

  // Reducción automática de volumen desde Fase 1 (Sueño + Escudo Endocrino) sin topes fijos de 3 series
  const sleepReductionPct = sleepProtection.isSleepProtectionActive ? 15 : 0;
  const appliedVolumeReductionPct = reactiveDeload.isReactiveDeloadActive
    ? 45
    : Math.max(endocrineVolumeReductionPct, sleepReductionPct);

  // Escalado de mesociclo gradual (S1: MEV -> S4: MAV/MRV) excepto si hay Deload Reactivo (MV 4-8)
  const weekFactor =
    mesocycleWeek === 1
      ? 0.8
      : mesocycleWeek === 2
      ? 0.95
      : mesocycleWeek === 3
      ? 1.05
      : mesocycleWeek === 4
      ? 1.15
      : 0.55;

  const effectiveVolumeMultiplier = reactiveDeload.isReactiveDeloadActive
    ? 0.5
    : Math.max(0.55, weekFactor * (1 - appliedVolumeReductionPct / 100));

  const envExercises = TRAINING_EXERCISE_CATALOG.filter(
    (ex) => ex.environment === entornoEntreno
  );

  const splitTemplate = buildWeeklySplitTemplate(diasEntrenoSemana);

  const sessions: PlannedSessionDay[] = splitTemplate.map((tpl, idx) => {
    const selected: CatalogExercise[] = [];
    const usedIds = new Set<string>();

    // Seleccionar primero compuestos y luego aislamiento según el orden del split
    tpl.slotOrder.forEach((slot) => {
      const candidates = envExercises.filter((e) => e.slotGroup === slot);
      // Alternar orden entre sesiones A/B para estimular distintos ángulos en frecuencia >=2x
      const orderedCandidates =
        idx % 2 === 1 && candidates.length > 1
          ? [...candidates.slice(1), candidates[0]]
          : candidates;

      const limit = slot === "isolation" ? 2 : 1;
      let added = 0;
      for (const cand of orderedCandidates) {
        if (!usedIds.has(cand.id) && added < limit) {
          selected.push(cand);
          usedIds.add(cand.id);
          added++;
        }
      }
    });

    // Garantizar estrictamente que todos los compuestos vayan al inicio de la sesión
    selected.sort((a, b) => Number(b.isCompound) - Number(a.isCompound));

    const allWithCustom =
      idx === 0 && customExercises.length > 0 ? [...selected, ...customExercises] : selected;

    const exercises: PlannedExercise[] = allWithCustom.map((catEx) => {
      const baseSets = catEx.isCompound
        ? prescription.baseSetsPerExercise
        : Math.max(2, prescription.baseSetsPerExercise - 1);

      let plannedSets: number;
      if (reactiveDeload.isReactiveDeloadActive) {
        // En descarga reactiva, bajar a MV (4-8 series/músculo/sem) manteniendo las cargas
        plannedSets = 2;
      } else {
        plannedSets = Math.max(2, Math.min(6, Math.round(baseSets * effectiveVolumeMultiplier)));
      }

      const loadKg =
        loadOverrides[catEx.id] !== undefined ? loadOverrides[catEx.id] : catEx.defaultLoadKg;

      // 0 RIR estrictamente reservado a ejercicios de aislamiento en semanas pico de hipertrofia
      const rirTarget = catEx.isCompound
        ? prescription.compoundRirLabel
        : mesocycleWeek >= 3 && modality === "hypertrophy" && !reactiveDeload.isReactiveDeloadActive
        ? "RIR 0–1 (Fallo seguro en aislamiento)"
        : prescription.isolationRirLabel;

      const targetRir = catEx.isCompound ? 2 : 1;

      const progressionAdvice = evaluateDoubleProgression(
        {
          id: catEx.id,
          name: catEx.name,
          sets: plannedSets,
          repMin: prescription.repMin,
          repMax: prescription.repMax,
          targetRir,
          loadKg,
          nextProgressionCue: catEx.nextProgressionCue,
        },
        workoutHistory
      );

      const warmupSets = generateWarmupSets(loadKg, catEx.isCompound, entornoEntreno);

      return {
        id: catEx.id,
        name: catEx.name,
        pattern: catEx.pattern,
        isCompound: catEx.isCompound,
        primaryMuscle: catEx.primaryMuscle,
        synergistMuscles: catEx.synergistMuscles,
        sets: plannedSets,
        repMin: prescription.repMin,
        repMax: prescription.repMax,
        repRange: prescription.repRangeLabel,
        rirTarget,
        targetRir,
        loadKg,
        restSeconds: prescription.restSeconds,
        nextProgressionCue: catEx.nextProgressionCue,
        svgCueKey: catEx.svgCueKey,
        executionCue: catEx.executionCue,
        warmupSets,
        progressionAdvice,
        isCustom: catEx.id.startsWith("custom-"),
      };
    });

    return {
      dayIndex: idx,
      dayCode: tpl.dayCode,
      focusLabel: tpl.focusLabel,
      exercises,
    };
  });

  const weeklyMuscleVolume = calculateFractionalWeeklyVolume(
    sessions,
    reactiveDeload.isReactiveDeloadActive
  );

  let autoRegulationSummary =
    "Carga nominal autorregulada (ACSM 2026 + conteo fraccionado Pelland 0.5x).";
  if (reactiveDeload.isReactiveDeloadActive) {
    autoRegulationSummary =
      "Deload Reactivo activo: volumen ajustado a Mantenimiento (MV 4–8 series/músculo/sem) preservando cargas de trabajo.";
  } else if (appliedVolumeReductionPct > 0) {
    autoRegulationSummary = `Volumen reducido automáticamente un -${appliedVolumeReductionPct}% por protección de Fase 1 (Escudo Endocrino / Deuda de Sueño).`;
  }

  return {
    environmentLabel: envLabelMap[entornoEntreno],
    splitTitle:
      diasEntrenoSemana <= 3
        ? `Cuerpo Completo · ${diasEntrenoSemana} días/sem`
        : diasEntrenoSemana === 4
        ? "Torso / Pierna · 4 días/sem"
        : `Empuje / Tracción / Piernas · ${diasEntrenoSemana} días/sem`,
    prescription,
    sessions,
    weeklyMuscleVolume,
    reactiveDeload,
    concurrentGuidance,
    appliedVolumeReductionPct,
    autoRegulationSummary,
  };
}
