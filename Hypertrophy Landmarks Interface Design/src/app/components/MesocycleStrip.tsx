import { MESOCYCLE } from "./telemetry-data";

type Props = {
  activeWeek: number;
  onSelect: (week: number) => void;
};

export function MesocycleStrip({ activeWeek, onSelect }: Props) {
  const active = MESOCYCLE.find((w) => w.index === activeWeek)!;
  const progress = ((activeWeek - 1) / (MESOCYCLE.length - 1)) * 100;

  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0F1322]/80 backdrop-blur-xl px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.25em] text-[#00F0FF] font-mono uppercase">
            Mesocycle
          </span>
          <span className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase">
            5-Week Block · Push/Pull/Legs
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-slate-300 text-sm">{active.label}:</span>
          <span className="text-[#A855F7] text-sm">{active.phase}</span>
          <span className="ml-3 font-mono text-[#00F0FF] tracking-wider">{active.rirTarget}</span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#1E293B]" />
        <div
          className="absolute top-1/2 left-0 h-px bg-gradient-to-r from-[#00F0FF] to-[#A855F7]"
          style={{ width: `${progress}%` }}
        />
        <div className="relative flex justify-between">
          {MESOCYCLE.map((w) => {
            const isActive = w.index === activeWeek;
            const isPast = w.index < activeWeek;
            return (
              <button
                key={w.index}
                onClick={() => onSelect(w.index)}
                className="group flex flex-col items-center gap-2 focus:outline-none"
              >
                <span
                  className={[
                    "font-mono text-[10px] tracking-widest uppercase transition-colors",
                    isActive ? "text-[#00F0FF]" : isPast ? "text-slate-400" : "text-slate-600",
                  ].join(" ")}
                >
                  W{w.index}
                </span>
                <span
                  className={[
                    "size-3 rounded-full border transition-all",
                    isActive
                      ? "bg-[#00F0FF] border-[#00F0FF] shadow-[0_0_12px_2px_rgba(0,240,255,0.6)]"
                      : isPast
                      ? "bg-[#A855F7]/70 border-[#A855F7]/70"
                      : "bg-[#0F1322] border-[#1E293B] group-hover:border-slate-500",
                  ].join(" ")}
                />
                <span
                  className={[
                    "font-mono text-[9px] tracking-wider",
                    isActive ? "text-slate-300" : "text-slate-600",
                  ].join(" ")}
                >
                  {w.intensityPct}%1RM
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
