import { useMemo, useState } from "react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";
import {
  generateTrainingPlan,
  type PlannedExercise,
  type TrainingPlanOutput,
} from "../../../engine/trainingEngine";
import type { SvgCueKey } from "../../../data/training-catalog";
import { MESOCYCLE } from "./telemetry-data";
import {
  Play,
  CheckSquare,
  Zap,
  Plus,
  Trash2,
  X,
  Flame,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GlossaryTooltip } from "../widgets/ClinicalGlossary";

type Props = {
  activeWeek: number;
  plan?: TrainingPlanOutput;
  onTriggerRest?: (restSeconds: number) => void;
};

/**
 * Guías visuales SVG ligeras inline (cero audio/video para nunca interrumpir música en 2do plano)
 */
function ExerciseSvgCue({ cue }: { cue: SvgCueKey }) {
  const stroke = "#4F46E5";
  switch (cue) {
    case "push":
      return (
        <svg viewBox="0 0 28 28" className="size-7 shrink-0 rounded-lg bg-indigo-50 p-1 border border-indigo-100" fill="none">
          <line x1="4" y1="20" x2="24" y2="20" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 17V7M14 7L10 11M14 7L18 11" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "pull":
      return (
        <svg viewBox="0 0 28 28" className="size-7 shrink-0 rounded-lg bg-sky-50 p-1 border border-sky-100" fill="none">
          <line x1="4" y1="7" x2="24" y2="7" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 10V21M14 21L10 17M14 21L18 17" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "squat":
      return (
        <svg viewBox="0 0 28 28" className="size-7 shrink-0 rounded-lg bg-emerald-50 p-1 border border-emerald-100" fill="none">
          <circle cx="14" cy="6" r="2.2" fill="#059669" />
          <path d="M8 12H20M11 12L9 19L12 23M17 12L19 19L16 23" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "hinge":
      return (
        <svg viewBox="0 0 28 28" className="size-7 shrink-0 rounded-lg bg-amber-50 p-1 border border-amber-100" fill="none">
          <circle cx="9" cy="9" r="2" fill="#D97706" />
          <path d="M9 11L17 13L15 23M17 13L21 20" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "overhead":
      return (
        <svg viewBox="0 0 28 28" className="size-7 shrink-0 rounded-lg bg-purple-50 p-1 border border-purple-100" fill="none">
          <line x1="6" y1="6" x2="22" y2="6" stroke="#9333EA" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M14 22V10M14 10L11 13M14 10L17 13" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "isolation":
    default:
      return (
        <svg viewBox="0 0 28 28" className="size-7 shrink-0 rounded-lg bg-slate-100 p-1 border border-slate-200" fill="none">
          <path d="M7 18C10 11 17 10 21 15" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="21" cy="15" r="2.3" fill={stroke} />
        </svg>
      );
  }
}

export function RoutineGrid({ activeWeek, plan: externalPlan, onTriggerRest }: Props) {
  const {
    metrics,
    profile,
    workoutHistory,
    updateProfileVariable,
    activeWorkout,
    startWorkout,
    toggleWorkoutSet,
    finishWorkout,
    updateWorkoutExerciseLoad,
    updateExerciseLoadOverride,
    addCustomExercise,
  } = useClinicalEngine();

  const entornoEntreno = profile.entornoEntreno || "gym";
  const diasEntrenoSemana = Math.max(2, profile.diasEntrenoSemana || 4);
  const modality = profile.trainingModality || "hypertrophy";

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [expandedWarmupId, setExpandedWarmupId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPattern, setCustomPattern] = useState("Empuje");
  const [customSets, setCustomSets] = useState(3);
  const [customLoad, setCustomLoad] = useState(40);

  const plan = useMemo(() => {
    if (externalPlan) return externalPlan;
    return generateTrainingPlan({
      entornoEntreno,
      diasEntrenoSemana,
      objetivo: profile.objetivo || "fat_loss",
      modality,
      experienceLevel: profile.experienceLevel || "intermediate",
      mesocycleWeek: activeWeek,
      endocrineVolumeReductionPct: metrics.endocrineShield?.recommendedVolumeReductionPct ?? 0,
      sleepProtection: metrics.sleepProtection,
      workoutHistory: workoutHistory || [],
      concurrentCardio: profile.concurrentCardio || { enabled: false, intensity: "low", hoursGap: 3 },
      loadOverrides: profile.exerciseLoadOverrides || {},
    });
  }, [
    externalPlan,
    entornoEntreno,
    diasEntrenoSemana,
    profile,
    modality,
    activeWeek,
    metrics.endocrineShield,
    metrics.sleepProtection,
    workoutHistory,
  ]);

  const safeDayIdx = Math.min(selectedDayIdx, Math.max(0, plan.sessions.length - 1));
  const currentSession = plan.sessions[safeDayIdx] || plan.sessions[0];

  // Merge user custom exercises for this environment & week
  const routineKey = entornoEntreno === "gym" ? "Gym" : "Casa";
  const customList = (profile.customRoutines?.[routineKey]?.[activeWeek]?.exercises || []) as any[];

  const sessionExercises: PlannedExercise[] = useMemo(() => {
    const mappedCustom: PlannedExercise[] = customList.map((cx) => ({
      id: cx.id,
      name: cx.name,
      pattern: cx.pattern || "Personalizado",
      isCompound: false,
      primaryMuscle: "chest",
      synergistMuscles: [],
      sets: Number(cx.sets || 3),
      repMin: plan.prescription.repMin,
      repMax: plan.prescription.repMax,
      repRange: cx.repRange || plan.prescription.repRangeLabel,
      rirTarget: plan.prescription.isolationRirLabel,
      targetRir: 1,
      loadKg: profile.exerciseLoadOverrides?.[cx.id] ?? Number(cx.loadKg || 0),
      restSeconds: plan.prescription.restSeconds,
      nextProgressionCue: "Subir +5% al completar rango superior",
      svgCueKey: "isolation",
      executionCue: "Rango completo y control excéntrico.",
      warmupSets: [],
      progressionAdvice: {
        status: "maintaining",
        badgeText: "Personalizado",
        recommendation: "Sigue la doble progresión al completar series.",
      },
      isCustom: true,
    }));

    const base = [...(currentSession?.exercises || []), ...mappedCustom];
    if (activeWorkout?.name === currentSession?.focusLabel) {
      return activeWorkout.exercises;
    }
    return base;
  }, [currentSession, customList, activeWorkout, plan.prescription, profile.exerciseLoadOverrides]);

  const isWorkoutActive = activeWorkout && activeWorkout.name === currentSession?.focusLabel;

  const handleStartWorkout = () => {
    if (!currentSession) return;
    startWorkout(currentSession.focusLabel, sessionExercises);
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    addCustomExercise(routineKey, activeWeek, {
      name: customName.trim(),
      pattern: customPattern,
      sets: Number(customSets),
      repRange: plan.prescription.repRangeLabel,
      loadKg: Number(customLoad),
      tensionType: "Mechanical",
    });
    setCustomName("");
    setShowAddForm(false);
  };

  const handleRemoveCustomExercise = (id: string) => {
    updateProfileVariable("customRoutines", {
      ...profile.customRoutines,
      [routineKey]: {
        ...profile.customRoutines?.[routineKey],
        [activeWeek]: {
          exercises: (profile.customRoutines?.[routineKey]?.[activeWeek]?.exercises || []).filter(
            (ex: any) => ex.id !== id
          ),
        },
      },
    });
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col h-full">
      {/* Top Header: Environment + Split + Frequency */}
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs tracking-wider text-indigo-700 font-bold uppercase font-mono bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ACSM 2026
          </span>
          <span className="text-slate-900 text-sm sm:text-base font-extrabold">
            {currentSession?.dayCode}: {currentSession?.focusLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Entorno Agnóstico */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 text-[11px] font-bold">
            {(
              [
                { id: "home_bodyweight", label: "Casa Sin Eq." },
                { id: "home_bands_dumbbells", label: "Casa Bandas" },
                { id: "gym", label: "Gym" },
              ] as const
            ).map((env) => {
              const active = entornoEntreno === env.id;
              return (
                <button
                  key={`env-${env.id}`}
                  type="button"
                  onClick={() => updateProfileVariable("entornoEntreno", env.id)}
                  className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {env.label}
                </button>
              );
            })}
          </div>

          {/* Frecuencia (>=2 días) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 text-[11px] font-bold">
            {([2, 3, 4, 5] as const).map((d) => {
              const active = diasEntrenoSemana === d;
              return (
                <button
                  key={`days-${d}`}
                  type="button"
                  onClick={() => updateProfileVariable("diasEntrenoSemana", d)}
                  className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    active ? "bg-rose-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {d}d
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modalidad ACSM 2026 + Días del Split + Botón Entrenar */}
      <div className="py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: "hypertrophy", label: "Hipertrofia" },
              { id: "strength", label: "Fuerza" },
              { id: "power", label: "Potencia" },
              { id: "endurance", label: "Resistencia" },
            ] as const
          ).map((m) => (
            <button
              key={`mod-${m.id}`}
              type="button"
              onClick={() => updateProfileVariable("trainingModality", m.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                modality === m.id
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-3 py-1.5 text-xs hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <Plus size={12} /> Añadir
          </button>

          {isWorkoutActive ? (
            <button
              type="button"
              onClick={finishWorkout}
              className="flex items-center gap-1 rounded-2xl bg-emerald-600 text-white font-extrabold px-4 py-1.5 text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              <CheckSquare size={12} /> Guardar y Terminar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartWorkout}
              className="flex items-center gap-1 rounded-2xl bg-rose-500 text-white font-extrabold px-4 py-1.5 text-xs hover:bg-rose-600 transition-all shadow-md shadow-rose-500/25 cursor-pointer"
            >
              <Play size={12} /> Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Selector de Días de la Semana + Guía ACSM activa */}
      <div className="py-2.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {plan.sessions.map((s) => (
            <button
              key={`day-tab-${s.dayIndex}`}
              type="button"
              onClick={() => setSelectedDayIdx(s.dayIndex)}
              className={`px-3 py-1 rounded-xl font-mono text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                safeDayIdx === s.dayIndex
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {s.dayCode}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-slate-500 font-semibold">
          {plan.prescription.loadSpectrumLabel} · Descanso {plan.prescription.restLabel}
        </span>
      </div>

      {/* Custom Exercise Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddExercise}
          className="border border-slate-200 bg-slate-50/90 rounded-2xl p-4 my-3 shrink-0 space-y-3 text-xs text-left"
        >
          <div className="flex items-center justify-between font-bold uppercase tracking-wider text-slate-700">
            <span>Agregar Ejercicio Extra</span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej. Zancadas Búlgaras"
              className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none"
            />
            <input
              value={customPattern}
              onChange={(e) => setCustomPattern(e.target.value)}
              placeholder="Patrón"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:border-emerald-500 outline-none"
            />
            <div className="flex gap-1.5">
              <input
                type="number"
                min={1}
                max={6}
                value={customSets}
                onChange={(e) => setCustomSets(Number(e.target.value))}
                className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center font-mono text-slate-900"
                title="Series"
              />
              <input
                type="number"
                min={0}
                value={customLoad}
                onChange={(e) => setCustomLoad(Number(e.target.value))}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center font-mono text-slate-900"
                title="Carga kg"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 uppercase text-xs tracking-wider cursor-pointer"
          >
            Agregar a Semana {activeWeek}
          </button>
        </form>
      )}

      {/* Scrollable Table Container */}
      <div className="w-full overflow-x-auto scrollbar-thin pb-2 flex-1 min-w-0 mt-2">
        <div className="min-w-[620px] h-full flex flex-col">
          <div className="grid grid-cols-[2.2fr_1.2fr_0.6fr_0.7fr_1.1fr] gap-3 px-4 sm:px-5 py-2.5 border-b border-slate-100 font-mono text-xs tracking-[0.10em] text-slate-500 uppercase shrink-0 bg-slate-50/60 rounded-xl mb-1">
            <span>Ejercicio & Guía</span>
            <span>Patrón / RIR</span>
            <span className="flex items-center justify-end gap-2 min-w-0 text-right">
              <span className="min-w-0">Series</span>
              <span className="shrink-0 -my-2 -mr-1">
                <GlossaryTooltip term="MEV" />
              </span>
            </span>
            <span className="text-right">Reps</span>
            <span className="text-right pr-4">Carga</span>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {sessionExercises.map((ex) => {
              const warmupOpen = expandedWarmupId === ex.id;
              const advice = ex.progressionAdvice;

              return (
                <div key={`routine-ex-${ex.id}`} className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 transition-colors text-left">
                  <div className="grid grid-cols-[2.2fr_1.2fr_0.6fr_0.7fr_1.1fr] gap-3 items-center">
                    {/* Exercise Identity + SVG visual cue */}
                    <div className="min-w-0 pr-1 flex items-start gap-2.5">
                      <ExerciseSvgCue cue={ex.svgCueKey} />
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-900 font-semibold text-sm flex items-start gap-1.5 whitespace-normal break-words leading-snug">
                          <span className="whitespace-normal break-words">{ex.name}</span>
                          {ex.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomExercise(ex.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0"
                              title="Eliminar ejercicio"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug whitespace-normal">
                          {ex.executionCue}
                        </p>

                        {/* Badges: Calentamiento + Doble Progresión */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {ex.warmupSets && ex.warmupSets.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedWarmupId(warmupOpen ? null : ex.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold cursor-pointer hover:bg-amber-100"
                            >
                              <Flame size={10} />
                              Calentamiento ({ex.warmupSets.length})
                              {warmupOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                          )}
                          {advice && (
                            <button
                              type="button"
                              onClick={() => {
                                if (advice.suggestedNextLoadKg) {
                                  updateExerciseLoadOverride(ex.id, advice.suggestedNextLoadKg);
                                }
                              }}
                              title={advice.recommendation}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold ${
                                advice.status === "ready_to_progress"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-100"
                                  : advice.status === "stalled"
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <TrendingUp size={10} />
                              {advice.badgeText}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pattern & RIR Target */}
                    <div className="min-w-0">
                      <span className="font-mono text-xs tracking-wider text-indigo-600 font-bold whitespace-normal break-words leading-snug block">
                        {ex.pattern}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold block mt-0.5 whitespace-normal">
                        {ex.rirTarget}
                      </span>
                    </div>

                    {/* Sets */}
                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-slate-900">{ex.sets}</span>
                    </div>

                    {/* Reps */}
                    <span className="font-mono text-sm text-slate-700 font-semibold text-right whitespace-nowrap">
                      {ex.repRange}
                    </span>

                    {/* Load Input (kg safely visible, never clipped) */}
                    <div className="text-right flex items-center justify-end gap-1.5 pr-4 min-w-[88px] shrink-0 whitespace-nowrap">
                      <input
                        type="number"
                        value={ex.loadKg}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (isWorkoutActive) {
                            updateWorkoutExerciseLoad(ex.id, val);
                          } else {
                            updateExerciseLoadOverride(ex.id, val);
                          }
                        }}
                        className="w-16 bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-2.5 py-1.5 text-sm text-center font-mono font-bold shadow-xs outline-none transition-all"
                      />
                      <span className="font-mono text-xs text-slate-500 font-semibold shrink-0">kg</span>
                    </div>
                  </div>

                  {/* Autogenerated Warmup Sets Drawer */}
                  {warmupOpen && ex.warmupSets && ex.warmupSets.length > 0 && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                      <div className="text-[11px] font-mono font-bold uppercase text-amber-800">
                        Series de Calentamiento Autogeneradas
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {ex.warmupSets.map((ws) => (
                          <div key={`wu-${ex.id}-${ws.setNumber}`} className="bg-white rounded-xl p-2 border border-amber-100 text-xs">
                            <span className="font-mono font-bold text-slate-900">
                              S{ws.setNumber}: {ws.loadKg !== null ? `${ws.loadKg} kg` : "Peso Corp."} × {ws.reps}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{ws.cue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Session Set Checkboxes -> Auto-triggers ACSM Rest Timer */}
                  {isWorkoutActive && Array.isArray((ex as any).completedSets) && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-bold">
                        <Zap size={12} className="text-emerald-600" />
                        Control de series (Descanso {Math.round(ex.restSeconds)}s):
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {((ex as any).completedSets as boolean[]).map((isDone, sIdx) => {
                          const prevDone = sIdx === 0 || (ex as any).completedSets[sIdx - 1];
                          const isDisabled = !isDone && !prevDone;
                          return (
                            <button
                              key={`set-chk-${ex.id}-${sIdx}`}
                              type="button"
                              onClick={() => {
                                toggleWorkoutSet(ex.id, sIdx);
                                if (!isDone) {
                                  onTriggerRest?.(ex.restSeconds);
                                }
                              }}
                              disabled={isDisabled}
                              className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center font-mono text-xs font-bold cursor-pointer ${
                                isDisabled
                                  ? "border-slate-200 text-slate-300 bg-slate-100 cursor-not-allowed opacity-50"
                                  : isDone
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                  : "bg-white border-slate-300 text-slate-700 hover:border-emerald-500"
                              }`}
                            >
                              {isDone ? "✓" : sIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <span className="font-mono text-xs text-slate-500 font-medium">
          {plan.prescription.techniqueNote}
        </span>
        <div className="flex items-center gap-1">
          {MESOCYCLE.map((w) => (
            <span
              key={`footer-wk-${w.index}`}
              className={`text-[11px] font-mono px-2 py-0.5 rounded-lg ${
                w.index === activeWeek
                  ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200"
                  : "text-slate-400"
              }`}
            >
              S{w.index}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
