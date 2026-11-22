import { useEffect, useMemo, useState } from "react";
import { Timer, Play, Pause, RotateCcw, ShieldAlert, ShieldCheck, Activity, Zap } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { generateTrainingPlan, type TrainingPlanOutput } from "../../../engine/trainingEngine";

type Props = {
  activeWeek: number;
  plan?: TrainingPlanOutput;
  restTimerSignal?: { seconds: number; tick: number } | null;
};

export function CNSInterceptor({ activeWeek, plan: externalPlan, restTimerSignal }: Props) {
  const { profile, metrics, workoutHistory, updateProfileVariable } = useClinicalEngine();

  const plan = useMemo(() => {
    if (externalPlan) return externalPlan;
    return generateTrainingPlan({
      entornoEntreno: profile.entornoEntreno || "gym",
      diasEntrenoSemana: profile.diasEntrenoSemana || 4,
      objetivo: profile.objetivo || "fat_loss",
      modality: profile.trainingModality || "hypertrophy",
      experienceLevel: profile.experienceLevel || "intermediate",
      mesocycleWeek: activeWeek,
      endocrineVolumeReductionPct: metrics.endocrineShield?.recommendedVolumeReductionPct ?? 0,
      sleepProtection: metrics.sleepProtection,
      workoutHistory: workoutHistory || [],
      concurrentCardio: profile.concurrentCardio || { enabled: false, intensity: "low", hoursGap: 3 },
      loadOverrides: profile.exerciseLoadOverrides || {},
    });
  }, [externalPlan, profile, activeWeek, metrics.endocrineShield, metrics.sleepProtection, workoutHistory]);

  // ── Temporizador de Descanso 100% Visual/Háptico (Cero audio externo) ──────
  const defaultRest = plan.prescription.restSeconds;
  const [targetSeconds, setTargetSeconds] = useState(defaultRest);
  const [secondsLeft, setSecondsLeft] = useState(defaultRest);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTargetSeconds(defaultRest);
    if (!isRunning) setSecondsLeft(defaultRest);
  }, [defaultRest]);

  useEffect(() => {
    if (!restTimerSignal) return;
    setTargetSeconds(restTimerSignal.seconds);
    setSecondsLeft(restTimerSignal.seconds);
    setIsRunning(true);
  }, [restTimerSignal]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          try {
            if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
              navigator.vibrate([120, 60, 120]);
            }
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progressPct = targetSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / targetSeconds) * 100)) : 0;

  const deload = plan.reactiveDeload;
  const concurrent = plan.concurrentGuidance;
  const cardioCfg = profile.concurrentCardio || { enabled: false, intensity: "low", hoursGap: 3 };

  return (
    <div
      className={`rounded-3xl border bg-white shadow-xl shadow-slate-200/40 p-5 h-full flex flex-col gap-4 text-slate-900 transition-all ${
        deload.isReactiveDeloadActive ? "border-sky-300 ring-2 ring-sky-500/15" : "border-slate-200/80"
      }`}
    >
      {/* Header */}
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs tracking-[0.18em] font-mono font-bold uppercase text-slate-900">
          Autorregulación y Descanso
        </span>
        <span
          className={`font-mono text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border uppercase font-bold whitespace-nowrap ${
            deload.isReactiveDeloadActive
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {deload.isReactiveDeloadActive ? "Deload MV" : "Nominal ACSM"}
        </span>
      </div>

      {/* 1. Temporizador de Descanso Silencioso (sin interrumpir música externa) */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Timer size={14} className="text-indigo-600" />
            Descanso ({plan.prescription.restLabel})
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">
            Sin corte de audio
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div
            className={`font-mono text-3xl font-black tabular-nums tracking-tight ${
              secondsLeft === 0 ? "text-emerald-600 animate-pulse" : "text-slate-900"
            }`}
          >
            {mm}:{ss}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (secondsLeft === 0) setSecondsLeft(targetSeconds);
                setIsRunning((r) => !r);
              }}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
              {isRunning ? "Pausa" : "Iniciar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSecondsLeft((s) => s + 30);
                setTargetSeconds((t) => Math.max(t, secondsLeft + 30));
              }}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-mono text-xs font-bold cursor-pointer"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(defaultRest);
                setTargetSeconds(defaultRest);
              }}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Reiniciar"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 2. Deload Reactivo Objetivo (Sin encuestas de congestión o agujetas) */}
      <div
        className={`rounded-2xl border p-3.5 space-y-2 ${
          deload.isReactiveDeloadActive
            ? "border-sky-200 bg-sky-50/70 text-sky-900"
            : "border-emerald-200 bg-emerald-50/60 text-emerald-900"
        }`}
      >
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
          {deload.isReactiveDeloadActive ? (
            <ShieldAlert size={15} className="text-sky-600 shrink-0" />
          ) : (
            <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
          )}
          <span>
            {deload.isReactiveDeloadActive ? "Deload Reactivo Activado" : "Rendimiento Estable"}
          </span>
        </div>

        <p className="text-xs leading-relaxed font-medium text-slate-700">
          {plan.autoRegulationSummary}
        </p>

        {deload.reasons.length > 0 && (
          <ul className="space-y-1 text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200/70">
            {deload.reasons.map((r, idx) => (
              <li key={`deload-r-${idx}`}>• {r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Regla de Entrenamiento Concurrente */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Activity size={14} className="text-emerald-600" />
            Entrenamiento Concurrente
          </span>
          <Zap size={13} className={concurrent.isCompliant ? "text-emerald-600" : "text-rose-600"} />
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() =>
              updateProfileVariable("concurrentCardio", { ...cardioCfg, enabled: false })
            }
            className={`py-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
              !cardioCfg.enabled
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Solo Fuerza
          </button>
          <button
            type="button"
            onClick={() =>
              updateProfileVariable("concurrentCardio", {
                enabled: true,
                intensity: "low",
                hoursGap: cardioCfg.hoursGap || 0,
              })
            }
            className={`py-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
              cardioCfg.enabled && cardioCfg.intensity === "low"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Cardio Suave
          </button>
          <button
            type="button"
            onClick={() =>
              updateProfileVariable("concurrentCardio", {
                enabled: true,
                intensity: "high",
                hoursGap: cardioCfg.hoursGap || 3,
              })
            }
            className={`py-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
              cardioCfg.enabled && cardioCfg.intensity === "high"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Cardio Intenso
          </button>
        </div>

        {cardioCfg.enabled && cardioCfg.intensity === "high" && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-600 font-semibold">Separación (horas):</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 6].map((h) => (
                <button
                  key={`gap-${h}`}
                  type="button"
                  onClick={() =>
                    updateProfileVariable("concurrentCardio", { ...cardioCfg, hoursGap: h })
                  }
                  className={`px-2 py-0.5 rounded-lg font-mono text-xs font-bold border cursor-pointer ${
                    cardioCfg.hoursGap === h
                      ? h >= 3
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-rose-600 text-white border-rose-600"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        )}

        <p
          className={`text-xs leading-relaxed font-medium rounded-xl p-2.5 border ${
            concurrent.isCompliant
              ? "bg-white border-slate-200 text-slate-600"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {concurrent.recommendation}
        </p>
      </div>
    </div>
  );
}
