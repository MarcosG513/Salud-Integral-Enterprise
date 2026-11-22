import { useMemo, useState } from "react";
import {
  Activity,
  Cpu,
  Radio,
  Compass,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { generateTrainingPlan } from "../../../engine/trainingEngine";
import { BIOMECHANICAL_MOVEMENTS } from "../../../data/training-catalog";
import { MesocycleStrip } from "./MesocycleStrip";
import { VolumeMatrix } from "./VolumeMatrix";
import { RoutineGrid } from "./RoutineGrid";
import { CNSInterceptor } from "./CNSInterceptor";
import { DoreySync } from "./DoreySync";

export function TrainingView() {
  const {
    profile,
    metrics,
    workoutHistory,
    updateProfileVariable,
    updateBiomechanicalScore,
  } = useClinicalEngine();

  const activeWeek = profile.mesocycleWeek;
  const setActiveWeek = (week: number) => {
    updateProfileVariable("mesocycleWeek", week);
  };

  const [restTimerSignal, setRestTimerSignal] = useState<{
    seconds: number;
    tick: number;
  } | null>(null);
  const [biomechOpen, setBiomechOpen] = useState(false);

  const trainingPlan = useMemo(
    () =>
      generateTrainingPlan({
        entornoEntreno: profile.entornoEntreno || "gym",
        diasEntrenoSemana: profile.diasEntrenoSemana || 4,
        objetivo: profile.objetivo || "fat_loss",
        modality: profile.trainingModality || "hypertrophy",
        experienceLevel: profile.experienceLevel || "intermediate",
        mesocycleWeek: activeWeek,
        endocrineVolumeReductionPct:
          metrics.endocrineShield?.recommendedVolumeReductionPct ?? 0,
        sleepProtection: metrics.sleepProtection,
        workoutHistory: workoutHistory || [],
        concurrentCardio: profile.concurrentCardio || {
          enabled: false,
          intensity: "low",
          hoursGap: 3,
        },
        loadOverrides: profile.exerciseLoadOverrides || {},
      }),
    [
      profile.entornoEntreno,
      profile.diasEntrenoSemana,
      profile.objetivo,
      profile.trainingModality,
      profile.experienceLevel,
      activeWeek,
      metrics.endocrineShield,
      metrics.sleepProtection,
      workoutHistory,
      profile.concurrentCardio,
      profile.exerciseLoadOverrides,
    ]
  );

  const isDeloadOrReduced =
    trainingPlan.reactiveDeload.isReactiveDeloadActive ||
    trainingPlan.appliedVolumeReductionPct > 0;

  return (
    <div
      className="w-full max-w-full min-w-0 bg-slate-50 text-slate-900 flex flex-col p-3 sm:p-6 gap-6"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full max-w-full min-w-0 rounded-3xl bg-white p-5 sm:px-6 sm:py-5 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/10">
            <Activity className="size-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-normal leading-snug">
              Entrenamiento Autónomo (Casa / Gimnasio) · ACSM 2026
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 whitespace-normal">
              {trainingPlan.environmentLabel} · {trainingPlan.splitTitle} · Conteo Fraccionado Pelland 0.5x
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold">
            <Radio className="size-3.5 text-emerald-500" />
            {trainingPlan.prescription.modalityLabel}
          </span>
          <span
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold",
              isDeloadOrReduced
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            <Cpu className="size-3.5" />
            {trainingPlan.reactiveDeload.isReactiveDeloadActive
              ? "Deload Reactivo MV"
              : trainingPlan.appliedVolumeReductionPct > 0
              ? `Volumen -${trainingPlan.appliedVolumeReductionPct}% (Escudo)`
              : "Autorregulación Nominal"}
          </span>
        </div>
      </header>

      {/* Top strip */}
      <div className="w-full max-w-full min-w-0">
        <MesocycleStrip activeWeek={activeWeek} onSelect={setActiveWeek} />
      </div>

      {/* Main tri-panel grid */}
      <main className="grid grid-cols-1 xl:grid-cols-[310px_1fr_340px] gap-4 w-full max-w-full min-w-0">
        <div className="w-full max-w-full min-w-0">
          <VolumeMatrix activeWeek={activeWeek} plan={trainingPlan} />
        </div>
        <div className="w-full max-w-full min-w-0">
          <RoutineGrid
            activeWeek={activeWeek}
            plan={trainingPlan}
            onTriggerRest={(seconds) =>
              setRestTimerSignal({ seconds, tick: Date.now() })
            }
          />
        </div>
        <div className="w-full max-w-full min-w-0">
          <CNSInterceptor
            activeWeek={activeWeek}
            plan={trainingPlan}
            restTimerSignal={restTimerSignal}
          />
        </div>
      </main>

      {/* Módulo Opcional: Chequeo Biomecánico de 5 Movimientos Funcionales */}
      <section className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 p-5 sm:px-6 text-slate-900">
        <button
          type="button"
          onClick={() => setBiomechOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
              <Compass size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Chequeo Biomecánico Opcional (5 Movimientos Funcionales)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Evalúa movilidad/estabilidad (1 = Limitado · 2 = Aceptable · 3 = Óptimo) para adaptar profundidades y progresiones.
              </p>
            </div>
          </div>
          <span className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 shrink-0">
            {biomechOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {biomechOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {BIOMECHANICAL_MOVEMENTS.map((mv) => {
              const savedScore = profile.biomechanicalScreen?.[mv.id]?.score;
              return (
                <div
                  key={`biomech-${mv.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
                      {mv.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {mv.focus}
                    </p>
                    <p className="text-[11px] text-slate-700 mt-1.5 font-medium leading-snug">
                      {mv.optimalCue}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      {([1, 2, 3] as const).map((sc) => (
                        <button
                          key={`score-${mv.id}-${sc}`}
                          type="button"
                          onClick={() => updateBiomechanicalScore?.(mv.id, sc)}
                          className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                            savedScore === sc
                              ? sc === 3
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : sc === 2
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-amber-600 text-white border-amber-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {sc}
                        </button>
                      ))}
                    </div>
                    {savedScore && savedScore < 3 && (
                      <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2 leading-snug font-medium">
                        {mv.adaptationAdvice}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom bar: Protocolo Dorey visible únicamente bajo Opt-In Privado */}
      {profile.optInVascularVitality && (
        <div className="w-full max-w-full min-w-0">
          <DoreySync />
        </div>
      )}
    </div>
  );
}

export default TrainingView;
