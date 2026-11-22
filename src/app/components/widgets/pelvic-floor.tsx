import { useState } from "react";
import { Activity, Flame } from "lucide-react";
import { useClinicalEngine } from "../../../context/clinical-engine-context";

function Dial({ done, total }: { done: number; total: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = done / total;
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 90 90" className="w-[86px]" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="45" cy="45" r={r} fill="none" stroke="#1E293B" strokeWidth={7} />
        <circle
          cx="45"
          cy="45"
          r={r}
          fill="none"
          stroke="#39FF14"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{
            filter: "drop-shadow(0 0 5px #39FF14)",
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="tabular-nums text-white" style={{ fontWeight: 800, fontSize: "1.1rem" }}>
          {done}/{total}
        </span>
      </div>
    </div>
  );
}

export function PelvicFloor() {
  const { profile, updateProfileVariable, metrics } = useClinicalEngine();
  const [isDailyDone, setIsDailyDone] = useState(true);

  const isDoreyCompliant = metrics.doreyPercentage >= 100;

  const toggleDaily = () => {
    setIsDailyDone((prev) => {
      const next = !prev;
      const currentSessions = profile.doreySessionsPerWeek;
      if (next) {
        updateProfileVariable("doreySessionsPerWeek", Math.min(4, currentSessions + 1));
      } else {
        updateProfileVariable("doreySessionsPerWeek", Math.max(0, currentSessions - 1));
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1E293B] bg-white/[0.03] p-6 backdrop-blur-xl justify-between">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#39FF14]" />
            <h3 style={{ fontWeight: 600, fontSize: "0.85rem" }}>Suelo Pélvico</h3>
          </div>
          {isDoreyCompliant && (
            <span title="Cumplimiento Semanal Alcanzado">
              <Flame className="size-4 text-[#39FF14] animate-pulse" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 py-1">
          <Dial done={profile.doreySessionsPerWeek} total={4} />
          <div className="flex flex-col gap-1">
            <span className="text-slate-300 font-bold" style={{ fontSize: "0.74rem", lineHeight: 1.4 }}>
              Protocolo Dorey
            </span>
            <span className="text-slate-500" style={{ fontSize: "0.68rem" }}>
              {profile.doreySessionsPerWeek} / 4 Sesiones Cumplidas
            </span>
            <span className="text-slate-400 text-xs leading-relaxed">
              3x15 contracciones máx. (10s sostener, 10s relajar)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#1E293B] pt-3">
        <span className="text-slate-400" style={{ fontSize: "0.72rem" }}>
          Acondicionamiento (Hoy)
        </span>
        <button
          onClick={toggleDaily}
          className="relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
          style={{
            background: isDailyDone ? "#39FF14" : "#1E293B",
            boxShadow: isDailyDone ? "0 0 12px rgba(57,255,20,0.6)" : "none",
          }}
          aria-pressed={isDailyDone}
        >
          <span
            className="absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200"
            style={{ left: isDailyDone ? "1.375rem" : "0.125rem" }}
          />
        </button>
      </div>
    </div>
  );
}
