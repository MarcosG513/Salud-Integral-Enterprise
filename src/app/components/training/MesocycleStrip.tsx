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
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 p-5 sm:px-6 sm:py-5 w-full max-w-full min-w-0 flex flex-col gap-3 text-slate-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-1 w-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
          <span className="text-xs tracking-[0.20em] text-slate-900 font-mono uppercase shrink-0 font-extrabold">
            Mesociclo
          </span>
          <p className="text-xs sm:text-sm text-slate-600 font-medium break-words line-clamp-2 min-w-0">
            Bloque de 5 Semanas · Empuje/Tracción/Piernas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0 justify-start sm:justify-end">
          <span className="text-slate-500 text-xs sm:text-sm shrink-0 font-mono font-semibold">{activeWeekInfo.label}:</span>
          <span className="text-purple-700 text-xs sm:text-sm font-bold truncate max-w-full">
            {activeWeek === activeWeekInfo.index ? "Fase de " + metrics.training.phaseName : activeWeekInfo.phase}
          </span>
          <div className="flex items-center gap-1 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-lg shrink-0 shadow-xs">
            <span className="font-mono text-sky-700 tracking-wider text-xs sm:text-sm font-extrabold">
              {activeWeek === activeWeekInfo.index ? metrics.training.intensity : activeWeekInfo.rirTarget}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative w-full overflow-x-auto scrollbar-none py-2">
        <div className="relative min-w-[300px]">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-sky-500 to-purple-500 -translate-y-1/2 rounded-full transition-all duration-300"
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
                  className="group flex flex-col items-center gap-2 focus:outline-none min-h-[44px] px-2"
                >
                  <span
                    className={`font-mono text-xs tracking-widest uppercase transition-colors font-bold ${
                      isActive ? "text-sky-700 font-black" : isPast ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    S{w.index}
                  </span>
                  <span
                    className={`rounded-full transition-all ${
                      isActive
                        ? "size-4 bg-sky-600 border-2 border-white ring-2 ring-sky-500 shadow-md"
                        : isPast
                        ? "size-3.5 bg-purple-200 border-2 border-purple-400"
                        : "size-3.5 bg-slate-100 border-2 border-slate-300 group-hover:border-slate-400"
                    }`}
                  />
                  <span
                    className={`font-mono text-xs tracking-wider font-semibold ${
                      isActive ? "text-slate-900 font-extrabold" : "text-slate-500"
                    }`}
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
