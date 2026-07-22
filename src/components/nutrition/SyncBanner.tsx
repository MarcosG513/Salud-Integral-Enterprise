import { Activity, Cpu, Zap } from "lucide-react";
import { BUDGET } from "./nutrition-data";

export function SyncBanner() {
  const consumed = BUDGET.total - BUDGET.remaining;
  const pct = (consumed / BUDGET.total) * 100;

  return (
    <header className="flex items-center justify-between gap-6 border-b border-[#1E293B] bg-[#0F1322]/80 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#39FF14]/40 bg-[#39FF14]/10">
          <Activity className="h-4 w-4 text-[#39FF14]" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-wide text-slate-100">
            Nutrition Analytics &amp; Reverse Engineering View
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
            <Cpu className="h-3 w-3 text-[#00F0FF]" /> Cunningham Engine · synced
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-3 md:flex">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            Remaining Budget
          </span>
          <div className="h-1.5 w-52 overflow-hidden rounded-full bg-[#070A13] ring-1 ring-inset ring-[#1E293B]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#39FF14]/60 to-[#39FF14]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-baseline gap-2 rounded-sm border border-[#39FF14]/30 bg-[#39FF14]/5 px-4 py-1.5">
          <Zap className="h-3.5 w-3.5 translate-y-0.5 text-[#39FF14]" />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Remaining</span>
          <span className="font-mono text-lg font-bold text-[#39FF14] [text-shadow:0_0_12px_rgba(57,255,20,0.5)]">
            {BUDGET.remaining.toLocaleString()}
          </span>
          <span className="font-mono text-xs text-slate-500">/ {BUDGET.total.toLocaleString()} kcal</span>
        </div>
      </div>
    </header>
  );
}
