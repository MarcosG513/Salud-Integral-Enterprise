import { useClinicalEngine } from "../../../context/clinical-engine-context";

export function DoreySync() {
  const { profile, metrics } = useClinicalEngine();

  const completed = profile.doreySessionsPerWeek;
  const target = 4;
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
    <div className="rounded-md border border-[#1E293B] bg-[#0F1322]/80 backdrop-blur-xl px-5 py-2.5 flex items-center gap-6">
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs tracking-[0.25em] text-[#A855F7] font-mono uppercase">
          Sincronización del Protocolo Dorey
        </span>
        <span className="text-xs text-slate-500">Acondicionamiento del Suelo Pélvico</span>
      </div>

      <div className="flex items-center gap-4 font-mono text-xs tracking-wider text-slate-400 shrink-0">
        <span><span className="text-slate-200">3</span>×<span className="text-slate-200">15</span> reps</span>
        <span className="text-slate-600">|</span>
        <span><span className="text-slate-200">10s</span> sostener</span>
        <span className="text-slate-600">|</span>
        <span><span className="text-slate-200">4×</span>/sem</span>
      </div>

      {/* Day compliance strip */}
      <div className="flex items-center gap-1.5 ml-auto">
        {doreyDays.map((d) => (
          <div key={`dorey-day-${d.day}`} className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs tracking-wider text-slate-600">{d.day}</span>
            <span
              className={[
                "size-4 rounded-sm border flex items-center justify-center transition-colors",
                d.done
                  ? "bg-[#00F0FF]/15 border-[#00F0FF]"
                  : "bg-[#070A13] border-[#1E293B]",
              ].join(" ")}
            >
              {d.done && <span className="size-1.5 rounded-[1px] bg-[#00F0FF]" />}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-[#1E293B]">
        <div className="text-right">
          <div className="font-mono text-xs tracking-widest text-slate-500 uppercase">Resistencia Circulatoria</div>
          <div className="font-mono text-sm text-[#00F0FF]">{compliance}%</div>
        </div>
        <div className="w-24 h-2 rounded-sm bg-[#070A13] border border-[#1E293B] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00F0FF] to-[#A855F7] transition-all duration-500"
            style={{ width: `${compliance}%` }}
          />
        </div>
      </div>
    </div>
  );
}
