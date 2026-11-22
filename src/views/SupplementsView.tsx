import { useMemo } from "react";
import { useClinicalEngine } from "../context/clinical-engine-context";
import { evaluateSupplementPlan } from "../engine/supplementEngine";
import { ChronoStrip } from "../components/supplements/chrono-strip";
import { DispensaryMatrix } from "../components/supplements/dispensary-matrix";
import { CycleScheduler } from "../components/supplements/cycle-scheduler";
import { InteractionInterceptor } from "../components/supplements/interaction-interceptor";
import { mono } from "../components/supplements/telemetry-primitives";

export function SupplementsView() {
  const {
    profile,
    metrics,
    hormonalLabValues,
    supplementChecklist,
    customSupplementDose,
    updateProfileVariable,
  } = useClinicalEngine();

  const supplementPlan = useMemo(
    () =>
      evaluateSupplementPlan({
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
      }),
    [
      profile.sexoBiologico,
      profile.peso,
      profile.horarioEntreno,
      profile.bedtimeHour,
      profile.creatineActivatedAt,
      profile.ashwagandhaSafetyCleared,
      profile.optInVascularVitality,
      profile.citrullineGrams,
      profile.citrullineTimingMin,
      profile.doreySessionsPerWeek,
      metrics.sleepProtection,
      hormonalLabValues,
      supplementChecklist,
      customSupplementDose,
    ]
  );

  return (
    <div
      className="relative flex-1 p-4 sm:p-8 flex flex-col gap-6 bg-slate-50 text-slate-900"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Title bar + Quick Circadian Schedule Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-xs">
            <span style={{ ...mono, fontWeight: 800 }}>℞</span>
          </div>
          <div>
            <h1 className="text-slate-900 tracking-tight font-bold text-base leading-tight">
              Dispensario de Suplementación Condicional
            </h1>
            <div
              className="text-xs uppercase tracking-[0.16em] text-slate-500 font-mono mt-0.5"
              style={mono}
            >
              Cronobiología Dinámica · Creatina + Amortiguación TDEE · Compuerta Hepática
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
            <span className="px-2 text-slate-500 font-mono text-[11px]">Entreno:</span>
            {(
              [
                { id: "morning", label: "Mañana" },
                { id: "afternoon", label: "Tarde" },
                { id: "evening", label: "Noche" },
              ] as const
            ).map((opt) => (
              <button
                key={`sched-${opt.id}`}
                type="button"
                onClick={() => updateProfileVariable("horarioEntreno", opt.id)}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  (profile.horarioEntreno || "afternoon") === opt.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs whitespace-nowrap">
            <span className="text-xs uppercase tracking-[0.12em] text-slate-500 font-mono font-semibold">
              Perfil
            </span>
            <span className="text-xs font-mono font-bold text-sky-600">
              {(profile.sexoBiologico || "male") === "female" ? "FEM" : "MASC"} · {Math.round(profile.peso || 75)} kg
            </span>
          </div>
        </div>
      </div>

      {/* 1 · Top strip */}
      <ChronoStrip plan={supplementPlan} />

      {/* 2·3·4 · Three-panel bento */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        <div className="min-h-[350px] xl:min-h-0">
          <DispensaryMatrix plan={supplementPlan} />
        </div>
        <div className="min-h-[350px] xl:min-h-0">
          <CycleScheduler />
        </div>
        <div className="min-h-[350px] xl:min-h-0">
          <InteractionInterceptor plan={supplementPlan} />
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1 text-slate-500 font-mono text-xs mt-2">
        <span>℞ DISPENSARIO V6 · CONDICIONALIDAD Y SEGURIDAD CLÍNICA</span>
        <span>USUARIO · {(profile.username || "Marcos M.").toUpperCase()}</span>
      </div>
    </div>
  );
}

export default SupplementsView;
