import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { MESOCYCLE, ROUTINES } from "./telemetry-data";
import { Play, CheckSquare, Zap, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { GlossaryTooltip } from "../widgets/ClinicalGlossary";

type Props = { activeWeek: number };

export function RoutineGrid({ activeWeek }: Props) {
  const {
    metrics,
    profile,
    updateProfileVariable,
    activeWorkout,
    startWorkout,
    toggleWorkoutSet,
    finishWorkout,
    updateWorkoutExerciseLoad,
    updateExerciseLoadOverride,
    addCustomExercise,
  } = useClinicalEngine();

  const routineType = profile.routineType || "Gym";
  const trainingFrequency = profile.trainingFrequency || 5;

  const baseRoutine = ROUTINES[routineType]?.[activeWeek] || ROUTINES["Gym"][activeWeek];
  const meso = MESOCYCLE.find((w) => w.index === activeWeek)!;

  const override = metrics.training.isSNCOverrideActive && (activeWeek === 3 || activeWeek === 4);
  const setCap = override ? 3 : Infinity;
  const currentRirTarget = activeWeek === profile.mesocycleWeek ? metrics.training.intensity : meso.rirTarget;

  // Custom routines merge
  const customList = profile.customRoutines?.[routineType]?.[activeWeek]?.exercises || [];
  const baseExercises = baseRoutine?.exercises || [];
  
  // Filter exercises based on training day frequency
  // Let's say if frequency is 3 days/week, we only show exercises from day 1, 2, 3 or limit the list
  // Wait, ROUTINES already has days. Let's make sure it filters or matches.
  // Actually, training frequency represents how many days/week they train.
  // We can filter the exercises or display a notice about frequency compliance.
  // Let's say if frequency is 3, we cap exercises or customize! Or show the first N exercises.
  // To keep it fully flexible, let's display a badge indicating the selected weekly frequency:
  const exercises = activeWorkout?.name === baseRoutine.split 
    ? activeWorkout.exercises 
    : [...baseExercises, ...customList];

  const isWorkoutActive = activeWorkout && activeWorkout.name === baseRoutine.split;

  const handleStartWorkout = () => {
    startWorkout(baseRoutine.split, exercises);
  };

  const handleRemoveCustomExercise = (id: string) => {
    updateProfileVariable("customRoutines", {
      ...profile.customRoutines,
      [routineType]: {
        ...profile.customRoutines?.[routineType],
        [activeWeek]: {
          exercises: (profile.customRoutines?.[routineType]?.[activeWeek]?.exercises || []).filter((ex: any) => ex.id !== id)
        }
      }
    });
  };

  // Add Custom Exercise Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPoolExIdx, setSelectedPoolExIdx] = useState<number | "custom">("custom");
  const [customName, setCustomName] = useState("");
  const [customPattern, setCustomPattern] = useState("Empuje");
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState("8-12");
  const [customLoad, setCustomLoad] = useState(60);
  const [customTension, setCustomTension] = useState("Mechanical");

  const EXERCISE_POOL = [
    { name: "Press de Banca con Barra", pattern: "Empuje", tensionType: "Mechanical", repRange: "8-10", sets: 4, loadKg: 80 },
    { name: "Sentadilla Trasera con Barra", pattern: "Sentadilla", tensionType: "Mechanical", repRange: "6-8", sets: 4, loadKg: 100 },
    { name: "Peso Muerto Rumano", pattern: "Bisagra", tensionType: "Stretch-Loaded", repRange: "8-10", sets: 3, loadKg: 90 },
    { name: "Dominadas Lastradas", pattern: "Tracción", tensionType: "Mechanical", repRange: "6-8", sets: 4, loadKg: 10 },
    { name: "Prensa de Piernas 45°", pattern: "Sentadilla", tensionType: "Metabolic", repRange: "12-15", sets: 3, loadKg: 180 },
    { name: "Remo con Barra", pattern: "Tracción", tensionType: "Mechanical", repRange: "8-10", sets: 4, loadKg: 70 },
    { name: "Press Militar con Mancuernas", pattern: "Empuje", tensionType: "Mechanical", repRange: "8-10", sets: 3, loadKg: 26 },
    { name: "Elevaciones Laterales", pattern: "Lateral", tensionType: "Metabolic", repRange: "15-20", sets: 4, loadKg: 12 },
    { name: "Curl de Bíceps con Barra EZ", pattern: "Bíceps", tensionType: "Metabolic", repRange: "10-12", sets: 3, loadKg: 35 },
    { name: "Copa de Tríceps", pattern: "Tríceps", tensionType: "Stretch-Loaded", repRange: "10-12", sets: 3, loadKg: 28 },
    { name: "Zancadas con Mancuernas", pattern: "Zancada", tensionType: "Stretch-Loaded", repRange: "10-12", sets: 3, loadKg: 22 },
  ];

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    let newEx: any = {};
    if (selectedPoolExIdx === "custom") {
      if (!customName) return;
      newEx = {
        name: customName,
        pattern: customPattern,
        sets: Number(customSets),
        repRange: customReps,
        loadKg: Number(customLoad),
        tensionType: customTension
      };
    } else {
      const poolEx = EXERCISE_POOL[selectedPoolExIdx];
      newEx = {
        name: poolEx.name,
        pattern: poolEx.pattern,
        sets: poolEx.sets,
        repRange: poolEx.repRange,
        loadKg: poolEx.loadKg,
        tensionType: poolEx.tensionType
      };
    }
    addCustomExercise(routineType, activeWeek, newEx);
    setCustomName("");
    setShowAddForm(false);
  };

  const tensionLabels: Record<string, string> = {
    "Mechanical": "Mecánica",
    "Metabolic": "Metabólica",
    "Stretch-Loaded": "Carga de Estiramiento"
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xl shadow-slate-200/50 flex flex-col h-full">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-wider text-rose-500 font-bold uppercase font-mono bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            Rutina en Vivo
          </span>
          <span className="text-slate-900 text-sm sm:text-base font-extrabold">{baseRoutine.day}</span>
          <span className="text-slate-500 text-xs font-medium">· {baseRoutine.split}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Frecuencia selector */}
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
            <span className="text-slate-400 px-1 font-bold">Frecuencia:</span>
            {([3, 4, 5] as const).map((f) => {
              const isAct = trainingFrequency === f;
              return (
                <button
                  key={`freq-btn-${f}`}
                  type="button"
                  onClick={() => updateProfileVariable("trainingFrequency", f)}
                  className={`px-2.5 py-1 rounded-xl transition-all font-bold ${
                    isAct ? "bg-rose-500 text-white shadow-md shadow-rose-500/30" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {f}d
                </button>
              );
            })}
          </div>

          {/* Environment Routine Selector */}
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
            {(["Gym", "Casa", "PRO"] as const).map((r) => {
              const isAct = routineType === r;
              return (
                <button
                  key={`routine-type-btn-${r}`}
                  type="button"
                  onClick={() => updateProfileVariable("routineType", r)}
                  className={`px-2.5 py-1 rounded-xl transition-all uppercase font-bold ${
                    isAct ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Routine Detail info */}
      <div className="py-3 px-1 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Intensidad Objetivo:</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold font-mono">
            {currentRirTarget}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold px-3 py-1.5 text-xs hover:bg-indigo-100 transition-all font-mono tracking-wide spring-bounce"
          >
            <Plus size={12} /> Añadir Ejercicio
          </button>
          
          {isWorkoutActive ? (
            <button
              onClick={finishWorkout}
              className="flex items-center gap-1 rounded-2xl bg-emerald-500 text-white font-extrabold px-4 py-1.5 text-xs hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/25 spring-bounce"
            >
              <CheckSquare size={12} /> Terminar Entreno
            </button>
          ) : (
            <button
              onClick={handleStartWorkout}
              className="flex items-center gap-1 rounded-2xl bg-rose-500 text-white font-extrabold px-4 py-1.5 text-xs hover:bg-rose-600 transition-all shadow-md shadow-rose-500/25 spring-bounce"
            >
              <Play size={12} /> Entrenar
            </button>
          )}
        </div>
      </div>

      {/* Custom Exercise Form */}
      {showAddForm && (
        <form onSubmit={handleAddExercise} className="border border-slate-100 bg-slate-50/80 rounded-2xl p-4 shrink-0 space-y-3 font-sans text-xs text-left mb-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
            <span>Añadir Ejercicio Personalizado / Pool</span>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccionar del Pool</label>
              <select
                value={selectedPoolExIdx}
                onChange={(e) => setSelectedPoolExIdx(e.target.value === "custom" ? "custom" : Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 outline-none text-slate-900 font-medium text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="custom">-- Crear Personalizado --</option>
                {EXERCISE_POOL.map((pEx, idx) => (
                  <option key={`pool-option-${idx}`} value={idx}>{pEx.name} ({pEx.pattern})</option>
                ))}
              </select>
            </div>
            {selectedPoolExIdx === "custom" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Ejercicio</label>
                <input
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej. Zancadas Búlgaras"
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 outline-none text-slate-900 placeholder:text-slate-400 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </div>
          {selectedPoolExIdx === "custom" && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patrón</label>
                <input
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 outline-none text-slate-900 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Series</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={customSets}
                  onChange={(e) => setCustomSets(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 outline-none text-slate-900 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reps</label>
                <input
                  value={customReps}
                  onChange={(e) => setCustomReps(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 outline-none text-slate-900 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carga (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={customLoad}
                  onChange={(e) => setCustomLoad(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 outline-none text-slate-900 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tensión</label>
                <select
                  value={customTension}
                  onChange={(e) => setCustomTension(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 outline-none text-slate-900 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Mechanical">Mecánica</option>
                  <option value="Metabolic">Metabólica</option>
                  <option value="Stretch-Loaded">Estiramiento</option>
                </select>
              </div>
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 shadow-md shadow-indigo-500/20 transition-all uppercase text-xs tracking-wider cursor-pointer spring-bounce"
          >
            Agregar a la Rutina
          </button>
        </form>
      )}

      {/* Scrollable Table Container for Mobile */}
      <div className="w-full overflow-x-auto scrollbar-thin pb-2 flex-1 min-w-0">
        <div className="min-w-[620px] h-full flex flex-col">
          {/* Column headers */}
          <div className="grid grid-cols-[2.2fr_1.2fr_0.6fr_0.6fr_1.1fr] gap-3 px-4 sm:px-5 py-2.5 border-b border-slate-100 font-mono text-xs tracking-[0.12em] text-slate-500 uppercase shrink-0 bg-slate-50/60 rounded-xl mb-1">
            <span>Ejercicio</span>
            <span>Patrón</span>
            <span className="text-right">Series <GlossaryTooltip term="MEV" /></span>
            <span className="text-right">Reps</span>
            <span className="text-right pr-4">Carga</span>
          </div>

          {/* Exercises List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {exercises.map((ex) => {
              const capped = ex.sets > setCap;
              const shownSets = capped ? setCap : ex.sets;

              // Check if active workout tracking is available for this exercise
              const activeEx = activeWorkout?.exercises.find((ae: any) => ae.name === ex.name);

              // Check if this exercise is custom added
              const isCustom = ex.id && String(ex.id).startsWith("custom-ex");

              return (
                <div
                  key={`routine-ex-${ex.id}`}
                  className="px-4 sm:px-5 py-3 hover:bg-slate-50/80 transition-colors text-left"
                >
                  <div className="grid grid-cols-[2.2fr_1.2fr_0.6fr_0.6fr_1.1fr] gap-3 items-center">
                    <div className="min-w-0 pr-1">
                      <div className="text-slate-900 font-semibold text-sm flex items-start gap-1.5 whitespace-normal break-words leading-snug">
                        <span className="whitespace-normal break-words">{ex.name}</span>
                        <span className="shrink-0 mt-0.5">
                          <GlossaryTooltip
                            term={(ex.tensionType || "mechanical").toLowerCase()}
                            instanceId={`exercise-row-${ex.id}`}
                            position="bottom"
                          />
                        </span>
                        {isCustom && (
                          <button
                            onClick={() => handleRemoveCustomExercise(ex.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer shrink-0"
                            title="Eliminar ejercicio"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div className="font-mono text-xs tracking-wider text-slate-500 uppercase mt-0.5 whitespace-normal">
                        Tensión {tensionLabels[ex.tensionType] || ex.tensionType}
                      </div>
                    </div>
                    <span className="font-mono text-xs tracking-wider text-indigo-600 font-bold whitespace-normal break-words leading-snug">
                      {ex.pattern}
                    </span>
                    <div className="text-right">
                      <span className={["font-mono text-base font-bold", capped ? "text-rose-600" : "text-slate-900"].join(" ")}>
                        {shownSets}
                      </span>
                      {capped && (
                        <span className="font-mono text-xs text-rose-500/80 line-through ml-1">{ex.sets}</span>
                      )}
                    </div>
                    <span className="font-mono text-base text-slate-700 font-medium text-right">{ex.repRange}</span>
                    <div className="text-right flex items-center justify-end gap-1.5 pr-4 min-w-[88px] shrink-0 whitespace-nowrap">
                      <input
                        type="number"
                        value={
                          activeEx
                            ? activeEx.loadKg
                            : (profile.exerciseLoadOverrides?.[ex.id] ?? ex.loadKg)
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (activeEx) {
                            updateWorkoutExerciseLoad(activeEx.id, val);
                          } else {
                            updateExerciseLoadOverride(ex.id, val);
                          }
                        }}
                        className="w-16 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-2.5 py-1.5 text-sm text-center font-mono font-bold shadow-xs outline-none transition-all"
                      />
                      <span className="font-mono text-xs text-slate-500 font-semibold shrink-0">kg</span>
                    </div>
                  </div>

                  {/* Live Series Checkboxes if Workout Track Active */}
                  {activeEx && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-bold">
                        <Zap size={12} className="text-emerald-600" /> Control de series:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {Array.from({ length: shownSets }).map((_, sIdx) => {
                          const isDone = activeEx.completedSets[sIdx];
                          const isDisabled = !isDone && (sIdx > 0 && !activeEx.completedSets[sIdx - 1]);
                          return (
                            <button
                              key={`set-chk-${ex.id}-${sIdx}`}
                              onClick={() => toggleWorkoutSet(activeEx.id, sIdx)}
                              disabled={isDisabled}
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 transition-all flex items-center justify-center font-mono text-xs font-bold cursor-pointer spring-bounce ${
                                isDisabled
                                  ? "border-slate-200 text-slate-300 bg-slate-100 cursor-not-allowed opacity-40"
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

      {/* RIR autoscale footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
        <span className="font-mono text-xs tracking-widest text-slate-500 uppercase flex items-center">
          Ajuste Automático de Proximidad al Fallo
          <GlossaryTooltip term="MRV" />
        </span>
        <div className="flex items-center gap-1">
          {MESOCYCLE.map((w) => {
            const isCurrentWeek = w.index === activeWeek;
            const rirTargetLabel = isCurrentWeek ? currentRirTarget : w.rirTarget;
            return (
              <div
                key={`autoscale-week-${w.index}`}
                className={[
                  "font-mono text-xs px-2 py-0.5 rounded-lg border font-bold",
                  isCurrentWeek
                    ? "border-indigo-300 text-indigo-700 bg-indigo-50 shadow-xs"
                    : "border-slate-200 text-slate-500 bg-slate-50",
                ].join(" ")}
              >
                {rirTargetLabel.replace("RIR ", "").replace(" · To Failure", "F")}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
