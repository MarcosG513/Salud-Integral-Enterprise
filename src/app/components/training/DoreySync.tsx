import { useClinicalEngine } from "../../../context/clinical-engine-context";

export function DoreySync() {
  const { profile, metrics } = useClinicalEngine();

  const completed = profile.doreySessionsPerWeek;
  const compliance = metrics.doreyPercentage;

  // Ordering completed days: LUN, MIÉ, VIE, SÁB are the 4 target days.
  const doreyDays = [
    { day: "LUN", done: completed >= 1 },
    { day: "MAR", done: false },
    { day: "MIÉ", done: completed >= 2 },
    { day: "JUE", done: false },
    { day: "VIE", done: completed >= 3 },
    { day: "SÁB", done: completed >= 4 },
    { day: "DOM", done: false },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 px-6 py-4 flex flex-wrap items-center justify-between gap-6 text-slate-900">
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs tracking-[0.25em] text-indigo-700 font-mono font-bold uppercase">
          Sincronización del Protocolo Dorey
        </span>
        <span className="text-xs text-slate-500 font-semibold">Acondicionamiento del Suelo Pélvico</span>
      </div>

      <div className="flex items-center gap-4 font-mono text-xs tracking-wider text-slate-600 shrink-0 font-semibold">
        <span><span className="text-slate-900 font-extrabold">3</span>×<span className="text-slate-900 font-extrabold">15</span> reps</span>
        <span className="text-slate-300">|</span>
        <span><span className="text-slate-900 font-extrabold">10s</span> sostener</span>
        <span className="text-slate-300">|</span>
        <span><span className="text-slate-900 font-extrabold">4×</span>/sem</span>
      </div>

      {/* Day compliance strip */}
      <div className="flex items-center gap-2">
        {doreyDays.map((d) => (
          <div key={`dorey-day-${d.day}`} className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs tracking-wider text-slate-500 font-semibold">{d.day}</span>
            <span
              className={`size-5 rounded-lg border flex items-center justify-center transition-all ${
                d.done
                  ? "bg-sky-50 border-sky-400 shadow-xs"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {d.done && <span className="size-2 rounded-full bg-sky-600" />}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-slate-100">
        <div className="text-right">
          <div className="font-mono text-xs tracking-widest text-slate-500 uppercase font-semibold">Resistencia Circulatoria</div>
          <div className="font-mono text-sm font-extrabold text-sky-700">{compliance}%</div>
        </div>
        <div className="w-24 h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ width: `${compliance}%` }}
          />
        </div>
      </div>
    </div>
  );
}
