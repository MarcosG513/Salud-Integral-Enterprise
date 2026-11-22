import { useMemo } from "react";
import { AlertTriangle, ShieldCheck, Moon, Ban } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import {
  evaluateSupplementPlan,
  type SupplementPlanOutput,
} from "../../engine/supplementEngine";
import { GlassCard, PanelHeader, mono } from "./telemetry-primitives";

const CFG = {
  block: {
    accent: "#EF4444",
    Icon: Ban,
    label: "BLOQUEADO",
    bgClass: "bg-rose-50/70 border-rose-200 text-rose-900",
    badgeClass: "bg-rose-100 border-rose-300 text-rose-700",
  },
  warn: {
    accent: "#F59E0B",
    Icon: AlertTriangle,
    label: "COMPUERTA",
    bgClass: "bg-amber-50/70 border-amber-200 text-amber-900",
    badgeClass: "bg-amber-100 border-amber-300 text-amber-700",
  },
  clear: {
    accent: "#10B981",
    Icon: ShieldCheck,
    label: "APROBADO",
    bgClass: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
    badgeClass: "bg-emerald-100 border-emerald-300 text-emerald-700",
  },
} as const;

export function InteractionInterceptor({ plan: externalPlan }: { plan?: SupplementPlanOutput } = {}) {
  const {
    profile,
    metrics,
    hormonalLabValues,
    supplementChecklist,
    customSupplementDose,
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

  return (
    <GlassCard className="h-full flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/40">
      <PanelHeader
        index="03"
        title="Interceptor Cronobiológico y Seguridad"
        accent="#EF4444"
        right={<Moon size={14} className="text-slate-400" />}
      />

      <div className="p-1 flex-1 overflow-auto space-y-3">
        {plan.interceptions.map((it) => {
          const { Icon, label, bgClass, badgeClass, accent } = CFG[it.level];
          return (
            <div
              key={`intercept-${it.id}`}
              className={`rounded-2xl p-4 border shadow-xs transition-all ${bgClass}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Icon size={15} style={{ color: accent }} />
                  <span
                    className="text-xs uppercase tracking-[0.12em] font-mono font-black"
                    style={{ color: accent }}
                  >
                    {it.code}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {it.timeLabel}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-[0.1em] font-mono font-bold border whitespace-nowrap ${badgeClass}`}
                  >
                    {label}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-slate-900 font-extrabold">
                {it.title}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-slate-600 font-medium">
                {it.body}
              </div>
            </div>
          );
        })}

        {/* Mapa dinámico de ventanas cronobiológicas (vinculado a bedtimeHour y horarioEntreno) */}
        <div className="rounded-2xl p-4 border border-slate-200 bg-slate-50 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs uppercase tracking-[0.12em] text-slate-600 font-mono font-bold">
              Ventana Cafeína · Corte {plan.caffeineChrono.cutoffHour}:00 h
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              Sueño {profile.bedtimeHour ?? 23}:00 h
            </span>
          </div>

          <div className="flex gap-[3px]">
            {plan.circadianMap.map((slot) => (
              <div
                key={`circadian-hour-${slot.hour}`}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-full rounded-md transition-all"
                  style={{
                    height: 24,
                    background:
                      slot.status === "optimal"
                        ? "#0284C7"
                        : slot.status === "blocked"
                        ? "#FECACA"
                        : "#A7F3D0",
                  }}
                />
                {slot.hour % 6 === 0 && (
                  <span className="text-[9px] font-mono font-bold text-slate-500">
                    {String(slot.hour).padStart(2, "0")}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-center gap-4 text-xs uppercase tracking-[0.08em] font-mono font-bold flex-wrap"
            style={{ ...mono }}
          >
            <span className="text-emerald-700">■ Abierto</span>
            <span className="text-sky-700">■ Pre-entreno</span>
            <span className="text-rose-600">■ Bloqueado</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
