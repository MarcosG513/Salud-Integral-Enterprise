import { useEffect, useMemo, useState } from "react";
import { Activity, Timer, Zap } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import {
  evaluateSupplementPlan,
  type SupplementPlanOutput,
} from "../../engine/supplementEngine";
import { mono, StatusDot } from "./telemetry-primitives";

export function ChronoStrip({ plan: externalPlan }: { plan?: SupplementPlanOutput } = {}) {
  const {
    supplementChecklist = {},
    customSupplementDose = {},
    hormonalLabValues,
    metrics,
    profile,
  } = useClinicalEngine();

  const plan = useMemo(() => {
    if (externalPlan) return externalPlan;
    return evaluateSupplementPlan({
      sexoBiologico: profile.sexoBiologico || "male",
      peso: profile.peso || 75,
      horarioEntreno: profile.horarioEntreno || "afternoon",
      bedtimeHour: profile.bedtimeHour ?? 23,
      sleepProtection: metrics.sleepProtection,
      hormonalLabValues,
      supplementChecklist: supplementChecklist || {},
      customSupplementDose: customSupplementDose || {},
      creatineActivatedAt: profile.creatineActivatedAt ?? null,
      ashwagandhaSafetyCleared: Boolean(profile.ashwagandhaSafetyCleared),
      optInVascularVitality: Boolean(profile.optInVascularVitality),
      citrullineGrams: profile.citrullineGrams ?? 8,
      citrullineTimingMin: profile.citrullineTimingMin ?? 35,
      doreySessionsPerWeek: profile.doreySessionsPerWeek ?? 0,
    });
  }, [
    externalPlan,
    profile,
    metrics.sleepProtection,
    hormonalLabValues,
    supplementChecklist,
    customSupplementDose,
  ]);

  const timingMinutes = profile.citrullineTimingMin || 35;
  const [secs, setSecs] = useState(timingMinutes * 60);

  useEffect(() => {
    setSecs(timingMinutes * 60);
  }, [timingMinutes]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => (s <= 0 ? timingMinutes * 60 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timingMinutes]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  // Solo mostrar compuestos elegibles y activos/visibles (respetando Opt-In privado y bloqueos)
  const visibleEligible = useMemo(() => {
    const base = [...plan.coreSupplements, ...plan.contextualSupplements];
    if (plan.vascularVitalityModule.enabled) {
      base.push(plan.vascularVitalityModule.citrullineSupplement);
    }
    return base.filter((s) => !s.isBlocked && !s.requiresHepaticGate);
  }, [plan]);

  const pendingCompound = visibleEligible.find((s) => !s.isTaken) || null;

  const workoutHourStr = `${String(plan.caffeineChrono.workoutWindowHour).padStart(2, "0")}:00`;
  const preWorkoutStr = `${String(Math.max(5, plan.caffeineChrono.workoutWindowHour - 1)).padStart(2, "0")}:00`;
  const bedStr = `${String(Math.min(23, profile.bedtimeHour ?? 23)).padStart(2, "0")}:00`;

  const windows = [
    { label: "Mañana / D3+Grasa", time: "08:30", state: "done" },
    {
      label: "Creatina 3–5 g",
      time: "Diario",
      state: plan.creatineStatus.isActive ? "done" : "pending",
    },
    {
      label: plan.caffeineChrono.isBlocked ? "Cafeína Bloqueada" : "Pre-Entreno",
      time: preWorkoutStr,
      state: "active",
    },
    { label: "Sesión Entreno", time: workoutHourStr, state: "next" },
    { label: "Post / Suero Proteína", time: "Post", state: "pending" },
    { label: "Magnesio / Descanso", time: bedStr, state: "pending" },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 text-slate-900">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 shadow-xs shrink-0 whitespace-nowrap">
            <Timer size={14} className="text-sky-600 shrink-0" />
            <span
              className="text-xs uppercase tracking-[0.12em] font-mono font-bold text-sky-700"
              style={mono}
            >
              Cronobiología Activa
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-[0.10em] text-slate-500 font-bold font-mono whitespace-nowrap">
              Siguiente Elegible:
            </span>
            <span className="text-sm text-slate-900 font-extrabold">
              {pendingCompound
                ? pendingCompound.name
                : "Protocolo Diario Completado"}
            </span>
            {pendingCompound && (
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap">
                [{pendingCompound.resolvedDose}]
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs uppercase tracking-[0.12em] text-slate-500 font-mono font-semibold whitespace-nowrap">
            Ventana
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 shadow-xs shrink-0 whitespace-nowrap">
            <Zap size={14} className="text-emerald-600" />
            <span className="text-lg tabular-nums font-mono font-black text-emerald-700">
              {mm}:{ss}
            </span>
          </div>
          <span
            className={`text-xs px-3 py-1.5 rounded-xl uppercase tracking-[0.08em] font-mono font-bold border whitespace-nowrap shrink-0 ${
              plan.caffeineChrono.isBlocked
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-sky-50 border-sky-200 text-sky-700"
            }`}
          >
            {plan.caffeineChrono.isBlocked
              ? "Sin Estimulantes PM/Noche"
              : `Corte Cafeína ${plan.caffeineChrono.cutoffHour}:00 h`}
          </span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="mt-5 w-full overflow-x-auto scrollbar-none py-2">
        <div className="relative min-w-[560px]">
          <div className="absolute left-0 right-0 top-[7px] h-1 bg-slate-100 rounded-full" />
          <div
            className="absolute left-0 top-[7px] h-1 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300"
            style={{ width: "45%" }}
          />
          <div className="relative flex justify-between items-center gap-3">
            {windows.map((w) => {
              const accent =
                w.state === "active"
                  ? "#0284C7"
                  : w.state === "done"
                  ? "#10B981"
                  : "#94A3B8";
              return (
                <div
                  key={`chrono-window-${w.label}`}
                  className="flex flex-col items-center gap-1.5 flex-1 min-w-[85px]"
                >
                  <div
                    className="flex items-center justify-center"
                    style={{ height: 16 }}
                  >
                    {w.state === "active" ? (
                      <Activity size={16} className="text-sky-600 animate-pulse" />
                    ) : (
                      <StatusDot accent={accent} />
                    )}
                  </div>
                  <span
                    className="text-xs font-mono font-extrabold whitespace-nowrap"
                    style={{ color: accent }}
                  >
                    {w.time}
                  </span>
                  <span
                    className="text-[11px] uppercase tracking-[0.05em] text-center font-mono font-semibold whitespace-nowrap px-1"
                    style={{
                      color: w.state === "pending" ? "#64748B" : "#1E293B",
                    }}
                  >
                    {w.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
