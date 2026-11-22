import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  runATODiagnosis,
  getCooldownRemaining,
  ATODirective,
  ATOInput,
} from "../services/atoOrchestrator";
import {
  computeClinicalMetrics,
  LIPID_FLOOR_MULTIPLIER,
  type ClinicalMetricsOutput,
} from "../lib/clinical-math";
import { SIE_STORAGE_KEYS, safeGetItem, safeSetItem } from "../lib/storage-engine";
import type { BiologicalSex } from "../engine/bmrEngine";
import type { DailyTelemetryEntry } from "../engine/adaptiveTdee";
import type {
  TrainingGoal,
  TrainingSchedule,
  TrainingEnvironment,
} from "../engine/macroAllocator";

export { LIPID_FLOOR_MULTIPLIER };

export type TrainingModality = "hypertrophy" | "strength" | "power" | "endurance";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface ConcurrentCardioConfig {
  enabled: boolean;
  intensity: "low" | "high";
  hoursGap: number;
}

export interface BiomechanicalScreenEntry {
  score: 1 | 2 | 3;
  notes?: string;
}

export interface WorkoutHistoryExercise {
  id: string;
  name: string;
  isCompound: boolean;
  targetRepMin: number;
  targetRepMax: number;
  targetRir: number;
  loadKg: number;
  completedSetsCount: number;
  repsAchieved: number;
  observedRir: number;
}

export interface WorkoutHistoryEntry {
  id: string;
  date: string;
  workoutName: string;
  modality: TrainingModality;
  environment: TrainingEnvironment;
  exercises: WorkoutHistoryExercise[];
}

// ── Esquema de Perfil Mínimo Autónomo + Alias de Compatibilidad ──────────────
export interface ClinicalProfile {
  // Campos obligatorios mínimos (Entrada Mínima V6)
  peso: number;
  talla: number;
  edad: number;
  sexoBiologico: BiologicalSex;
  nivelActividad: number;
  horasSuenoPromedio: number;
  entornoEntreno: TrainingEnvironment;
  diasEntrenoSemana: number;
  objetivo: TrainingGoal;
  horarioEntreno: TrainingSchedule;

  // Campo opcional (% grasa corporal: si es null -> fallback Mifflin-St Jeor)
  bodyFat: number | null;

  // Configuración Fase 2 (Entrenamiento ACSM 2026 & Suplementación Condicional)
  trainingModality: TrainingModality;
  experienceLevel: ExperienceLevel;
  bedtimeHour: number;
  optInVascularVitality: boolean;
  ashwagandhaSafetyCleared: boolean;
  concurrentCardio: ConcurrentCardioConfig;
  biomechanicalScreen: Record<string, BiomechanicalScreenEntry>;

  // Telemetría y calibración autónoma
  weightLogs: number[];
  dailySteps?: number;
  sleepLogs: number[];
  dailyTelemetryLogs: DailyTelemetryEntry[];
  creatineActivatedAt: number | null;
  lastHighConfidenceTdee: number | null;
  lastHighConfidenceEntriesCount?: number;
  isHighCarbRefeed?: boolean;
  isMenstrualRetention?: boolean;
  isDeficitManualOverride?: boolean;
  sustainedLowEADays?: number;

  // Alias sincronizados heredados para compatibilidad integral de vistas
  username: string;
  height: number;
  age: number;
  sex: BiologicalSex;
  activityFactor: number;
  deficitTarget: number;
  exerciseCalories: number;
  routineType: "Gym" | "Casa" | "PRO";
  trainingFrequency: number;
  cnsReadiness: number;
  mesocycleWeek: number;
  citrullineGrams: number;
  citrullineTimingMin: number;
  doreySessionsPerWeek: number;
  proteinMultiplier?: number;
  fatMultiplier?: number;
  factorProteina?: number;
  factorGrasa?: number;
  customRoutines: Record<string, any>;
  exerciseLoadOverrides: Record<string, number>;
}

const DEFAULT_WEIGHT_LOGS = [85.4, 84.8, 85.1, 84.9, 84.6, 85.0, 84.7];

export const DEFAULT_CLINICAL_PROFILE: ClinicalProfile = {
  peso: 84.7,
  talla: 181,
  edad: 34,
  sexoBiologico: "male",
  nivelActividad: 1.55,
  horasSuenoPromedio: 7.4,
  entornoEntreno: "gym",
  diasEntrenoSemana: 4,
  objetivo: "fat_loss",
  horarioEntreno: "afternoon",
  bodyFat: 14.5,
  trainingModality: "hypertrophy",
  experienceLevel: "intermediate",
  bedtimeHour: 23,
  optInVascularVitality: false,
  ashwagandhaSafetyCleared: false,
  concurrentCardio: { enabled: false, intensity: "low", hoursGap: 3 },
  biomechanicalScreen: {},
  weightLogs: DEFAULT_WEIGHT_LOGS,
  dailySteps: 8500,
  sleepLogs: [7.5, 7.2, 7.8, 7.0, 7.6, 7.4, 7.5],
  dailyTelemetryLogs: [],
  creatineActivatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  lastHighConfidenceTdee: null,
  lastHighConfidenceEntriesCount: 0,
  isHighCarbRefeed: false,
  isMenstrualRetention: false,
  isDeficitManualOverride: false,
  sustainedLowEADays: 0,
  username: "Marcos M.",
  height: 181,
  age: 34,
  sex: "male",
  activityFactor: 1.55,
  deficitTarget: 500,
  exerciseCalories: 400,
  routineType: "Gym",
  trainingFrequency: 4,
  cnsReadiness: 85,
  mesocycleWeek: 3,
  citrullineGrams: 8.0,
  citrullineTimingMin: 35,
  doreySessionsPerWeek: 3,
  customRoutines: {},
  exerciseLoadOverrides: {},
};

