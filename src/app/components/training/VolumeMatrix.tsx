import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { MUSCLE_GROUPS } from "./telemetry-data";
import { GlossaryTooltip } from "../widgets/ClinicalGlossary";

function landmarkState(sets: number, mev: number, mav: number, mrv: number) {
  if (sets < mev) return { label: "SUB-MEV", color: "#64748B" };
  if (sets < mav) return { label: "MEV→MAV", color: "#00F0FF" };
  if (sets <= mrv) return { label: "MAV→MRV", color: "#A855F7" };
  return { label: "OVER-MRV", color: "#FF4D4D" };
}

type Props = { activeWeek: number };

export function VolumeMatrix({ activeWeek }: Props) {
  const { metrics } = useClinicalEngine();

  // CNS override is active if isSNCOverrideActive is true (deficit active or readiness < 70)
  // and we are in Week 3 or 4
  const isOverrideActive = metrics.training.isSNCOverrideActive && (activeWeek === 3 || activeWeek === 4);

  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0F1322]/80 backdrop-blur-xl h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
        <span className="text-xs tracking-[0.20em] text-[#00F0FF] font-mono uppercase">
          Matriz de Series
        </span>
        <span className="text-xs tracking-[0.15em] text-slate-500 font-mono uppercase">
          Series Efectivas Semanales
        </span>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-[#1E293B] flex items-center gap-4 text-xs font-mono tracking-wider">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="size-2 rounded-sm bg-[#00F0FF]" />MEV
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="size-2 rounded-sm bg-[#A855F7]" />MAV
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="size-2 rounded-sm bg-[#FF4D4D]" />MRV
        </span>
      </div>

      <div className="w-full overflow-x-auto scrollbar-none -mx-1 px-1 min-w-0 flex-1">
        <div className="min-w-[280px] divide-y divide-[#1E293B]/60">
          {MUSCLE_GROUPS.map((g) => {
          let rawSets = g.weekly[activeWeek] ?? 0;
          
          // Apply cap: If override is active, cap weekly sets at MEV (since exercises are capped at 3 sets max)
          const sets = isOverrideActive ? Math.min(g.mev, rawSets) : rawSets;
          
          const scaleMax = g.mrv * 1.15;
          const pct = Math.min((sets / scaleMax) * 100, 100);
          const state = landmarkState(sets, g.mev, g.mav, g.mrv);
          const wasCapped = isOverrideActive && rawSets > g.mev;

          return (
            <div key={`muscle-${g.id}`} className="px-4 py-3">
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 text-sm">{g.name}</span>
                  {wasCapped && (
                    <span className="text-xs font-mono text-[#FF4D4D] border border-[#FF4D4D]/30 bg-[#FF4D4D]/5 px-1.5 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">
                      Limitado (3 series/ex)
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-lg tracking-tight" style={{ color: state.color }}>
                    {sets}
                  </span>
                  {wasCapped && (
                    <span className="font-mono text-xs text-slate-600 line-through">
                      {rawSets}
                    </span>
                  )}
                  <span className="font-mono text-xs text-slate-500">series</span>
                </div>
              </div>

              {/* Meter with landmark ticks */}
              <div className="relative h-2.5 rounded-sm bg-[#070A13] border border-[#1E293B] overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background:
                      state.color === "#FF4D4D"
                        ? "linear-gradient(90deg,#A855F7,#FF4D4D)"
                        : "linear-gradient(90deg,#00F0FF,#A855F7)",
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
                    className="absolute top-0 bottom-0 w-px bg-slate-100/40"
                    style={{ left: `${(m.v / scaleMax) * 100}%` }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-1.5 font-mono text-xs tracking-wider text-slate-500">
                <span className="flex items-center">
                  MEV <GlossaryTooltip term="MEV" instanceId={`volume-matrix-${g.id}-mev`} /> {g.mev}
                </span>
                <span className="flex items-center">
                  MAV <GlossaryTooltip term="MAV" instanceId={`volume-matrix-${g.id}-mav`} /> {g.mav}
                </span>
                <span className="flex items-center">
                  MRV <GlossaryTooltip term="MRV" instanceId={`volume-matrix-${g.id}-mrv`} /> {g.mrv}
                </span>
                <span style={{ color: state.color }}>{state.label}</span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
