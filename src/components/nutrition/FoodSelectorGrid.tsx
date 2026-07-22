import { Check } from "lucide-react";
import { FOODS } from "./nutrition-data";

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
}

function MacroCell({ value, unit, color }: { value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[12px] font-semibold" style={{ color }}>
        {value.toFixed(1)}
      </span>
      <span className="font-mono text-xs uppercase tracking-wider text-slate-600">{unit}</span>
    </div>
  );
}

export function FoodSelectorGrid({ selected, onToggle }: Props) {
  return (
    <section className="flex flex-1 flex-col overflow-hidden border-r border-[#1E293B]">
      <div className="flex items-center justify-between border-b border-[#1E293B] px-4 py-2.5">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">
          Interactive Food Selector · Macro / 100g
        </h2>
        <span className="font-mono text-xs text-slate-600">{selected.length} active</span>
      </div>

      <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] gap-px border-b border-[#1E293B] bg-[#1E293B] px-0">
        {["FOOD ITEM", "KCAL", "PRO", "CHO", "FAT"].map((h) => (
          <div key={h} className="bg-[#0B0E1A] px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-slate-500">
            {h}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {FOODS.map((f) => {
            const isSel = selected.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => onToggle(f.id)}
                className={`grid grid-cols-[1.6fr_repeat(4,1fr)] items-center rounded-sm border bg-[#0F1322] px-3 py-2.5 text-left transition-all ${
                  isSel
                    ? "border-[#00F0FF] shadow-[0_0_0_1px_#00F0FF,0_0_14px_rgba(0,240,255,0.25)]"
                    : "border-[#1E293B] hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-[3px] border transition-colors ${
                      isSel ? "border-[#00F0FF] bg-[#00F0FF]/20" : "border-slate-600"
                    }`}
                  >
                    {isSel && <Check className="h-3 w-3 text-[#00F0FF]" strokeWidth={3} />}
                  </span>
                  <div className="leading-tight">
                    <div className="text-[13px] font-medium text-slate-100">{f.name}</div>
                    <div className="font-mono text-xs uppercase tracking-wider text-slate-600">{f.category}</div>
                  </div>
                </div>
                <MacroCell value={f.kcal} unit="kcal" color="#39FF14" />
                <MacroCell value={f.protein} unit="g pro" color="#e2e8f0" />
                <MacroCell value={f.carbs} unit="g cho" color="#00F0FF" />
                <MacroCell value={f.fats} unit="g fat" color="#F5A623" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
