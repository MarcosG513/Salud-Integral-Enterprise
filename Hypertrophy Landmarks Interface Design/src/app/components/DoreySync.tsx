import { DOREY_WEEK } from "./telemetry-data";

export function DoreySync() {
  const completed = DOREY_WEEK.filter((d) => d.done).length;
  const target = 4;
  const compliance = Math.min(Math.round((completed / target) * 100), 100);

  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0F1322]/80 backdrop-blur-xl px-5 py-2.5 flex items-center gap-6">
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] tracking-[0.25em] text-[#A855F7] font-mono uppercase">
          Dorey Protocol Sync
        </span>
        <span className="text-[10px] text-slate-500">Pelvic Floor Conditioning</span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[10px] tracking-wider text-slate-400 shrink-0">
        <span><span className="text-slate-200">3</span>×<span className="text-slate-200">15</span> reps</span>
        <span className="text-slate-600">|</span>
        <span><span className="text-slate-200">10s</span> holds</span>
        <span className="text-slate-600">|</span>
        <span><span className="text-slate-200">4×</span>/week</span>
      </div>

      {/* Day compliance strip */}
      <div className="flex items-center gap-1.5 ml-auto">
        {DOREY_WEEK.map((d) => (
          <div key={d.day} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[8px] tracking-wider text-slate-600">{d.day}</span>
            <span
              className={[
                "size-4 rounded-sm border flex items-center justify-center",
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
          <div className="font-mono text-[8px] tracking-widest text-slate-500 uppercase">Circulatory Stamina</div>
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
