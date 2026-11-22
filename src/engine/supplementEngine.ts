// ─────────────────────────────────────────────────────────────────────────────
// MOTOR CLÍNICO DE SUPLEMENTACIÓN CONDICIONAL (EVIDENCIA 2023–2026)
// Integra sexoBiologico, peso, horarioEntreno, bedtimeHour, sleepProtection,
// creatineActivatedAt y compuerta hepática obligatoria para Ashwagandha.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SUPPLEMENTS_CATALOG,
  VASCULAR_VITALITY_EDITORIAL,
  type SupplementSpec,
} from "../data/supplements-catalog";
import type { BiologicalSex } from "./bmrEngine";
import type { SleepProtectionResult } from "./endocrineShield";
import type { TrainingSchedule } from "./macroAllocator";
import type { HormonalLabValues, SupplementCustom } from "../context/clinical-engine-context";
import { CREATINE_DAMPING_WINDOW_DAYS } from "./adaptiveTdee";

export interface SupplementEvalInput {
  sexoBiologico: BiologicalSex;
  peso: number;
  horarioEntreno: TrainingSchedule;
  bedtimeHour: number;
  currentHour?: number;
  sleepProtection: SleepProtectionResult;
  hormonalLabValues: HormonalLabValues;
  supplementChecklist: Record<string, boolean>;
  customSupplementDose: Record<string, SupplementCustom>;
  creatineActivatedAt: number | null;
  ashwagandhaSafetyCleared: boolean;
  optInVascularVitality: boolean;
  citrullineGrams: number;
  citrullineTimingMin: number;
  doreySessionsPerWeek: number;
}

export interface EvaluatedSupplement extends SupplementSpec {
  isTaken: boolean;
  resolvedDose: string;
  timingSlot: string;
  saturationPct: number;
  trackedLabel: string;
  conditionalBadge?: string;
  conditionalNote?: string;
  isBlocked: boolean;
  blockReason?: string;
  requiresHepaticGate: boolean;
}

export interface DynamicInterceptionAlert {
  id: string;
  level: "block" | "warn" | "clear";
  code: string;
  title: string;
  body: string;
  timeLabel: string;
}

export interface CircadianHourSlot {
  hour: number;
  status: "open" | "optimal" | "blocked";
}

export interface SupplementPlanOutput {
  coreSupplements: EvaluatedSupplement[];
  contextualSupplements: EvaluatedSupplement[];
  vascularVitalityModule: {
    enabled: boolean;
    title: string;
    subtitle: string;
    doreyProtocolSummary: string;
    clinicalDisclaimer: string;
    citrullineSupplement: EvaluatedSupplement;
    noxScore: number;
    doreyPercentage: number;
  };
  caffeineChrono: {
    isBlocked: boolean;
    reason: string | null;
    cutoffHour: number;
    workoutWindowHour: number;
    personalizedDoseMgRange: string;
  };
  creatineStatus: {
    isActive: boolean;
    hydrationDampingDay: number | null;
    femaleNote: string | null;
  };
  ashwagandhaStatus: {
    safetyCleared: boolean;
    isConditionallySuggested: boolean;
    suggestionReason: string;
  };
  interceptions: DynamicInterceptionAlert[];
  circadianMap: CircadianHourSlot[];
}

function getWorkoutHourForSchedule(schedule: TrainingSchedule): number {
  if (schedule === "morning") return 7;
  if (schedule === "afternoon") return 16;
  return 20; // evening
}

