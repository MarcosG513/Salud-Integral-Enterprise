import { MEALS, MealPhase } from "./nutrition-data";

const MACROS: { key: "protein" | "carbs" | "fats"; fill: "fillProtein" | "fillCarbs" | "fillFats"; label: string; color: string }[] = [
  { key: "protein", fill: "fillProtein", label: "PRO", color: "#39FF14" },
  { key: "carbs", fill: "fillCarbs", label: "CHO", color: "#00F0FF" },
  { key: "fats", fill: "fillFats", label: "FAT", color: "#F5A623" },
];

function MacroLine({ meal, m }: { meal: MealPhase; m: (typeof MACROS)[number] }) {
  const target = meal[m.key];
  const logged = meal[m.fill];
  const pct = target ? Math.min(100, (logged / target) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 font-mono text-xs tracking-widest text-slate-500">{m.label}</span>
      <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[#070A13]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}80` }}
        />
      </div>
      <span className="w-14 text-right font-mono text-xs text-slate-400">
        {logged}<span className="text-slate-600">/{target}g</span>
      </span>
    </div>
  );
}

export function ChronoTimeline() {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#1E293B] bg-[#0B0E1A]/60">
      <div className="border-b border-[#1E293B] px-4 py-2.5">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">
          4-Meal Chrono Timeline
        </h2>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {MEALS.map((meal, i) => (
          <div
            key={meal.id}
            className="relative rounded-sm border border-[#1E293B] bg-[#0F1322] p-3 transition-colors hover:border-[#00F0FF]/40"
          >
            <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#39FF14] to-transparent" />
            <div className="mb-2.5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-600">0{i + 1}</span>
                  <span className="text-[13px] font-semibold text-slate-100">{meal.name}</span>
                </div>
                <div className="mt-0.5 font-mono text-xs uppercase tracking-wider text-[#00F0FF]/70">
                  {meal.phase}
                </div>
              </div>
              <span className="rounded-sm border border-[#39FF14]/30 bg-[#39FF14]/5 px-1.5 py-0.5 font-mono text-xs font-bold text-[#39FF14]">
                {meal.pct}%
              </span>
            </div>
            <div className="space-y-1.5">
              {MACROS.map((m) => (
                <MacroLine key={m.key} meal={meal} m={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