function mapRoutineTypeToEnv(routineType: string | undefined): TrainingEnvironment {
  if (routineType === "Casa") return "home_bands_dumbbells";
  return "gym";
}

function mapEnvToRoutineType(env: TrainingEnvironment | undefined): "Gym" | "Casa" {
  if (env === "home_bodyweight" || env === "home_bands_dumbbells") return "Casa";
  return "Gym";
}

function inferGoalFromDeficit(deficitTarget: number | undefined): TrainingGoal {
  if (typeof deficitTarget !== "number" || !Number.isFinite(deficitTarget)) return "fat_loss";
  if (deficitTarget >= 200) return "fat_loss";
  if (deficitTarget > 0) return "recomp";
  if (deficitTarget < 0) return "muscle_gain";
  return "general_health";
}

/**
 * Normaliza y migra perfiles heredados (v5/v6) preservando historiales previos
 * sin sobrescribir datos guardados por el usuario.
 */
export function normalizeAndMigrateProfile(raw: any): ClinicalProfile {
  const source = raw && typeof raw === "object" ? { ...raw } : {};

  // Migración legacy de `superavit` solo si `deficitTarget` es undefined
  if (source.deficitTarget === undefined && source.superavit !== undefined) {
    source.deficitTarget = source.superavit;
  }
  if ("superavit" in source) {
    delete source.superavit;
  }

  const weightLogs: number[] =
    Array.isArray(source.weightLogs) && source.weightLogs.length > 0
      ? source.weightLogs.filter((w: any) => typeof w === "number" && Number.isFinite(w) && w > 20)
      : DEFAULT_CLINICAL_PROFILE.weightLogs;

  const lastWeight = weightLogs[weightLogs.length - 1] ?? DEFAULT_CLINICAL_PROFILE.peso;
  const peso =
    typeof source.peso === "number" && Number.isFinite(source.peso) && source.peso > 20
      ? source.peso
      : lastWeight;

  const talla = Number(source.talla ?? source.height ?? DEFAULT_CLINICAL_PROFILE.talla);
  const edad = Number(source.edad ?? source.age ?? DEFAULT_CLINICAL_PROFILE.edad);
  const sexoBiologico: BiologicalSex =
    (source.sexoBiologico ?? source.sex) === "female" ? "female" : "male";
  const nivelActividad = Number(
    source.nivelActividad ?? source.activityFactor ?? DEFAULT_CLINICAL_PROFILE.nivelActividad
  );
  const diasEntrenoSemana = Math.max(
    2,
    Number(
      source.diasEntrenoSemana ??
        source.trainingFrequency ??
        DEFAULT_CLINICAL_PROFILE.diasEntrenoSemana
    )
  );

  const entornoEntreno: TrainingEnvironment =
    source.entornoEntreno ?? mapRoutineTypeToEnv(source.routineType);
  const routineType: "Gym" | "Casa" | "PRO" =
    source.routineType === "PRO"
      ? "PRO"
      : source.routineType === "Casa" || source.routineType === "Gym"
      ? source.routineType
      : mapEnvToRoutineType(entornoEntreno);

  const objetivo: TrainingGoal =
    source.objetivo ?? inferGoalFromDeficit(source.deficitTarget);
  const horarioEntreno: TrainingSchedule = source.horarioEntreno ?? "afternoon";
  const horasSuenoPromedio = Number(
    source.horasSuenoPromedio ?? DEFAULT_CLINICAL_PROFILE.horasSuenoPromedio
  );

  const bodyFat: number | null =
    source.bodyFat === null
      ? null
      : typeof source.bodyFat === "number" && Number.isFinite(source.bodyFat)
      ? source.bodyFat
      : source.bodyFat === undefined
      ? DEFAULT_CLINICAL_PROFILE.bodyFat
      : null;

  return {
    ...DEFAULT_CLINICAL_PROFILE,
    ...source,
    peso,
    talla,
    edad,
    sexoBiologico,
    nivelActividad,
    horasSuenoPromedio,
    entornoEntreno,
    diasEntrenoSemana,
    objetivo,
    horarioEntreno,
    bodyFat,
    trainingModality:
      source.trainingModality === "strength" ||
      source.trainingModality === "power" ||
      source.trainingModality === "endurance"
        ? source.trainingModality
        : "hypertrophy",
    experienceLevel:
      source.experienceLevel === "beginner" || source.experienceLevel === "advanced"
        ? source.experienceLevel
        : "intermediate",
    bedtimeHour:
      typeof source.bedtimeHour === "number" && Number.isFinite(source.bedtimeHour)
        ? Math.max(18, Math.min(26, source.bedtimeHour))
        : 23,
    optInVascularVitality: Boolean(source.optInVascularVitality),
    ashwagandhaSafetyCleared: Boolean(source.ashwagandhaSafetyCleared),
    concurrentCardio:
      source.concurrentCardio && typeof source.concurrentCardio === "object"
        ? {
            enabled: Boolean(source.concurrentCardio.enabled),
            intensity: source.concurrentCardio.intensity === "high" ? "high" : "low",
            hoursGap: Number(source.concurrentCardio.hoursGap ?? 3),
          }
        : DEFAULT_CLINICAL_PROFILE.concurrentCardio,
    biomechanicalScreen:
      source.biomechanicalScreen && typeof source.biomechanicalScreen === "object"
        ? source.biomechanicalScreen
        : {},
    weightLogs,
    sleepLogs: Array.isArray(source.sleepLogs)
      ? source.sleepLogs
      : DEFAULT_CLINICAL_PROFILE.sleepLogs,
    dailyTelemetryLogs: Array.isArray(source.dailyTelemetryLogs)
      ? source.dailyTelemetryLogs
      : [],
    creatineActivatedAt:
      source.creatineActivatedAt === undefined
        ? DEFAULT_CLINICAL_PROFILE.creatineActivatedAt
        : source.creatineActivatedAt,
    lastHighConfidenceTdee:
      typeof source.lastHighConfidenceTdee === "number" &&
      Number.isFinite(source.lastHighConfidenceTdee)
        ? source.lastHighConfidenceTdee
        : null,
    lastHighConfidenceEntriesCount:
      typeof source.lastHighConfidenceEntriesCount === "number" &&
      Number.isFinite(source.lastHighConfidenceEntriesCount)
        ? source.lastHighConfidenceEntriesCount
        : 0,
    height: talla,
    age: edad,
    sex: sexoBiologico,
    activityFactor: nivelActividad,
    routineType,
    trainingFrequency: diasEntrenoSemana,
    customRoutines:
      source.customRoutines && typeof source.customRoutines === "object"
        ? source.customRoutines
        : {},
    exerciseLoadOverrides:
      source.exerciseLoadOverrides && typeof source.exerciseLoadOverrides === "object"
        ? source.exerciseLoadOverrides
        : {},
  };
}