export function evaluateSupplementPlan(input: SupplementEvalInput): SupplementPlanOutput {
  const {
    sexoBiologico,
    peso,
    horarioEntreno,
    bedtimeHour = 23,
    currentHour = new Date().getHours(),
    sleepProtection,
    hormonalLabValues,
    supplementChecklist = {},
    customSupplementDose = {},
    creatineActivatedAt,
    ashwagandhaSafetyCleared,
    optInVascularVitality,
    citrullineGrams,
    citrullineTimingMin,
    doreySessionsPerWeek,
  } = input;

  const validWeight = Number.isFinite(peso) && peso > 20 ? peso : 75;
  const safeBedtime = Number.isFinite(bedtimeHour) ? Math.max(18, Math.min(26, bedtimeHour)) : 23;
  const workoutHour = getWorkoutHourForSchedule(horarioEntreno);
  const cutoffHour = safeBedtime - 8; // 8h de despeje para proteger sueño profundo

  // ── 1. Evaluar Bloqueo Cronobiológico Dinámico de Cafeína ─────────────────
  const minMg = Math.round(validWeight * 3);
  const maxMg = Math.round(validWeight * 6);
  const personalizedDoseMgRange = `${minMg}–${maxMg} mg (3–6 mg/kg)`;

  const hoursBeforeBedForWorkout = safeBedtime - workoutHour;
  const isEveningSchedule = horarioEntreno === "evening";
  const isWorkoutTooCloseToBed = hoursBeforeBedForWorkout < 8;
  const isAfternoonWithSleepDebt =
    sleepProtection.isSleepProtectionActive && horarioEntreno !== "morning";
  const isCurrentHourPastCutoff = currentHour >= cutoffHour;

  const isCaffeineBlocked =
    isEveningSchedule ||
    isWorkoutTooCloseToBed ||
    isAfternoonWithSleepDebt ||
    isCurrentHourPastCutoff;

  let caffeineBlockReason: string | null = null;
  if (isEveningSchedule || isWorkoutTooCloseToBed) {
    caffeineBlockReason = `Entreno nocturno (${workoutHour}:00 h) a ${Math.max(
      0,
      hoursBeforeBedForWorkout
    )} h de dormir (${safeBedtime}:00 h): cafeína bloqueada para proteger arquitectura del sueño.`;
  } else if (isAfternoonWithSleepDebt) {
    caffeineBlockReason =
      "Deuda de sueño activa (< 6.5 h recientes): cafeína restringida en horario de tarde.";
  } else if (isCurrentHourPastCutoff) {
    caffeineBlockReason = `Ventana cronobiológica cerrada desde las ${cutoffHour}:00 h (límite 8 h pre-descanso).`;
  }

  // ── 2. Evaluar Creatina y Nota Femenina / Amortiguación Hídrica ───────────
  const creatineActive = Boolean(supplementChecklist?.cre);
  let hydrationDampingDay: number | null = null;
  if (creatineActive && creatineActivatedAt != null) {
    const days = Math.max(1, Math.ceil((Date.now() - creatineActivatedAt) / (1000 * 60 * 60 * 24)));
    if (days <= CREATINE_DAMPING_WINDOW_DAYS) {
      hydrationDampingDay = days;
    }
  } else if (creatineActive) {
    hydrationDampingDay = 1;
  }

  const creSpec = SUPPLEMENTS_CATALOG.find((s) => s.id === "cre")!;
  const femaleCreatineNote = sexoBiologico === "female" ? creSpec.femaleNote || null : null;

  // ── 3. Evaluar Ashwagandha Condicional + Compuerta Hepática ───────────────
  const highCortisol = (hormonalLabValues?.cortisol ?? 14) > 18;
  const ashConditionallySuggested =
    highCortisol || sleepProtection.isSleepProtectionActive || sexoBiologico === "male";

  const ashSuggestionReason = highCortisol
    ? `Cortisol matutino elevado (${hormonalLabValues.cortisol} µg/dL): uso condicional sugerido para modulación de estrés durante ~8 semanas.`
    : sleepProtection.isSleepProtectionActive
    ? "Sueño fragmentado/insuficiente: opción coadyuvante matizada tras optimizar higiene de descanso."
    : sexoBiologico === "male"
    ? "Opción condicional masculina ante estrés elevado. Evidencia matizada en estrés/descanso; sin prometer incrementos garantizados de testosterona."
    : "Opcional ante estrés crónico; requiere evaluación médica/tiroidea y hepática previa.";

  // ── 4. Mapear cada suplemento del catálogo ────────────────────────────────
  const evaluatedAll: EvaluatedSupplement[] = SUPPLEMENTS_CATALOG.map((spec) => {
    const custom = customSupplementDose?.[spec.id];
    const isRawTaken = Boolean(supplementChecklist?.[spec.id]);
    const requiresHepaticGate = spec.id === "ash" && !ashwagandhaSafetyCleared;
    const isTaken =
      spec.id === "ash"
        ? ashwagandhaSafetyCleared && isRawTaken
        : spec.id === "caf"
        ? !isCaffeineBlocked && isRawTaken
        : isRawTaken;

    let resolvedDose = custom?.doseOverride || spec.standardDose;
    let timingSlot = custom?.timingSlot || spec.timingGuide;
    let saturationPct = isTaken ? 100 : 25;
    let trackedLabel = isTaken ? `${resolvedDose} (Activo)` : `Pendiente · ${spec.standardDose}`;
    let conditionalBadge: string | undefined;
    let conditionalNote: string | undefined;
    let isBlocked = false;
    let blockReason: string | undefined;

    if (spec.id === "cre") {
      if (hydrationDampingDay !== null) {
        conditionalBadge = `Hídrica D${hydrationDampingDay}/21`;
      }
      if (femaleCreatineNote) {
        conditionalNote = femaleCreatineNote;
      }
      trackedLabel = isTaken ? "3–5 g / día (Saturación activa)" : "0 / 3–5 g";
    } else if (spec.id === "caf") {
      resolvedDose = custom?.doseOverride || `${minMg}–${maxMg} mg`;
      isBlocked = isCaffeineBlocked;
      blockReason = caffeineBlockReason || undefined;
      if (isCaffeineBlocked) {
        conditionalBadge = "Bloqueo Cronobiológico";
        conditionalNote = caffeineBlockReason || undefined;
        saturationPct = 0;
        trackedLabel = `Bloqueada (${horarioEntreno === "evening" ? "Entreno noche" : `Corte ${cutoffHour}:00 h`})`;
      } else {
        conditionalBadge = `Ventana < ${cutoffHour}:00 h`;
        trackedLabel = isTaken ? `${minMg}–${maxMg} mg activos` : `Sugerido: ${minMg}–${maxMg} mg`;
      }
    } else if (spec.id === "ash") {
      if (requiresHepaticGate) {
        isBlocked = true;
        conditionalBadge = "Compuerta Hepática Obligatoria";
        conditionalNote = `${spec.hepaticSafetyWarning} ${ashSuggestionReason}`;
        saturationPct = 0;
        trackedLabel = "Bloqueado · Requiere chequeo hepático";
      } else {
        conditionalBadge = "Ciclo ~8 sem · Evaluado";
        conditionalNote = ashSuggestionReason;
        trackedLabel = isTaken ? "600 mg / día (Ciclo 8 sem)" : "Habilitado · Pendiente toma";
      }
    } else if (spec.id === "d3") {
      conditionalNote = "Tomar junto a comida principal que contenga grasa para absorción óptima.";
    } else if (spec.id === "mg") {
      conditionalNote =
        sexoBiologico === "female"
          ? "Referencia clínica femenina: 310–320 mg/día."
          : "Referencia base 310–320 mg/día (ajustable a ~400 mg en hombres según dieta).";
    } else if (spec.id === "cit") {
      const pct = Math.min(100, Math.round((citrullineGrams / 8) * 100));
      saturationPct = isTaken ? 100 : pct;
      trackedLabel = isTaken
        ? `${citrullineGrams} g · ${citrullineTimingMin} min pre`
        : "1.5–3 g vasc. / 6–8 g pre";
    }

    return {
      ...spec,
      isTaken,
      resolvedDose,
      timingSlot,
      saturationPct,
      trackedLabel,
      conditionalBadge,
      conditionalNote,
      isBlocked,
      blockReason,
      requiresHepaticGate,
    };
  });

  const coreSupplements = evaluatedAll.filter((s) => s.category === "core");
  const contextualSupplements = evaluatedAll.filter((s) => s.category === "contextual");
  const citrullineSupplement = evaluatedAll.find((s) => s.id === "cit")!;

  // ── 5. Métricas Opt-In de Vitalidad Vascular (Dorey + NOx) ────────────────
  let noxScore = 0;
  if (citrullineGrams >= 6 && citrullineGrams <= 8) noxScore += 60;
  else if (citrullineGrams >= 1.5) noxScore += 40;
  if (citrullineTimingMin >= 30 && citrullineTimingMin <= 45) noxScore += 40;
  else if (citrullineTimingMin > 0) noxScore += 15;

  const doreyPercentage = Math.min(100, Math.round(((doreySessionsPerWeek || 0) / 4) * 100));

  // ── 6. Interceptores dinámicos (cero horas hardcodeadas) ──────────────────
  const interceptions: DynamicInterceptionAlert[] = [
    {
      id: "caf-chrono",
      level: isCaffeineBlocked ? "block" : "clear",
      code: "CRONOBIOLOGÍA CAFEÍNA",
      title: isCaffeineBlocked
        ? `Cafeína bloqueada (${horarioEntreno === "evening" ? "entreno nocturno" : `corte ${cutoffHour}:00 h`})`
        : `Ventana ergogénica abierta hasta ${cutoffHour}:00 h`,
      body: isCaffeineBlocked
        ? caffeineBlockReason || "Protegiendo arquitectura del sueño profundo."
        : `Dosis personalizada ${personalizedDoseMgRange} autorizada ~60 min antes de entrenar (descanso previsto ${safeBedtime}:00 h).`,
      timeLabel: `${String(workoutHour).padStart(2, "0")}:00`,
    },
    {
      id: "ash-hepatic",
      level: !ashwagandhaSafetyCleared ? "warn" : "clear",
      code: "COMPUERTA HEPÁTICA ASHWAGANDHA",
      title: !ashwagandhaSafetyCleared
        ? "Evaluación de seguridad hepática requerida"
        : "Compuerta de seguridad hepática completada",
      body: !ashwagandhaSafetyCleared
        ? "Descarta enfermedad hepática crónica y consulta evaluación médica/tiroidea antes de habilitar ciclos de ~8 semanas (600 mg/día)."
        : `${ashSuggestionReason} Monitorea síntomas digestivos/hepáticos.`,
      timeLabel: "Ciclo 8s",
    },
  ];

  if (sexoBiologico === "female") {
    interceptions.push({
      id: "cre-female",
      level: "clear",
      code: "FISIOLOGÍA FEMENINA · CREATINA",
      title: "Soporte específico en mujeres (3–5 g/día)",
      body:
        femaleCreatineNote ||
        "Respalda fuerza, recuperación ante déficit de sueño, fase lútea, posparto y posmenopausia.",
      timeLabel: "Diario",
    });
  }

  if (optInVascularVitality) {
    interceptions.push({
      id: "cit-vascular",
      level: "clear",
      code: "VITALIDAD VASCULAR OPT-IN",
      title: "Malato de L-Citrulina + Protocolo Dorey",
      body:
        "Vía eNOS activa (1.5–3 g/día mantenimiento vascular o 6–8 g pre-entreno) combinada con suelo pélvico 3×15 (4×/sem).",
      timeLabel: `${citrullineTimingMin}m pre`,
    });
  }

  // ── 7. Mapa Circadiano de 24 h vinculado a bedtimeHour y horarioEntreno ───
  const preWorkoutHour = Math.max(5, workoutHour - 1);
  const circadianMap: CircadianHourSlot[] = Array.from({ length: 24 }).map((_, h) => {
    if (h >= cutoffHour || h < 5) {
      return { hour: h, status: "blocked" };
    }
    if (!isCaffeineBlocked && h >= preWorkoutHour && h <= workoutHour + 1) {
      return { hour: h, status: "optimal" };
    }
    return { hour: h, status: "open" };
  });

  return {
    coreSupplements,
    contextualSupplements,
    vascularVitalityModule: {
      enabled: optInVascularVitality,
      title: VASCULAR_VITALITY_EDITORIAL.title,
      subtitle: VASCULAR_VITALITY_EDITORIAL.subtitle,
      doreyProtocolSummary: VASCULAR_VITALITY_EDITORIAL.doreyProtocolSummary,
      clinicalDisclaimer: VASCULAR_VITALITY_EDITORIAL.clinicalDisclaimer,
      citrullineSupplement,
      noxScore,
      doreyPercentage,
    },
    caffeineChrono: {
      isBlocked: isCaffeineBlocked,
      reason: caffeineBlockReason,
      cutoffHour,
      workoutWindowHour: workoutHour,
      personalizedDoseMgRange,
    },
    creatineStatus: {
      isActive: creatineActive,
      hydrationDampingDay,
      femaleNote: femaleCreatineNote,
    },
    ashwagandhaStatus: {
      safetyCleared: ashwagandhaSafetyCleared,
      isConditionallySuggested: ashConditionallySuggested,
      suggestionReason: ashSuggestionReason,
    },
    interceptions,
    circadianMap,
  };
}
