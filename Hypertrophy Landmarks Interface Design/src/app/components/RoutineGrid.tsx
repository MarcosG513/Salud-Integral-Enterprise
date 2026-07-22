import { MESOCYCLE, ROUTINE, CNS_READINESS, CNS_CRITICAL_THRESHOLD } from "./telemetry-data";

type Props = { activeWeek: number };

export function RoutineGrid({ activeWeek }: Props) {
  const meso = MESOCYCLE.find((w) => w.index === activeWeek)!;
  const routine = ROUTINE[activeWeek];
  const override = CNS_READINESS[activeWeek] < CNS_CRITICAL_THRESHOLD;
  const setCap = override ? 3 : Infinity;

  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0F1322]/80 backdrop-blur-xl h-full flex flex-col">
      <div className="px-5 py-3 border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.25em] text-[#00F0FF] font-mono uppercase">
            Live Routine
          </span>
          <span className="text-slate-300 text-sm">{routine.day}</span>
          <span className="text-slate-500 text-xs">· {routine.split}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">Target</span>
          <span className="font-mono text-sm tracking-wider px-2 py-0.5 rounded-sm border border-[#00F0FF]/40 text-[#00F0FF] bg-[#00F0FF]/5">
            {meso.rirTarget}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.6fr_0.9fr_0.7fr_0.7fr_0.9fr] gap-2 px-5 py-2 border-b border-[#1E293B] font-mono text-[9px] tracking-[0.15em] text-slate-500 uppercase">
        <span>Exercise</span>
        <span>Pattern</span>
        <span className="text-right">Sets</span>
        <span className="text-right">Reps</span>
        <span className="text-right">Load</span>
      </div>

      <div className="flex-1 overflow-auto divide-y divide-[#1E293B]/50">
        {routine.exercises.map((ex) => {
          const capped = ex.sets > setCap;
          const shownSets = capped ? setCap : ex.sets;
          return (
            <div
              key={ex.id}
              className="grid grid-cols-[1.6fr_0.9fr_0.7fr_0.7fr_0.9fr] gap-2 px-5 py-3 items-center hover:bg-[#00F0FF]/[0.03] transition-colors"
            >
              <div className="min-w-0">
                <div className="text-slate-100 text-sm truncate">{ex.name}</div>
                <div className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">
                  {ex.tensionType} Tension
                </div>
              </div>
              <span className="font-mono text-[10px] tracking-wider text-[#A855F7]">{ex.pattern}</span>
              <div className="text-right">
                <span className={["font-mono text-base", capped ? "text-[#FF4D4D]" : "text-slate-100"].join(" ")}>
                  {shownSets}
                </span>
                {capped && (
                  <span className="font-mono text-[9px] text-[#FF4D4D]/70 line-through ml-1">{ex.sets}</span>
                )}
              </div>
              <span className="font-mono text-base text-slate-200 text-right">{ex.repRange}</span>
              <div className="text-right">
                <span className="font-mono text-base text-[#00F0FF]">{ex.loadKg}</span>
                <span className="font-mono text-[9px] text-slate-500 ml-0.5">kg</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIR autoscale footer */}
      <div className="px-5 py-3 border-t border-[#1E293B] flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">
          Proximity-to-Failure Autoscale
        </span>
        <div className="flex items-center gap-1">
          {MESOCYCLE.map((w) => (
            <div
              key={w.index}
              className={[
                "font-mono text-[10px] px-1.5 py-0.5 rounded-sm border",
                w.index === activeWeek
                  ? "border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10"
                  : "border-[#1E293B] text-slate-500",
              ].join(" ")}
            >
              {w.rirTarget.replace("RIR ", "").replace(" · To Failure", "F")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