const ClinicalEngineContext = createContext<any>(null);

// 12 Clinical Supplements list
export interface SupplementItem {
  id: string;
  name: string;
  abbr: string;
  dose: string;
  saturationBase: number;
  pathway: string;
  cls: "A" | "B";
}

export const CLINICAL_SUPPLEMENTS: SupplementItem[] = [
  { id: "cre", name: "Monohidrato de Creatina", abbr: "CrM", dose: "3–5 g", saturationBase: 100, pathway: "Resíntesis de ATP", cls: "A" },
  { id: "cit", name: "Malato de L-Citrulina", abbr: "CitM", dose: "6–8 g pre / 1.5–3 g vasc.", saturationBase: 0, pathway: "Saturación de eNOS", cls: "A" },
  { id: "ash", name: "Ashwagandha KSM-66", abbr: "KSM", dose: "600 mg", saturationBase: 74, pathway: "Atenuación de Cortisol", cls: "A" },
  { id: "caf", name: "Cafeína Anhidra", abbr: "CAF", dose: "3–6 mg/kg", saturationBase: 88, pathway: "Antagonismo de Adenosina", cls: "A" },
  { id: "bet", name: "Beta-Alanina", abbr: "β-ALA", dose: "4–6 g", saturationBase: 50, pathway: "Amortiguación de Carnosina", cls: "A" },
  { id: "the", name: "L-Teanina", abbr: "THN", dose: "100 mg", saturationBase: 62, pathway: "Modulación de Ondas Alfa", cls: "B" },
  { id: "mg", name: "Glicinato de Magnesio", abbr: "MG", dose: "310–320 mg", saturationBase: 80, pathway: "Regulación de NMDA", cls: "A" },
  { id: "zn", name: "Picolinato de Zinc", abbr: "ZN", dose: "30 mg", saturationBase: 70, pathway: "Soporte Androgénico", cls: "A" },
  { id: "o3", name: "Aceite de Pescado Omega-3", abbr: "O3", dose: "1–3 g", saturationBase: 85, pathway: "Sincronización de Membrana Celular", cls: "A" },
  { id: "d3", name: "Vitamina D3", abbr: "D3", dose: "600–800 UI", saturationBase: 90, pathway: "Transcripción del Receptor Nuclear", cls: "A" },
  { id: "wpi", name: "Aislado de Proteína de Suero", abbr: "WPI", dose: "30 g", saturationBase: 95, pathway: "Estimulación de MPS", cls: "A" },
  { id: "mel", name: "Melatonina", abbr: "MEL", dose: "3 mg", saturationBase: 100, pathway: "Agonismo de MT1/MT2", cls: "B" },
];

// ─── Hormonal Lab Reference Ranges ──────────────────────────────────────────
export interface HormonalLabValues {
  lh: number;
  fsh: number;
  testosterone: number;
  shbg: number;
  cortisol: number;
  prolactina?: number;
  estradiol?: number;
}

