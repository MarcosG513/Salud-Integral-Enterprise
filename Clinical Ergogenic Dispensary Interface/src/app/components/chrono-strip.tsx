import { useEffect, useState } from "react";
import { Activity, Timer, Zap } from "lucide-react";
import { COLORS, mono, StatusDot } from "./telemetry-primitives";

const WINDOWS = [
  { label: "Fasted AM", time: "06:00", state: "done" },
  { label: "Creatine Load", time: "09:30", state: "done" },
  { label: "Pre-Workout", time: "16:24", state: "active" },
  { label: "Intra-Workout", time: "17:10", state: "next" },
  { label: "Post / Anabolic", time: "18:45", state: "pending" },
  { label: "Circadian Wind-Down", time: "21:30", state: "pending" },
];

export function ChronoStrip() {
  const [secs, setSecs] = useState(24 * 60);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s <= 0 ? 24 * 60 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div
      className="rounded-lg backdrop-blur-xl px-5 py-3.5"
      style={{
        background: "linear-gradient(160deg, rgba(15,19,34,0.92), rgba(9,12,22,0.94))",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded"
            style={{ border: `1px solid ${COLORS.cyan}44`, background: `${COLORS.cyan}10` }}
          >
            <Timer size={13} style={{ color: COLORS.cyan }} />
            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: COLORS.cyan }}>
              Active Intake Chrono
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Next Critical Window</span>
            <span className="text-[13px] text-slate-100" style={{ fontWeight: 600 }}>
              L-Citrulline Malate
            </span>
            <span className="text-[12px]" style={{ ...mono, color: COLORS.lime }}>
              [8.0g]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">T-Minus</span>
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded"
            style={{ border: `1px solid ${COLORS.lime}55`, background: `${COLORS.lime}0D` }}
          >
            <Zap size={13} style={{ color: COLORS.lime }} />
            <span className="text-[18px] tabular-nums" style={{ ...mono, color: COLORS.lime, fontWeight: 700 }}>
              {mm}:{ss}
            </span>
          </div>
          <span
            className="text-[10px] px-2 py-1 rounded uppercase tracking-[0.12em]"
            style={{ ...mono, color: COLORS.cyan, border: `1px solid ${COLORS.cyan}33` }}
          >
            Pre-Workout Optimization Phase
          </span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="mt-4 relative">
        <div className="absolute left-0 right-0 top-[6px] h-px" style={{ background: COLORS.border }} />
        <div
          className="absolute left-0 top-[6px] h-px"
          style={{ width: "45%", background: `linear-gradient(90deg, ${COLORS.lime}, ${COLORS.cyan})` }}
        />
        <div className="relative flex justify-between">
          {WINDOWS.map((w) => {
            const accent =
              w.state === "active" ? COLORS.cyan : w.state === "done" ? COLORS.lime : "#334155";
            return (
              <div key={w.label} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                <div className="flex items-center justify-center" style={{ height: 13 }}>
                  {w.state === "active" ? (
                    <Activity size={13} style={{ color: accent }} />
                  ) : (
                    <StatusDot accent={accent} />
                  )}
                </div>
                <span className="text-[9px]" style={{ ...mono, color: accent }}>{w.time}</span>
                <span
                  className="text-[9px] uppercase tracking-[0.08em] text-center"
                  style={{ color: w.state === "pending" ? "#475569" : "#94A3B8" }}
                >
                  {w.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
