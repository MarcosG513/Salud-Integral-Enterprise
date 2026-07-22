import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { runATODiagnosis, getCooldownRemaining, ATODirective, ATOInput } from '../services/atoOrchestrator';

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
  { id: "cre", name: "Monohidrato de Creatina", abbr: "CrM", dose: "5.0 g", saturationBase: 100, pathway: "Resíntesis de ATP", cls: "A" },
  { id: "cit", name: "Malato de L-Citrulina", abbr: "CitM", dose: "8.0 g", saturationBase: 0, pathway: "Saturación de eNOS", cls: "A" },
  { id: "ash", name: "Ashwagandha KSM-66", abbr: "KSM", dose: "600 mg", saturationBase: 74, pathway: "Atenuación de Cortisol", cls: "A" },
  { id: "caf", name: "Cafeína Anhidra", abbr: "CAF", dose: "200 mg", saturationBase: 88, pathway: "Antagonismo de Adenosina", cls: "A" },
  { id: "bet", name: "Beta-Alanina", abbr: "β-ALA", dose: "3.2 g", saturationBase: 50, pathway: "Amortiguación de Carnosina", cls: "A" },
  { id: "the", name: "L-Teanina", abbr: "THN", dose: "100 mg", saturationBase: 62, pathway: "Modulación de Ondas Alfa", cls: "B" },
  { id: "mg", name: "Glicinato de Magnesio", abbr: "MG", dose: "400 mg", saturationBase: 80, pathway: "Regulación de NMDA", cls: "A" },
  { id: "zn", name: "Picolinato de Zinc", abbr: "ZN", dose: "30 mg", saturationBase: 70, pathway: "Soporte Androgénico", cls: "A" },
  { id: "o3", name: "Aceite de Pescado Omega-3", abbr: "O3", dose: "2.0 g", saturationBase: 85, pathway: "Sincronización de Membrana Celular", cls: "A" },
  { id: "d3", name: "Vitamina D3", abbr: "D3", dose: "5000 UI", saturationBase: 90, pathway: "Transcripción del Receptor Nuclear", cls: "A" },
  { id: "wpi", name: "Aislado de Proteína de Suero", abbr: "WPI", dose: "30 g", saturationBase: 95, pathway: "Estimulación de MPS", cls: "A" },
  { id: "mel", name: "Melatonina", abbr: "MEL", dose: "3 mg", saturationBase: 100, pathway: "Agonismo de MT1/MT2", cls: "B" }
];

// ─── Hormonal Lab Reference Ranges ──────────────────────────────────────────
export interface HormonalLabValues {
  lh: number;        // UI/L   — normal men: 1.7–8.6
  fsh: number;       // UI/L   — normal men: 1.5–12.4
  testosterone: number; // ng/dL  — normal: 300–1000
  shbg: number;      // nmol/L — normal: 10–57
  cortisol: number;  // µg/dL  — morning: 6–23
  prolactina?: number; // ng/mL  — normal men: 2–18
  estradiol?: number;  // pg/mL  — normal men: 20–40
}

const DEFAULT_HORMONAL_LABS: HormonalLabValues = {
  lh: 3.8,
  fsh: 4.2,
  testosterone: 650,
  shbg: 34,
  cortisol: 14.2,
  prolactina: 8.5,
  estradiol: 28
};

// ─── Supplement custom overrides ────────────────────────────────────────────
export interface SupplementCustom {
  doseOverride?: string;
  timingSlot?: string;
  active: boolean;
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {}
  };

  return [storedValue, setValue];
}