const DEFAULT_HORMONAL_LABS: HormonalLabValues = {
  lh: 3.8,
  fsh: 4.2,
  testosterone: 650,
  shbg: 34,
  cortisol: 14.2,
  prolactina: 8.5,
  estradiol: 28,
};

// ─── Supplement custom overrides ────────────────────────────────────────────
export interface SupplementCustom {
  doseOverride?: string;
  timingSlot?: string;
  active: boolean;
}

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => safeGetItem(key, initialValue));

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((current) => {
        const valueToStore = value instanceof Function ? value(current) : value;
        safeSetItem(key, valueToStore);
        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

export function ClinicalEngineProvider({ children }: { children: React.ReactNode }) {
  // Perfil autónomo normalizado con migración segura de datos legacy
  const [profile, setProfile] = useState<ClinicalProfile>(() => {
    const loaded = safeGetItem<any>(SIE_STORAGE_KEYS.PROFILE, DEFAULT_CLINICAL_PROFILE);
    return normalizeAndMigrateProfile(loaded);
  });

  // Food logs (array of logged items)
  const [foodLogs, setFoodLogs] = useState<any[]>(() => {
    return safeGetItem(SIE_STORAGE_KEYS.FOOD_LOGS, [
      { id: "avena-init", name: "Avena", category: "Grano / Carb", kcal: 389, protein: 16.9, carbs: 66.3, fats: 6.9, grams: 80, timestamp: Date.now() },
      { id: "pollo-init", name: "Pechuga de Pollo", category: "Proteína magra", kcal: 165, protein: 31.0, carbs: 0.0, fats: 3.6, grams: 200, timestamp: Date.now() },
    ]);
  });

  // Custom foods database
  const [customFoods, setCustomFoods] = useState<Record<string, any>>(() => {
    return safeGetItem(SIE_STORAGE_KEYS.CUSTOM_FOODS, {});
  });

  // Active workout tracker & historical workout sessions
  const [activeWorkout, setActiveWorkout] = useState<any>(() => {
    return safeGetItem(SIE_STORAGE_KEYS.WORKOUT, null);
  });
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>(() => {
    return safeGetItem<WorkoutHistoryEntry[]>(SIE_STORAGE_KEYS.WORKOUT_HISTORY, []);
  });

  // Supplement checklist selections (ash inicia en false para compuerta hepática)
  const [supplementChecklist, setSupplementChecklist] = useState<Record<string, boolean>>(() => {
    return safeGetItem(SIE_STORAGE_KEYS.SUPPLEMENT_CHECKLIST, {
      cre: true,
      ash: false,
      caf: false,
      bet: true,
      mg: true,
      zn: false,
    });
  });

  const checklistRef = useRef(supplementChecklist);
  checklistRef.current = supplementChecklist;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const activeWorkoutRef = useRef(activeWorkout);
  activeWorkoutRef.current = activeWorkout;

  // Hormonal Lab Values
  const [hormonalLabValues, setHormonalLabValues] = useLocalStorage<HormonalLabValues>(
    SIE_STORAGE_KEYS.LABS,
    DEFAULT_HORMONAL_LABS
  );

  // Supplement Custom Dose/Timing Overrides
  const [customSupplementDose, setCustomSupplementDose] = useLocalStorage<
    Record<string, SupplementCustom>
  >(SIE_STORAGE_KEYS.SUPPLEMENT_CUSTOM, {});

  // Memory-only activeGlossaryId (nunca persistido en localStorage)
  const [activeGlossaryId, setActiveGlossaryId] = useState<string | null>(null);

  // ATO Directive State
  const [atoDirective, setAtoDirective] = useState<ATODirective | null>(() => {
    return safeGetItem<ATODirective | null>(SIE_STORAGE_KEYS.ATO, null);
  });
  const [isATOPending, setIsATOPending] = useState(false);
  const [isATOStale, setIsATOStale] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(() =>
    Math.ceil(getCooldownRemaining() / 1000)
  );

  // Sync to Storage Engine
  useEffect(() => {
    safeSetItem(SIE_STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    safeSetItem(SIE_STORAGE_KEYS.FOOD_LOGS, foodLogs);
  }, [foodLogs]);

  useEffect(() => {
    safeSetItem(SIE_STORAGE_KEYS.CUSTOM_FOODS, customFoods);
  }, [customFoods]);

  useEffect(() => {
    safeSetItem(SIE_STORAGE_KEYS.WORKOUT, activeWorkout);
  }, [activeWorkout]);

  useEffect(() => {
    safeSetItem(SIE_STORAGE_KEYS.WORKOUT_HISTORY, workoutHistory);
  }, [workoutHistory]);

  useEffect(() => {
    safeSetItem(SIE_STORAGE_KEYS.SUPPLEMENT_CHECKLIST, supplementChecklist);
  }, [supplementChecklist]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.newValue) return;
      try {
        if (event.key === SIE_STORAGE_KEYS.PROFILE) {
          setProfile(normalizeAndMigrateProfile(JSON.parse(event.newValue)));
        } else if (event.key === SIE_STORAGE_KEYS.FOOD_LOGS) {
          setFoodLogs(JSON.parse(event.newValue));
        } else if (event.key === SIE_STORAGE_KEYS.CUSTOM_FOODS) {
          setCustomFoods(JSON.parse(event.newValue));
        } else if (event.key === SIE_STORAGE_KEYS.WORKOUT) {
          setActiveWorkout(JSON.parse(event.newValue));
        } else if (event.key === SIE_STORAGE_KEYS.WORKOUT_HISTORY) {
          setWorkoutHistory(JSON.parse(event.newValue));
        } else if (event.key === SIE_STORAGE_KEYS.SUPPLEMENT_CHECKLIST) {
          setSupplementChecklist(JSON.parse(event.newValue));
        } else if (event.key === SIE_STORAGE_KEYS.LABS) {
          setHormonalLabValues(JSON.parse(event.newValue));
        } else if (event.key === SIE_STORAGE_KEYS.SUPPLEMENT_CUSTOM) {
          setCustomSupplementDose(JSON.parse(event.newValue));
        } else if (event.key === SIE_STORAGE_KEYS.ATO) {
          setAtoDirective(JSON.parse(event.newValue));
        }
      } catch (err) {
        console.error("Error syncing across tabs:", err);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [setHormonalLabValues, setCustomSupplementDose]);

  // Derive HPG suppression from real lab values when available
  const labSuppressed = useMemo(
    () =>
      hormonalLabValues.lh < 1.5 ||
      hormonalLabValues.testosterone < 300 ||
      hormonalLabValues.cortisol > 22,
    [hormonalLabValues]
  );

  // --- MOTOR CLÍNICO AUTÓNOMO (useMemo desacoplado a módulos puros en src/engine/) ---
  const clinicalMetrics: ClinicalMetricsOutput = useMemo(() => {
    return computeClinicalMetrics(
      profile,
      foodLogs,
      supplementChecklist,
      customSupplementDose,
      labSuppressed
    );
  }, [profile, foodLogs, supplementChecklist, customSupplementDose, labSuppressed]);

  // Persistir TDEE de alta confianza una vez por convergencia/nuevo registro completo
  useEffect(() => {
    const prevCount = profile.lastHighConfidenceEntriesCount ?? 0;
    const nextCount = clinicalMetrics.lastHighConfidenceEntriesCount ?? 0;
    if (
      clinicalMetrics.algorithmStatus === "updating" &&
      clinicalMetrics.lastHighConfidenceTdee &&
      (nextCount > prevCount || profile.lastHighConfidenceTdee === null)
    ) {
      setProfile((prev) => ({
        ...prev,
        lastHighConfidenceTdee: clinicalMetrics.lastHighConfidenceTdee,
        lastHighConfidenceEntriesCount: nextCount,
      }));
    }
  }, [
    clinicalMetrics.algorithmStatus,
    clinicalMetrics.lastHighConfidenceTdee,
    clinicalMetrics.lastHighConfidenceEntriesCount,
    profile.lastHighConfidenceTdee,
    profile.lastHighConfidenceEntriesCount,
  ]);

  // --- ACTIONS (useCallback wrapped for re-render isolation) ---
  const updateProfileVariable = useCallback((key: string, value: any) => {
    setProfile((prev: ClinicalProfile) => {
      const next: ClinicalProfile = { ...prev, [key]: value };

      // Sincronización bidireccional entre esquema mínimo V6 y alias heredados
      if (key === "talla" || key === "height") {
        const h = Number(value);
        if (Number.isFinite(h)) {
          next.talla = h;
          next.height = h;
        }
      } else if (key === "edad" || key === "age") {
        const a = Number(value);
        if (Number.isFinite(a)) {
          next.edad = a;
          next.age = a;
        }
      } else if (key === "sexoBiologico" || key === "sex") {
        const s: BiologicalSex = value === "female" ? "female" : "male";
        next.sexoBiologico = s;
        next.sex = s;
      } else if (key === "nivelActividad" || key === "activityFactor") {
        const af = Number(value);
        if (Number.isFinite(af)) {
          next.nivelActividad = af;
          next.activityFactor = af;
        }
      } else if (key === "diasEntrenoSemana" || key === "trainingFrequency") {
        const days = Math.max(2, Number(value) || 2);
        next.diasEntrenoSemana = days;
        next.trainingFrequency = days;
      } else if (key === "entornoEntreno") {
        next.entornoEntreno = value;
        next.routineType = mapEnvToRoutineType(value);
      } else if (key === "routineType") {
        next.routineType = value;
        next.entornoEntreno = mapRoutineTypeToEnv(value);
      } else if (key === "bodyFat") {
        if (value === null || value === "" || Number.isNaN(Number(value))) {
          next.bodyFat = null;
        } else {
          next.bodyFat = Number(value);
        }
      } else if (key === "deficitTarget") {
        next.deficitTarget = Number(value) || 0;
        next.isDeficitManualOverride = true;
      } else if (key === "objetivo") {
        next.objetivo = value;
        next.isDeficitManualOverride = false;
      } else if (key === "peso") {
        const p = Number(value);
        if (Number.isFinite(p) && p > 20) {
          next.peso = p;
        }
      }

      return next;
    });
  }, []);

  const addWeightLog = useCallback((weight: number) => {
    if (!Number.isFinite(weight) || weight <= 20) return;
    setProfile((prev: ClinicalProfile) => ({
      ...prev,
      peso: weight,
      weightLogs: [...prev.weightLogs, weight],
    }));
  }, []);

  const logSleepHours = useCallback((hours: number) => {
    if (!Number.isFinite(hours) || hours <= 0 || hours > 16) return;
    setProfile((prev: ClinicalProfile) => {
      const updatedLogs = [...(prev.sleepLogs || []), Number(hours.toFixed(1))].slice(-14);
      const avg =
        updatedLogs.reduce((acc, val) => acc + val, 0) / Math.max(1, updatedLogs.length);
      return {
        ...prev,
        sleepLogs: updatedLogs,
        horasSuenoPromedio: Number(avg.toFixed(2)),
      };
    });
  }, []);

  const updateDailySteps = useCallback((steps: number) => {
    if (!Number.isFinite(steps) || steps < 0) return;
    setProfile((prev: ClinicalProfile) => ({
      ...prev,
      dailySteps: Math.round(steps),
    }));
  }, []);

  const logDailyTelemetry = useCallback((entry: DailyTelemetryEntry) => {
    if (!entry || !entry.date) return;
    setProfile((prev: ClinicalProfile) => {
      const existing = Array.isArray(prev.dailyTelemetryLogs) ? prev.dailyTelemetryLogs : [];
      const idx = existing.findIndex((e) => e.date === entry.date);
      const updated =
        idx >= 0
          ? existing.map((e, i) => (i === idx ? { ...e, ...entry } : e))
          : [...existing, entry];

      let nextWeightLogs = prev.weightLogs;
      let nextPeso = prev.peso;
      if (
        !entry.isPartialLog &&
        typeof entry.weightKg === "number" &&
        Number.isFinite(entry.weightKg) &&
        entry.weightKg > 20
      ) {
        nextPeso = entry.weightKg;
        nextWeightLogs = [...prev.weightLogs, entry.weightKg];
      }

      let nextSleepLogs = prev.sleepLogs;
      let nextSleepAvg = prev.horasSuenoPromedio;
      if (
        typeof entry.sleepHours === "number" &&
        Number.isFinite(entry.sleepHours) &&
        entry.sleepHours > 0
      ) {
        nextSleepLogs = [...(prev.sleepLogs || []), entry.sleepHours].slice(-14);
        nextSleepAvg = Number(
          (nextSleepLogs.reduce((a, b) => a + b, 0) / nextSleepLogs.length).toFixed(2)
        );
      }

      return {
        ...prev,
        peso: nextPeso,
        weightLogs: nextWeightLogs,
        sleepLogs: nextSleepLogs,
        horasSuenoPromedio: nextSleepAvg,
        dailySteps:
          typeof entry.steps === "number" && Number.isFinite(entry.steps)
            ? Math.round(entry.steps)
            : prev.dailySteps,
        dailyTelemetryLogs: updated.slice(-90),
      };
    });
  }, []);

  // Nutrition logging actions
  const logFoodItem = useCallback((food: any, grams: number) => {
    setFoodLogs((prev) => [
      ...prev,
      {
        ...food,
        grams,
        id: `${food.id}-${Date.now()}`,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const addCustomFood = useCallback((food: any) => {
    setCustomFoods((prev) => ({
      ...prev,
      [food.id]: {
        ...food,
        id: food.id || `custom-${Date.now()}`,
      },
    }));
  }, []);

  const removeFoodLog = useCallback((id: string) => {
    setFoodLogs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearFoodLogs = useCallback(() => {
    setFoodLogs([]);
  }, []);

  // Workout tracking actions (inmutables)
  const startWorkout = useCallback((workoutName: string, exercises: any[]) => {
    setActiveWorkout({
      name: workoutName,
      exercises: exercises.map((ex) => ({
        ...ex,
        completedSets: Array(ex.sets).fill(false),
        timestamp: Date.now(),
      })),
      timestamp: Date.now(),
    });
  }, []);

  const toggleWorkoutSet = useCallback((exerciseId: string, setIndex: number) => {
    setActiveWorkout((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex: any) => {
          if (ex.id !== exerciseId) return ex;
          const newCompleted = [...ex.completedSets];
          const currentlyCompleted = newCompleted[setIndex];
          if (!currentlyCompleted) {
            for (let i = 0; i < setIndex; i++) {
              if (!newCompleted[i]) return ex;
            }
          } else {
            for (let i = setIndex; i < newCompleted.length; i++) {
              newCompleted[i] = false;
            }
          }
          newCompleted[setIndex] = !currentlyCompleted;
          return { ...ex, completedSets: newCompleted };
        }),
      };
    });
  }, []);

  const updateWorkoutExerciseLoad = useCallback((exerciseId: string, loadKg: number) => {
    setActiveWorkout((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex: any) => {
          if (ex.id === exerciseId) {
            return { ...ex, loadKg };
          }
          return ex;
        }),
      };
    });
  }, []);

  const updateExerciseLoadOverride = useCallback((exerciseId: string, loadKg: number) => {
    setProfile((prev: ClinicalProfile) => ({
      ...prev,
      exerciseLoadOverrides: {
        ...(prev.exerciseLoadOverrides || {}),
        [exerciseId]: loadKg,
      },
    }));
  }, []);

  const addCustomExercise = useCallback((rType: string, week: number, ex: any) => {
    setProfile((prev: ClinicalProfile) => {
      const customRoutines = prev.customRoutines ? { ...prev.customRoutines } : {};
      const typeBucket = customRoutines[rType] ? { ...customRoutines[rType] } : {};
      const weekBucket = typeBucket[week] ? { ...typeBucket[week] } : { exercises: [] };
      const nextExercises = [
        ...(weekBucket.exercises || []),
        {
          ...ex,
          id: ex.id || `custom-ex-${Date.now()}`,
        },
      ];
      return {
        ...prev,
        customRoutines: {
          ...customRoutines,
          [rType]: {
            ...typeBucket,
            [week]: {
              ...weekBucket,
              exercises: nextExercises,
            },
          },
        },
      };
    });
  }, []);

  const finishWorkout = useCallback(() => {
    const current = activeWorkoutRef.current;
    const p = profileRef.current;

    if (current && Array.isArray(current.exercises)) {
      const completedExercises: WorkoutHistoryExercise[] = current.exercises
        .map((ex: any) => {
          const completedSetsCount = Array.isArray(ex.completedSets)
            ? ex.completedSets.filter(Boolean).length
            : 0;
          if (completedSetsCount === 0) return null;

          // Parse targetRepMin/Max from repRange string like "8–12" or "8-12"
          const rangeParts = String(ex.repRange || "8-12")
            .replace("–", "-")
            .match(/\d+/g);
          const repMin = Number(ex.targetRepMin ?? rangeParts?.[0] ?? 8);
          const repMax = Number(ex.targetRepMax ?? rangeParts?.[1] ?? repMin);

          return {
            id: ex.id,
            name: ex.name,
            isCompound: ex.isCompound ?? true,
            targetRepMin: repMin,
            targetRepMax: repMax,
            targetRir: Number(ex.targetRir ?? 2),
            loadKg: Number(ex.loadKg ?? 0),
            completedSetsCount,
            repsAchieved: Number(ex.repsAchieved ?? repMax),
            observedRir: Number(ex.observedRir ?? ex.targetRir ?? 2),
          };
        })
        .filter(Boolean) as WorkoutHistoryExercise[];

      if (completedExercises.length > 0) {
        const entry: WorkoutHistoryEntry = {
          id: `wh-${Date.now()}`,
          date: new Date().toISOString(),
          workoutName: current.name || "Sesión de Entreno",
          modality: p.trainingModality || "hypertrophy",
          environment: p.entornoEntreno || "gym",
          exercises: completedExercises,
        };
        setWorkoutHistory((prev) => [...prev, entry].slice(-60));
      }
    }

    setActiveWorkout(null);
  }, []);

  const clearAshwagandhaSafetyGate = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      ashwagandhaSafetyCleared: true,
    }));
  }, []);

  const updateBiomechanicalScore = useCallback(
    (movementId: string, score: 1 | 2 | 3, notes?: string) => {
      setProfile((prev) => ({
        ...prev,
        biomechanicalScreen: {
          ...(prev.biomechanicalScreen || {}),
          [movementId]: { score, notes },
        },
      }));
    },
    []
  );

  // Supplement checklist action con activación de amortiguación hídrica de Creatina
  // y compuerta hepática obligatoria para Ashwagandha
  const toggleSupplementChecked = useCallback((supplementId: string) => {
    const nextChecked = !checklistRef.current?.[supplementId];

    if (
      supplementId === "ash" &&
      nextChecked &&
      !profileRef.current.ashwagandhaSafetyCleared
    ) {
      // Compuerta obligatoria: impide habilitar Ashwagandha hasta pasar evaluación hepática
      return;
    }

    setSupplementChecklist((prev) => ({
      ...prev,
      [supplementId]: nextChecked,
    }));

    if (supplementId === "cre") {
      setProfile((prev) => ({
        ...prev,
        creatineActivatedAt: nextChecked ? prev.creatineActivatedAt ?? Date.now() : null,
      }));
    }
  }, []);

  // Hormonal lab values
  const updateHormonalLab = useCallback(
    (key: keyof HormonalLabValues, value: number) => {
      setHormonalLabValues((prev) => ({ ...prev, [key]: value }));
    },
    [setHormonalLabValues]
  );

  // Supplement custom overrides
  const updateSupplementCustom = useCallback(
    (id: string, patch: Partial<SupplementCustom>) => {
      setCustomSupplementDose((prev) => ({
        ...prev,
        [id]: { active: true, ...prev[id], ...patch },
      }));
    },
    [setCustomSupplementDose]
  );

  // Cooldown live countdown ticker
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = setInterval(() => {
      const remaining = Math.ceil(getCooldownRemaining() / 1000);
      setCooldownSeconds(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  // Stale detection: mark stale when lab values or EA changes
  const prevLabsRef = useRef(JSON.stringify(hormonalLabValues));
  const prevEARef = useRef(clinicalMetrics.energyAvailability);
  useEffect(() => {
    const labsStr = JSON.stringify(hormonalLabValues);
    const eaChanged = clinicalMetrics.energyAvailability !== prevEARef.current;
    const labsChanged = labsStr !== prevLabsRef.current;
    if (labsChanged || eaChanged) {
      setIsATOStale(true);
      prevLabsRef.current = labsStr;
      prevEARef.current = clinicalMetrics.energyAvailability;
    }
  }, [hormonalLabValues, clinicalMetrics.energyAvailability]);

  // Trigger ATO Diagnosis
  const triggerATODiagnosis = useCallback(
    async (forceManual = false) => {
      if (isATOPending) return;

      const cooldownMs = getCooldownRemaining();
      const input: ATOInput = {
        labs: hormonalLabValues,
        energyAvailability: clinicalMetrics.energyAvailability,
        profile: {
          age: profile.edad,
          bodyFat: profile.bodyFat ?? 15,
          activityFactor: profile.nivelActividad,
          mesocycleWeek: profile.mesocycleWeek,
          deficitTarget: clinicalMetrics.effectiveDeficitTarget,
          cnsReadiness: profile.cnsReadiness,
          weightLogs: profile.weightLogs,
        },
      };

      if (cooldownMs > 0 && forceManual) {
        const secs = Math.ceil(cooldownMs / 1000);
        console.info(`[ATO] API cooldown active. ${secs}s remaining. Cache will be checked.`);
      }

      setIsATOPending(true);
      try {
        const result = await runATODiagnosis(input);
        if (result.directive) {
          setAtoDirective(result.directive);
          setIsATOStale(false);
          safeSetItem(SIE_STORAGE_KEYS.ATO, result.directive);
        } else if (result.cooldownRemaining && result.cooldownRemaining > 0) {
          const remaining = Math.ceil(result.cooldownRemaining / 1000);
          setCooldownSeconds(remaining);
        }
      } finally {
        setIsATOPending(false);
        const remaining = Math.ceil(getCooldownRemaining() / 1000);
        if (remaining > 0) setCooldownSeconds(remaining);
      }
    },
    [
      isATOPending,
      hormonalLabValues,
      clinicalMetrics.energyAvailability,
      clinicalMetrics.effectiveDeficitTarget,
      profile.edad,
      profile.bodyFat,
      profile.nivelActividad,
      profile.mesocycleWeek,
      profile.cnsReadiness,
      profile.weightLogs,
    ]
  );

  // Passive Auto-Trigger: 15s idle when stale
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isATOStale || isATOPending || cooldownSeconds > 0) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }
    idleTimerRef.current = setTimeout(() => {
      triggerATODiagnosis(false);
    }, 15_000);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isATOStale, isATOPending, cooldownSeconds, triggerATODiagnosis]);

  // Memoized provider value to prevent unnecessary global rerenders
  const contextValue = useMemo(
    () => ({
      profile,
      metrics: clinicalMetrics,
      foodLogs,
      customFoods,
      activeWorkout,
      workoutHistory,
      supplements: CLINICAL_SUPPLEMENTS,
      supplementChecklist,
      hormonalLabValues,
      customSupplementDose,
      labSuppressed,
      updateProfileVariable,
      addWeightLog,
      logSleepHours,
      updateDailySteps,
      logDailyTelemetry,
      logFoodItem,
      addCustomFood,
      removeFoodLog,
      clearFoodLogs,
      startWorkout,
      toggleWorkoutSet,
      finishWorkout,
      toggleSupplementChecked,
      clearAshwagandhaSafetyGate,
      updateBiomechanicalScore,
      updateWorkoutExerciseLoad,
      updateExerciseLoadOverride,
      addCustomExercise,
      updateHormonalLab,
      updateSupplementCustom,
      activeGlossaryId,
      setActiveGlossaryId,
      atoDirective,
      isATOPending,
      isATOStale,
      cooldownSeconds,
      triggerATODiagnosis,
    }),
    [
      profile,
      clinicalMetrics,
      foodLogs,
      customFoods,
      activeWorkout,
      workoutHistory,
      supplementChecklist,
      hormonalLabValues,
      customSupplementDose,
      labSuppressed,
      updateProfileVariable,
      addWeightLog,
      logSleepHours,
      updateDailySteps,
      logDailyTelemetry,
      logFoodItem,
      addCustomFood,
      removeFoodLog,
      clearFoodLogs,
      startWorkout,
      toggleWorkoutSet,
      finishWorkout,
      toggleSupplementChecked,
      clearAshwagandhaSafetyGate,
      updateBiomechanicalScore,
      updateWorkoutExerciseLoad,
      updateExerciseLoadOverride,
      addCustomExercise,
      updateHormonalLab,
      updateSupplementCustom,
      activeGlossaryId,
      atoDirective,
      isATOPending,
      isATOStale,
      cooldownSeconds,
      triggerATODiagnosis,
    ]
  );

  return (
    <ClinicalEngineContext.Provider value={contextValue}>
      {children}
    </ClinicalEngineContext.Provider>
  );
}

export function useClinicalEngine() {
  const context = useContext(ClinicalEngineContext);
  if (!context) throw new Error("useClinicalEngine must be used within ClinicalEngineProvider");
  return context;
}
