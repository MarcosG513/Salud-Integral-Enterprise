import { CNS_READINESS, CNS_CRITICAL_THRESHOLD } from "./telemetry-data";

type Props = { activeWeek: number };

export function CNSInterceptor({ activeWeek }: Props) {
  const readiness = CNS_READINESS[activeWeek] ?? 100;
  const critical = readiness < CNS_CRITICAL_THRESHOLD;
  const accent = critical ? "#FF4D4D" : readiness < 70 ? "#A855F7" : "#00F0FF";

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - readiness / 100);

  return (
    <div
      className={[
        "rounded-md border bg-[#0F1322]/80 backdrop-blur-xl h-full flex flex-col transition-colors",
        critical ? "border-[#FF4D4D] animate-pulse" : "border-[#1E293B]",
      ].join(" ")}
      style={critical ? { boxShadow: "0 0 24px -4px rgba(255,77,77,0.5)" } : undefined}
    >
      <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
        <span className="text-[10px] tracking-[0.25em] font-mono uppercase" style={{ color: accent }}>
          CNS Interceptor
        </span>
        <span
          className={[
            "font-mono text-[9px] tracking-widest px-2 py-0.5 rounded-sm border uppercase",
            critical ? "border-[#FF4D4D] text-[#FF4D4D]" : "border-[#1E293B] text-slate-500",
          ].join(" ")}
        >
          {critical ? "Override" : "Nominal"}
        </span>
      </div>

      {/* Readiness dial */}
      <div className="flex flex-col items-center py-5">
        <div className="relative size-[140px]">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#1E293B" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={R} fill="none" stroke={accent} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl tracking-tight" style={{ color: accent }}>
              {readiness}
              <span className="text-base text-slate-500">%</span>
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase mt-1">
              Readiness
            </span>
          </div>
        </div>
      </div>

      {/* sub-metrics */}
      <div className="grid grid-cols-2 gap-px bg-[#1E293B] mx-4 rounded-sm overflow-hidden border border-[#1E293B]">
        {[
          { k: "HRV rMSSD", v: `${Math.round(28 + readiness * 0.6)}ms` },
          { k: "Grip Deficit", v: `${Math.max(0, Math.round((100 - readiness) * 0.4))}%` },
          { k: "Tap Reaction", v: `${Math.round(210 + (100 - readiness) * 1.4)}ms` },
          { k: "Sleep Debt", v: `${((100 - readiness) / 30).toFixed(1)}h` },
        ].map((m) => (
          <div key={m.k} className="bg-[#0F1322] px-3 py-2">
            <div className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">{m.k}</div>
            <div className="font-mono text-sm" style={{ color: readiness < 45 ? "#FF4D4D" : "#e2e8f0" }}>
              {m.v}
            </div>
          </div>
        ))}
      </div>

      {/* Override readout */}
      <div className="px-4 pt-4 pb-4 mt-auto">
        {critical ? (
          <div className="rounded-sm border border-[#FF4D4D] bg-[#FF4D4D]/[0.07] p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-[#FF4D4D] animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-[#FF4D4D] uppercase">
                SNC Override Active
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Molecular Signaling Collision Detected{" "}
              <span className="font-mono text-[#FF4D4D]">(AMPK / mTORC1 interference)</span>. Locking
              hypertrophy volume to a strict maximum of{" "}
              <span className="font-mono text-[#FF4D4D]">3 heavy mechanical tension</span> working
              sets per movement.
            </p>
          </div>
        ) : (
          <div className="rounded-sm border border-[#1E293B] bg-[#00F0FF]/[0.03] p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full" style={{ background: accent }} />
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase" style={{ color: accent }}>
                Autoregulator Clear
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Anabolic signaling coherent. mTORC1 dominant · AMPK suppressed. Prescribed volume
              landmarks unlocked to full <span className="font-mono text-slate-200">MRV</span> ceiling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
