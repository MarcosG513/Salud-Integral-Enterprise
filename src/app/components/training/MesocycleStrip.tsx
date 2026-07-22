import { useClinicalEngine } from "../../../context/clinical-engine-context";
import { MESOCYCLE } from "./telemetry-data";

type Props = {
  activeWeek: number;
  onSelect: (week: number) => void;
};

export function MesocycleStrip({ activeWeek, onSelect }: Props) {
  const { metrics } = useClinicalEngine();
  
  const activeWeekInfo = MESOCYCLE.find((w) => w.index === activeWeek)!;
  const progress = ((activeWeek - 1) / (MESOCYCLE.length - 1)) * 100;

  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0F1322]/80 backdrop-blur-xl p-4 sm:px-6 sm:py-4 w-full max-w-full min-w-0 flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2 w-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
          <span className="text-xs tracking-[0.20em] text-[#00F0FF] font-mono uppercase shrink-0 font-bold">
            Mesociclo
          </span>
          <p className="text-xs sm:text-sm text-slate-300 break-words line-clamp-2 min-w-0">
            Bloque de 5 Semanas · Empuje/Tracción/Piernas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto min-w-0 justify-start sm:justify-end">
          <span className="text-slate-400 text-xs sm:text-sm shrink-0 font-mono">{activeWeekInfo.label}:</span>
          <span className="text-[#A855F7] text-xs sm:text-sm font-semibold truncate max-w-full">
            {activeWeek === activeWeekInfo.index ? "Fase de " + metrics.training.phaseName : activeWeekInfo.phase}
          </span>
          <div className="flex items-center gap-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded shrink-0">
            <span className="font-mono text-[#00F0FF] tracking-wider text-xs sm:text-sm font-bold">
              {activeWeek === activeWeekInfo.index ? metrics.training.intensity : activeWeekInfo.rirTarget}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative w-full overflow-x-auto scrollbar-none py-1">
        <div className="relative min-w-[300px]">
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
                  key={`meso-week-${w.index}`}
                  onClick={() => onSelect(w.index)}
                  className="group flex flex-col items-center gap-2 focus:outline-none min-h-[40px] px-1"
                >
                  <span
                    className={[
                      "font-mono text-xs tracking-widest uppercase transition-colors",
                      isActive ? "text-[#00F0FF]" : isPast ? "text-slate-400" : "text-slate-600",
                    ].join(" ")}
                  >
                    S{w.index}
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
                      "font-mono text-xs tracking-wider",
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
    </div>
  );
}