export function ClinicalEngineProvider({ children }: { children: React.ReactNode }) {
  // User profile settings
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('user_profile_v5');
    return saved ? JSON.parse(saved) : {
      username: "Marcos M.",
      weightLogs: [85.4, 84.8, 85.1, 84.9, 84.6, 85.0, 84.7],
      height: 181,
      age: 34,
      sex: "male",
      bodyFat: 14.5,
      activityFactor: 1.55,
      deficitTarget: 500,
      exerciseCalories: 400,
      citrullineGrams: 8.0,
      citrullineTimingMin: 35,
      doreySessionsPerWeek: 3,
      cnsReadiness: 85,
      mesocycleWeek: 3,
      routineType: "Gym", // "Gym" | "Casa" | "PRO"
      proteinMultiplier: 2.2,
      fatMultiplier: 1.0,
      customRoutines: {},
      exerciseLoadOverrides: {}  // { [exerciseId]: loadKg }
    };
  });

  // Food logs (array of logged items)
  const [foodLogs, setFoodLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('food_logs_v5');
    return saved ? JSON.parse(saved) : [
      { id: "avena-init", name: "Avena", category: "Grano / Carb", kcal: 389, protein: 16.9, carbs: 66.3, fats: 6.9, grams: 80, timestamp: Date.now() },
      { id: "pollo-init", name: "Pechuga de Pollo", category: "Proteína magra", kcal: 165, protein: 31.0, carbs: 0.0, fats: 3.6, grams: 200, timestamp: Date.now() }
    ];
  });

  // Custom foods database
  const [customFoods, setCustomFoods] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('custom_foods_v5');
    return saved ? JSON.parse(saved) : {};
  });

  // Active workout tracker
  const [activeWorkout, setActiveWorkout] = useState<any>(() => {
    const saved = localStorage.getItem('active_workout_v5');
    return saved ? JSON.parse(saved) : null;
  });

  // Supplement checklist selections
  const [supplementChecklist, setSupplementChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('supplement_checklist_v5');
    return saved ? JSON.parse(saved) : {
      cre: true,
      ash: true,
      caf: false,
      bet: true,
      mg: true,
      zn: true
    };
  });

  // ── V6 NEW: Hormonal Lab Values (real bloodwork input) ─────────────────────
  const [hormonalLabValues, setHormonalLabValues] = useLocalStorage<HormonalLabValues>(
    "hormonal_labs_v6",
    DEFAULT_HORMONAL_LABS
  );

  // ── V6 NEW: Supplement Custom Dose/Timing Overrides ────────────────────────
  const [customSupplementDose, setCustomSupplementDose] = useLocalStorage<Record<string, SupplementCustom>>(
    "supplement_custom_v6",
    {}
  );

  const [activeGlossaryId, setActiveGlossaryId] = useLocalStorage<string | null>("v5_active_glossary", null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('user_profile_v5', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('food_logs_v5', JSON.stringify(foodLogs));
  }, [foodLogs]);

  useEffect(() => {
    localStorage.setItem('custom_foods_v5', JSON.stringify(customFoods));
  }, [customFoods]);

  useEffect(() => {
    localStorage.setItem('active_workout_v5', JSON.stringify(activeWorkout));
  }, [activeWorkout]);

  useEffect(() => {
    localStorage.setItem('supplement_checklist_v5', JSON.stringify(supplementChecklist));
  }, [supplementChecklist]);

  // --- MOTOR CLÍNICO DE CÁLCULO (useMemo) ---
  const clinicalMetrics = useMemo(() => {
    const {
      weightLogs, bodyFat, height, age, sex, activityFactor,
      deficitTarget, exerciseCalories, citrullineGrams,
      citrullineTimingMin, doreySessionsPerWeek, cnsReadiness, mesocycleWeek,
      superavit, factorProteina, factorGrasa
    } = profile;

    // Ensure compatibility with profile.superavit, profile.factorProteina, and profile.factorGrasa
    const currentDeficitTarget = superavit !== undefined 
      ? superavit 
      : (deficitTarget !== undefined ? deficitTarget : 500);

    const currentProteinMultiplier = factorProteina !== undefined
      ? factorProteina
      : (profile.proteinMultiplier !== undefined ? profile.proteinMultiplier : undefined);

    const currentFatMultiplier = factorGrasa !== undefined
      ? factorGrasa
      : (profile.fatMultiplier !== undefined ? profile.fatMultiplier : undefined);

    // 1. Algoritmo de Suavizado de Tendencia de Peso (EMA-20 Window)
    const alpha = 0.095;
    let trendWeight = weightLogs[0] || 70;
    for (let i = 1; i < weightLogs.length; i++) {
      trendWeight = (weightLogs[i] * alpha) + (trendWeight * (1 - alpha));
    }
    trendWeight = Number(trendWeight.toFixed(2));

    // 2. Masa Libre de Grasa (FFM)
    const ffm = Number((trendWeight * (1 - bodyFat / 100)).toFixed(2));

    // 3. Tasa Metabólica Basal (Cunningham Priority & Fallback)
    let bmr = 0;
    let bmrMethod = "CUNNINGHAM";
    if (bodyFat && bodyFat > 0) {
      bmr = 370 + (21.6 * ffm);
    } else {
      bmrMethod = "MIFFLIN-ST JEOR (Fallback)";
      bmr = (10 * trendWeight) + (6.25 * height) - (5 * age) + (sex === 'male' ? 5 : -161);
    }
    bmr = Math.round(bmr);

    // 4. Gasto Energético Diario Total (TDEE Adaptativo)
    const tdee = Math.round(bmr * activityFactor);

    // 5. Ingesta Energética Objetivo Inicial
    let targetCalories = tdee - currentDeficitTarget;

    // 6. Gasto Hidratación Diario Total (Dynamic Hydration Formula)
    const hydrationLiters = Number(((trendWeight * 0.033) + (activityFactor - 1.0) * 1.5).toFixed(2));

    // 7. Evaluación de Disponibilidad Energética (EA) y Diagnóstico de LEA/RED-S
    const energyAvailability = (targetCalories - exerciseCalories) / ffm;
    const isREDSTriggered = energyAvailability < 30;

    // 8. Fisiología Macro-Adjustment Multiplier Effect
    let proteinFactor = currentProteinMultiplier !== undefined ? currentProteinMultiplier : 2.0;
    let fatFactor = currentFatMultiplier !== undefined ? currentFatMultiplier : 1.0;

    if (currentProteinMultiplier === undefined) {
      if (age > 40) {
        proteinFactor += 0.2;
      } else if (age < 25) {
        proteinFactor += 0.1;
      }
      if (sex === "female") {
        proteinFactor = 1.8;
      }
      if (activityFactor >= 1.7) {
        proteinFactor += 0.2;
      }
    }

    if (currentFatMultiplier === undefined) {
      if (sex === "female") {
        fatFactor = 1.1;
      }
    }

    let proteinGrams = Math.round(trendWeight * proteinFactor);
    let fatGrams = trendWeight * fatFactor;

    const MIN_FAT_THRESHOLD = Number((trendWeight * 0.6).toFixed(1));
    let isHardClampActive = false;

    if (fatGrams < MIN_FAT_THRESHOLD) {
      fatGrams = MIN_FAT_THRESHOLD;
      isHardClampActive = true;
    }

    if (isREDSTriggered) {
      fatGrams = MIN_FAT_THRESHOLD;
      isHardClampActive = true;
    }

    let proteinCalories = proteinGrams * 4;
    let fatCalories = fatGrams * 9;
    
    let remainingCalories = targetCalories - proteinCalories - fatCalories;
    let carbGrams = remainingCalories > 0 ? Math.round(remainingCalories / 4) : 0;

    // 9. Consumed Calories & Macros Calculation
    let consumedCalories = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;

    foodLogs.forEach(item => {
      const factor = (item.grams || 100) / 100;
      consumedCalories += (item.kcal || 0) * factor;
      consumedProtein += (item.protein || 0) * factor;
      consumedCarbs += (item.carbs || 0) * factor;
      consumedFat += (item.fats || 0) * factor;
    });

    consumedCalories = Math.round(consumedCalories);
    consumedProtein = Number(consumedProtein.toFixed(1));
    consumedCarbs = Number(consumedCarbs.toFixed(1));
    consumedFat = Number(consumedFat.toFixed(1));

    // 10. Índice de Óxido Nítrico Endotelial (NOx Index)
    let noxScore = 0;
    if (citrullineGrams >= 6 && citrullineGrams <= 8) noxScore += 60;
    else if (citrullineGrams > 0) noxScore += 30;
    
    if (citrullineTimingMin >= 30 && citrullineTimingMin <= 45) noxScore += 40;
    else if (citrullineTimingMin > 0) noxScore += 15;

    // 11. Score del Suelo Pélvico (Dorey Compliance)
    const doreyPercentage = Math.round((doreySessionsPerWeek / 4) * 100);

    // 12. Landmarks de Volumen de Hipertrofia y Regulación del SNC
    const isCaloricDeficitActive = deficitTarget > 0;
    const isSNCHyperexcited = cnsReadiness < 70 || isCaloricDeficitActive;
    
    let hypertrophySetsText = "";
    let intensityTargetText = "";
    let isSNCOverrideActive = false;

    switch (mesocycleWeek) {
      case 1:
        hypertrophySetsText = "10 - 12 series semanales (MEV)";
        intensityTargetText = "RIR 3 (Carga base)";
        break;
      case 2:
        hypertrophySetsText = "12 - 16 series semanales (MAV-1)";
        intensityTargetText = "RIR 2 (Progresivo)";
        break;
      case 3:
      case 4:
        if (isSNCHyperexcited) {
          hypertrophySetsText = "Máx 3 series fijas por movimiento";
          intensityTargetText = "RIR 2 (Anulación por Fatiga / SNC Protegido)";
          isSNCOverrideActive = true;
        } else {
          hypertrophySetsText = mesocycleWeek === 3 ? "16 - 20 series (MAV-2)" : "20 - 24 series (MRV - Hito Límite)";
          intensityTargetText = mesocycleWeek === 3 ? "RIR 1" : "RIR 0 (Fallo Muscular)";
        }
        break;
      case 5:
        hypertrophySetsText = "Reducción al 50% (6-8 series)";
        intensityTargetText = "RIR 4+ (Descarga Clínica Restaurativa)";
        break;
      default:
        hypertrophySetsText = "12 series base";
        intensityTargetText = "RIR 2";
    }

    // 13. HPG Axis Status from lab values (if user has entered them)
    // Uses hormonalLabValues for axis suppression determination if available

    return {
      trendWeight,
      ffm,
      bmr,
      bmrMethod,
      tdee,
      targetCalories,
      energyAvailability: Number(energyAvailability.toFixed(2)),
      isREDSTriggered,
      isHardClampActive,
      hydrationLiters,
      macros: {
        protein: proteinGrams,
        carbs: carbGrams,
        fat: Math.round(fatGrams)
      },
      consumedMacros: {
        calories: consumedCalories,
        protein: consumedProtein,
        carbs: consumedCarbs,
        fat: consumedFat
      },
      noxScore,
      doreyPercentage,
      training: {
        sets: hypertrophySetsText,
        intensity: intensityTargetText,
        isSNCOverrideActive,
        phaseName: mesocycleWeek === 5 ? "Descarga" : mesocycleWeek === 4 ? "MRV" : "Acumulación"
      }
    };
  }, [profile, foodLogs]);

  // --- ACTIONS ---
  const updateProfileVariable = (key: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const addWeightLog = (weight: number) => {
    setProfile((prev: any) => ({ ...prev, weightLogs: [...prev.weightLogs, weight] }));
  };

  // Nutrition logging actions
  const logFoodItem = (food: any, grams: number) => {
    setFoodLogs(prev => [
      ...prev,
      {
        ...food,
        grams,
        id: `${food.id}-${Date.now()}`,
        timestamp: Date.now()
      }
    ]);
  };

  const addCustomFood = (food: any) => {
    setCustomFoods(prev => ({
      ...prev,
      [food.id]: {
        ...food,
        id: food.id || `custom-${Date.now()}`
      }
    }));
  };

  const removeFoodLog = (id: string) => {
    setFoodLogs(prev => prev.filter(item => item.id !== id));
  };

  const clearFoodLogs = () => {
    setFoodLogs([]);
  };

  // Workout tracking actions
  const startWorkout = (workoutName: string, exercises: any[]) => {
    setActiveWorkout({
      name: workoutName,
      exercises: exercises.map(ex => ({
        ...ex,
        completedSets: Array(ex.sets).fill(false),
        timestamp: Date.now()
      })),
      timestamp: Date.now()
    });
  };

  const toggleWorkoutSet = (exerciseId: string, setIndex: number) => {
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
        })
      };
    });
  };

  const updateWorkoutExerciseLoad = (exerciseId: string, loadKg: number) => {
    setActiveWorkout((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((ex: any) => {
          if (ex.id === exerciseId) {
            return { ...ex, loadKg };
          }
          return ex;
        })
      };
    });
  };

  // V6: Update exercise load override (works outside active workout)
  const updateExerciseLoadOverride = (exerciseId: string, loadKg: number) => {
    setProfile((prev: any) => ({
      ...prev,
      exerciseLoadOverrides: {
        ...(prev.exerciseLoadOverrides || {}),
        [exerciseId]: loadKg
      }
    }));
  };

  const addCustomExercise = (rType: string, week: number, ex: any) => {
    setProfile((prev: any) => {
      const customRoutines = prev.customRoutines ? { ...prev.customRoutines } : {};
      if (!customRoutines[rType]) customRoutines[rType] = {};
      if (!customRoutines[rType][week]) customRoutines[rType][week] = { exercises: [] };
      customRoutines[rType][week].exercises.push({
        ...ex,
        id: ex.id || `custom-ex-${Date.now()}`
      });
      return {
        ...prev,
        customRoutines
      };
    });
  };

  const finishWorkout = () => {
    setActiveWorkout(null);
  };

  // Supplement checklist action
  const toggleSupplementChecked = (supplementId: string) => {
    setSupplementChecklist(prev => ({
      ...prev,
      [supplementId]: !prev[supplementId]
    }));
  };

  // V6 NEW: Update individual hormonal lab value
  const updateHormonalLab = (key: keyof HormonalLabValues, value: number) => {
    setHormonalLabValues(prev => ({ ...prev, [key]: value }));
  };

  // V6 NEW: Update supplement custom dose/timing
  const updateSupplementCustom = (id: string, patch: Partial<SupplementCustom>) => {
    setCustomSupplementDose(prev => ({
      ...prev,
      [id]: { active: true, ...prev[id], ...patch }
    }));
  };

  // Derive HPG suppression from real lab values when available
  const labSuppressed = (
    hormonalLabValues.lh < 1.5 ||
    hormonalLabValues.testosterone < 300 ||
    hormonalLabValues.cortisol > 22
  );

  // ── V7: ATO Central Engine States ───────────────────────────────────────────
  const [atoDirective, setAtoDirective] = useState<ATODirective | null>(() => {
    try {
      const saved = localStorage.getItem('ato_directive_current');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isATOPending, setIsATOPending] = useState(false);
  const [isATOStale, setIsATOStale] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(() => Math.ceil(getCooldownRemaining() / 1000));

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

  // ── Trigger ATO Diagnosis ────────────────────────────────────────────────────
  const triggerATODiagnosis = useCallback(async (forceManual = false) => {
    if (isATOPending) return;

    const cooldownMs = getCooldownRemaining();
    const input: ATOInput = {
      labs: hormonalLabValues,
      energyAvailability: clinicalMetrics.energyAvailability,
      profile: {
        age: profile.age,
        bodyFat: profile.bodyFat,
        activityFactor: profile.activityFactor,
        mesocycleWeek: profile.mesocycleWeek,
        deficitTarget: profile.deficitTarget ?? profile.superavit ?? 500,
        cnsReadiness: profile.cnsReadiness,
        weightLogs: profile.weightLogs,
      },
    };

    // If cooldown active and forced manually (no cache), alert and return
    if (cooldownMs > 0 && forceManual) {
      const secs = Math.ceil(cooldownMs / 1000);
      // Non-blocking toast-style alert via console — UI shows countdown badge
      console.info(`[ATO] API cooldown active. ${secs}s remaining. Cache will be checked.`);
    }

    setIsATOPending(true);
    try {
      const result = await runATODiagnosis(input);
      if (result.directive) {
        setAtoDirective(result.directive);
        setIsATOStale(false);
        try {
          localStorage.setItem('ato_directive_current', JSON.stringify(result.directive));
        } catch {}
      } else if (result.cooldownRemaining && result.cooldownRemaining > 0) {
        // Cooldown hit with no cached directive — show countdown
        const remaining = Math.ceil(result.cooldownRemaining / 1000);
        setCooldownSeconds(remaining);
      }
    } finally {
      setIsATOPending(false);
      // Sync cooldown display
      const remaining = Math.ceil(getCooldownRemaining() / 1000);
      if (remaining > 0) setCooldownSeconds(remaining);
    }
  }, [isATOPending, hormonalLabValues, clinicalMetrics.energyAvailability, profile]);

  // ── Passive Auto-Trigger: 15s idle when stale ────────────────────────────────
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

  return (
    <ClinicalEngineContext.Provider value={{ 
      profile, 
      metrics: clinicalMetrics, 
      foodLogs,
      customFoods,
      activeWorkout,
      supplements: CLINICAL_SUPPLEMENTS,
      supplementChecklist,
      hormonalLabValues,
      customSupplementDose,
      labSuppressed,
      updateProfileVariable, 
      addWeightLog,
      logFoodItem,
      addCustomFood,
      removeFoodLog,
      clearFoodLogs,
      startWorkout,
      toggleWorkoutSet,
      finishWorkout,
      toggleSupplementChecked,
      updateWorkoutExerciseLoad,
      updateExerciseLoadOverride,
      addCustomExercise,
      updateHormonalLab,
      updateSupplementCustom,
      activeGlossaryId,
      setActiveGlossaryId,
      // ── V7 ATO ──
      atoDirective,
      isATOPending,
      isATOStale,
      cooldownSeconds,
      triggerATODiagnosis,
    }}>
      {children}
    </ClinicalEngineContext.Provider>
  );
}

export function useClinicalEngine() {
  const context = useContext(ClinicalEngineContext);
  if (!context) throw new Error('useClinicalEngine must be used within ClinicalEngineProvider');
  return context;
}