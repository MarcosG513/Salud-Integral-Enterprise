import { Activity, Cpu, Zap } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

export function SyncBanner() {
  const { metrics } = useClinicalEngine();
  const total = metrics.targetCalories;

  // Read actual live consumed calories from clinical engine
  const consumed = metrics.consumedMacros.calories;

  const remaining = Math.max(0, total - consumed);
  const pct = Math.min(100, (consumed / total) * 100);

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white p-5 sm:px-6 sm:py-5 border border-slate-100 shadow-xl shadow-slate-200/50 shrink-0 w-full max-w-full min-w-0">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shrink-0 shadow-md shadow-emerald-500/10 spring-bounce">
          <Activity className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="leading-tight min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 truncate">
            Mi Plan de Nutrición
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 truncate">
            Seguimiento de Calorías y Macronutrientes
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto shrink-0">
        <div className="hidden items-center gap-3 md:flex">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">
            Calorías Restantes
          </span>
          <div className="h-2 w-40 lg:w-52 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-baseline gap-2 rounded-sm border border-[#39FF14]/30 bg-[#39FF14]/5 px-3 sm:px-4 py-1.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 translate-y-0.5 text-[#39FF14]" />
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Restante</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-base sm:text-lg font-black text-emerald-600">
              {remaining.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-slate-500 font-semibold">/ {total.toLocaleString()} kcal</span>
          </div>
        </div>
      </div>
    </header>
  );
}
