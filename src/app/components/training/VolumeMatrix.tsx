import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { MUSCLE_GROUPS } from "./telemetry-data";
import { GlossaryTooltip } from "../widgets/ClinicalGlossary";

function landmarkState(sets: number, mev: number, mav: number, mrv: number) {
  if (sets < mev) return { label: "SUB-MEV", color: "#64748B" };
  if (sets < mav) return { label: "MEV→MAV", color: "#0284C7" };
  if (sets <= mrv) return { label: "MAV→MRV", color: "#8B5CF6" };
  return { label: "OVER-MRV", color: "#EF4444" };
}

type Props = { activeWeek: number };

export function VolumeMatrix({ activeWeek }: Props) {
  const { metrics } = useClinicalEngine();

  // CNS override is active if isSNCOverrideActive is true (deficit active or readiness < 70)
  // and we are in Week 3 or 4
  const isOverrideActive = metrics.training.isSNCOverrideActive && (activeWeek === 3 || activeWeek === 4);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 p-5 h-full flex flex-col text-slate-900">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs tracking-[0.20em] text-slate-900 font-mono font-bold uppercase">
          Matriz de Series
        </span>
        <span className="text-xs tracking-[0.15em] text-slate-500 font-mono uppercase font-semibold">
          Series Efectivas Semanales
        </span>
      </div>

      {/* Legend */}
      <div className="py-2.5 border-b border-slate-100 flex items-center gap-4 text-xs font-mono font-semibold tracking-wider">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="size-2.5 rounded-full bg-sky-600" />MEV
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="size-2.5 rounded-full bg-purple-600" />MAV
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="size-2.5 rounded-full bg-rose-500" />MRV
        </span>
      </div>

      <div className="w-full overflow-x-auto scrollbar-none -mx-1 px-1 min-w-0 flex-1 mt-1">
        <div className="min-w-[280px] divide-y divide-slate-100">
          {MUSCLE_GROUPS.map((g) => {
            let rawSets = g.weekly[activeWeek] ?? 0;
            
            // Apply cap: If override is active, cap weekly sets at MEV (since exercises are capped at 3 sets max)
            const sets = isOverrideActive ? Math.min(g.mev, rawSets) : rawSets;
            
            const scaleMax = g.mrv * 1.15;
            const pct = Math.min((sets / scaleMax) * 100, 100);
            const state = landmarkState(sets, g.mev, g.mav, g.mrv);
            const wasCapped = isOverrideActive && rawSets > g.mev;

            return (
              <div key={`muscle-${g.id}`} className="py-3">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 text-sm font-bold">{g.name}</span>
                    {wasCapped && (
                      <span className="text-[11px] font-mono text-rose-700 border border-rose-200 bg-rose-50 px-2 py-0.5 rounded-lg uppercase tracking-wider font-bold animate-pulse">
                        Limitado (3 series/ex)
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-lg font-black tracking-tight" style={{ color: state.color }}>
                      {sets}
                    </span>
                    {wasCapped && (
                      <span className="font-mono text-xs text-slate-400 line-through">
                        {rawSets}
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-500 font-semibold">series</span>
                  </div>
                </div>

                {/* Meter with landmark ticks */}
                <div className="relative h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background:
                        state.color === "#EF4444"
                          ? "linear-gradient(90deg,#8B5CF6,#EF4444)"
                          : "linear-gradient(90deg,#0284C7,#8B5CF6)",
                    }}
                  />
                  {/* landmark tick marks */}
                  {[
                    { v: g.mev },
                    { v: g.mav },
                    { v: g.mrv },
                  ].map((m) => (
                    <span
                      key={`tick-${g.id}-${m.v}`}
                      className="absolute top-0 bottom-0 w-0.5 bg-white/70"
                      style={{ left: `${(m.v / scaleMax) * 100}%` }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-1.5 font-mono text-xs tracking-wider text-slate-500 font-semibold">
                  <span className="flex items-center">
                    MEV <GlossaryTooltip term="MEV" instanceId={`volume-matrix-${g.id}-mev`} /> {g.mev}
                  </span>
                  <span className="flex items-center">
                    MAV <GlossaryTooltip term="MAV" instanceId={`volume-matrix-${g.id}-mav`} /> {g.mav}
                  </span>
                  <span className="flex items-center">
                    MRV <GlossaryTooltip term="MRV" instanceId={`volume-matrix-${g.id}-mrv`} /> {g.mrv}
                  </span>
                  <span style={{ color: state.color }} className="font-bold">{state.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
