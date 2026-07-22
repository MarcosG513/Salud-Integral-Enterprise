import { TriangleAlert } from "lucide-react";

export function AdvisorBanner() {
  return (
    <footer className="flex items-center gap-3 border-t border-[#39FF14]/25 bg-gradient-to-r from-[#39FF14]/[0.06] to-transparent px-6 py-2">
      <div className="flex items-center gap-2 border-r border-[#1E293B] pr-3">
        <TriangleAlert className="h-3.5 w-3.5 text-[#39FF14]" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#39FF14]">
          Advisor Status
        </span>
      </div>
      <p className="truncate font-mono text-[11px] text-slate-400">
        <span className="text-[#00F0FF]">Active Caloric Deficit detected.</span> Prioritizing
        high-volume, low-calorie density whole foods for maximal leptin satiety management.
      </p>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#39FF14]" /> live
      </span>
    </footer>
  );
}
