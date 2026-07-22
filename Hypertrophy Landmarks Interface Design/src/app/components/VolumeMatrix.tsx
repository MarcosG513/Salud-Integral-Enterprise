import { MUSCLE_GROUPS } from "./telemetry-data";

type Props = { activeWeek: number };

function landmarkState(sets: number, mev: number, mav: number, mrv: number) {
  if (sets < mev) return { label: "SUB-MEV", color: "#64748B" };
  if (sets < mav) return { label: "MEV→MAV", color: "#00F0FF" };
  if (sets <= mrv) return { label: "MAV→MRV", color: "#A855F7" };
  return { label: "OVER-MRV", color: "#FF4D4D" };
}

export function VolumeMatrix({ activeWeek }: Props) {
  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0F1322]/80 backdrop-blur-xl h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
        <span className="text-[10px] tracking-[0.25em] text-[#00F0FF] font-mono uppercase">
          Set Matrix
        </span>
        <span className="text-[9px] tracking-[0.2em] text-slate-500 font-mono uppercase">
          Weekly Working Sets
        </span>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-[#1E293B] flex items-center gap-4 text-[9px] font-mono tracking-wider">
        <span className="flex items-center gap-1.5 text-slate-400"><i className="size-2 rounded-sm bg-[#00F0FF]" />MEV</span>
        <span className="flex items-center gap-1.5 text-slate-400"><i className="size-2 rounded-sm bg-[#A855F7]" />MAV</span>
        <span className="flex items-center gap-1.5 text-slate-400"><i className="size-2 rounded-sm bg-[#FF4D4D]" />MRV</span>
      </div>

      <div className="flex-1 overflow-auto divide-y divide-[#1E293B]/60">
        {MUSCLE_GROUPS.map((g) => {
          const sets = g.weekly[activeWeek] ?? 0;
          const scaleMax = g.mrv * 1.15;
          const pct = Math.min((sets / scaleMax) * 100, 100);
          const state = landmarkState(sets, g.mev, g.mav, g.mrv);
          return (
            <div key={g.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-slate-200 text-sm">{g.name}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-lg tracking-tight" style={{ color: state.color }}>
                    {sets}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">sets</span>
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
                    key={m.v}
                    className="absolute top-0 bottom-0 w-px bg-slate-100/40"
                    style={{ left: `${(m.v / scaleMax) * 100}%` }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-1.5 font-mono text-[9px] tracking-wider text-slate-500">
                <span>MEV {g.mev}</span>
                <span>MAV {g.mav}</span>
                <span>MRV {g.mrv}</span>
                <span style={{ color: state.color }}>{state.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
