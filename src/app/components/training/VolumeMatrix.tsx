import { useMemo } from "react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";
import {
  generateTrainingPlan,
  type TrainingPlanOutput,
  type MuscleFractionalVolume,
} from "../../../engine/trainingEngine";
import { GlossaryTooltip } from "../widgets/ClinicalGlossary";

function landmarkColor(m: MuscleFractionalVolume, isDeload: boolean): { label: string; color: string } {
  if (isDeload) return { label: `MV ${m.mvMin}–${m.mvMax}`, color: "#0284C7" };
  if (m.totalFractionalSets < m.mev) return { label: "SUB-MEV (<10)", color: "#64748B" };
  if (m.totalFractionalSets < m.mav) return { label: "MEV→MAV", color: "#0284C7" };
  if (m.totalFractionalSets <= m.mrv) return { label: "MAV→MRV", color: "#8B5CF6" };
  return { label: "SOBRE-MRV", color: "#E11D48" };
}

type Props = {
  activeWeek: number;
  plan?: TrainingPlanOutput;
};

export function VolumeMatrix({ activeWeek, plan: externalPlan }: Props) {
  const { profile, metrics, workoutHistory } = useClinicalEngine();

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

  const isDeload = plan.reactiveDeload.isReactiveDeloadActive;
  const visibleMuscles = plan.weeklyMuscleVolume.filter(
    (m) => m.totalFractionalSets > 0 || ["chest", "back", "quads", "hamstrings", "side_delts"].includes(m.muscleId)
  );

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 p-5 h-full flex flex-col text-slate-900">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="text-xs tracking-[0.20em] text-slate-900 font-mono font-bold uppercase block">
            Matriz Fraccionada (Pelland 0.5x)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Agonista 1.0x + Sinergistas 0.5x · ACSM 2026
          </span>
        </div>
        {plan.appliedVolumeReductionPct > 0 && (
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-700 whitespace-nowrap">
            {isDeload ? "Mantenimiento MV" : `Escudo -${plan.appliedVolumeReductionPct}%`}
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="py-2.5 border-b border-slate-100 flex items-center gap-4 text-xs font-mono font-semibold tracking-wider flex-wrap">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="size-2.5 rounded-full bg-sky-600" />
          {isDeload ? "MV (4–8)" : "MEV (≥10)"}
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="size-2.5 rounded-full bg-purple-600" />MAV
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="size-2.5 rounded-full bg-rose-500" />MRV
        </span>
      </div>

      <div className="w-full overflow-x-auto scrollbar-none -mx-1 px-1 min-w-0 flex-1 mt-1">
        <div className="min-w-[260px] divide-y divide-slate-100">
          {visibleMuscles.map((g) => {
            const scaleMax = g.mrv * 1.15;
            const pct = Math.min((g.totalFractionalSets / scaleMax) * 100, 100);
            const state = landmarkColor(g, isDeload);

            return (
              <div key={`muscle-${g.muscleId}`} className="py-3">
                <div className="flex items-baseline justify-between mb-1.5 gap-2">
                  <div className="min-w-0">
                    <span className="text-slate-900 text-sm font-bold block">{g.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {g.directSets} dir + {g.synergistSets} sin (0.5x)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="font-mono text-lg font-black tracking-tight tabular-nums" style={{ color: state.color }}>
                      {g.totalFractionalSets}
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-semibold">series eq.</span>
                  </div>
                </div>

                {/* Meter with landmark ticks */}
                <div className="relative h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background:
                        state.color === "#E11D48"
                          ? "linear-gradient(90deg,#8B5CF6,#E11D48)"
                          : "linear-gradient(90deg,#0284C7,#8B5CF6)",
                    }}
                  />
                  {[{ v: g.mev }, { v: g.mav }, { v: g.mrv }].map((m) => (
                    <span
                      key={`tick-${g.muscleId}-${m.v}`}
                      className="absolute top-0 bottom-0 w-0.5 bg-white/80"
                      style={{ left: `${(m.v / scaleMax) * 100}%` }}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 font-mono text-[11px] tracking-wider text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="min-w-0">MEV {g.mev}</span>
                    <span className="shrink-0 -my-1.5">
                      <GlossaryTooltip term="MEV" instanceId={`volume-matrix-${g.muscleId}-mev`} />
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="min-w-0">MAV {g.mav}</span>
                    <span className="shrink-0 -my-1.5">
                      <GlossaryTooltip term="MAV" instanceId={`volume-matrix-${g.muscleId}-mav`} />
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="min-w-0">MRV {g.mrv}</span>
                    <span className="shrink-0 -my-1.5">
                      <GlossaryTooltip term="MRV" instanceId={`volume-matrix-${g.muscleId}-mrv`} />
                    </span>
                  </span>
                  <span style={{ color: state.color }} className="font-bold whitespace-nowrap">{state.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
