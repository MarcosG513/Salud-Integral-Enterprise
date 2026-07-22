import { CornerDownRight, Sigma } from "lucide-react";
import { FOODS } from "./nutrition-data";

interface Props {
  selected: string[];
}

// Reverse-engineering target for this session
const TARGET = { protein: 55, fat: 18 };

export function PortionsEngine({ selected }: Props) {
  const items = FOODS.filter((f) => selected.includes(f.id));

  // Detect incidental fats from non-primary-fat sources (e.g. eggs)
  const egg = items.find((f) => f.id === "huevo");
  const eggServing = 100; // grams assumed
  const incidentalFat = egg ? (egg.fats * eggServing) / 100 : 0;
  const incidentalProtein = egg ? (egg.protein * eggServing) / 100 : 0;

  const chicken = items.find((f) => f.id === "pollo");
  const remainingProtein = Math.max(0, TARGET.protein - incidentalProtein);
  const rawChickenNeeded = chicken ? (remainingProtein / chicken.protein) * 100 : 0;
  const remainingFatAllowance = Math.max(0, TARGET.fat - incidentalFat);

  return (
    <aside className="flex w-[340px] shrink-0 flex-col bg-[#0B0E1A]/60">
      <div className="flex items-center gap-2 border-b border-[#1E293B] px-4 py-2.5">
        <Sigma className="h-3.5 w-3.5 text-[#39FF14]" />
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">
          Reverse Engineering · Porciones
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {/* Target block */}
        <div className="rounded-sm border border-[#1E293B] bg-[#0F1322] p-3">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
            Session Target Lock
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-sm bg-[#070A13] p-2">
              <div className="font-mono text-xs uppercase tracking-wider text-slate-600">Protein</div>
              <div className="font-mono text-base font-bold text-[#39FF14]">{TARGET.protein}g</div>
            </div>
            <div className="rounded-sm bg-[#070A13] p-2">
              <div className="font-mono text-xs uppercase tracking-wider text-slate-600">Fat Allow.</div>
              <div className="font-mono text-base font-bold text-[#F5A623]">{TARGET.fat}g</div>
            </div>
          </div>
        </div>

        {/* Telemetry read-out */}
        <div className="rounded-sm border border-[#1E293B] bg-[#0F1322] p-3 font-mono text-[11px] leading-relaxed">
          <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#00F0FF]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00F0FF]" />
            Telemetry Trace
          </div>

          {items.length === 0 ? (
            <p className="text-slate-500">// Select clinical foods to compute raw portions…</p>
          ) : (
            <div className="space-y-2 text-slate-400">
              {egg && (
                <>
                  <p>
                    <span className="text-slate-500">›</span> Incidental Fats Detected:{" "}
                    <span className="font-bold text-[#F5A623]">{incidentalFat.toFixed(0)}g</span> (from eggs)
                  </p>
                  <p className="flex gap-1.5 pl-3 text-slate-500">
                    <CornerDownRight className="h-3 w-3 shrink-0 translate-y-0.5" />
                    Discarding from total fat allowance → residual{" "}
                    <span className="text-[#F5A623]">{remainingFatAllowance.toFixed(0)}g</span>
                  </p>
                  <p className="flex gap-1.5 pl-3 text-slate-500">
                    <CornerDownRight className="h-3 w-3 shrink-0 translate-y-0.5" />
                    Incidental protein credited:{" "}
                    <span className="text-[#39FF14]">{incidentalProtein.toFixed(0)}g</span>
                  </p>
                </>
              )}
              {chicken && (
                <p className="border-t border-[#1E293B] pt-2">
                  <span className="text-slate-500">›</span> Raw Clean Chicken Breast needed:{" "}
                  <span className="font-bold text-[#39FF14] [text-shadow:0_0_10px_rgba(57,255,20,0.4)]">
                    {rawChickenNeeded.toFixed(0)}g
                  </span>
                </p>
              )}
              {!chicken && (
                <p className="text-slate-500">// Add Pechuga de Pollo to solve raw protein weight.</p>
              )}
            </div>
          )}
        </div>

        {/* Computed portions table */}
        <div className="rounded-sm border border-[#1E293B] bg-[#0F1322] p-3">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">
            Computed Raw Weights
          </div>
          <div className="space-y-1.5">
            {items.length === 0 && (
              <p className="font-mono text-xs text-slate-600">— no items —</p>
            )}
            {items.map((f) => {
              const grams =
                f.id === "pollo" ? rawChickenNeeded : f.id === "huevo" ? eggServing : 100;
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-sm bg-[#070A13] px-2.5 py-1.5"
                >
                  <span className="text-[11px] text-slate-300">{f.name}</span>
                  <span className="font-mono text-[12px] font-bold text-[#00F0FF]">
                    {grams.toFixed(0)}g
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
