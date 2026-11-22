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
        <circle cx="45" cy="45" r={r} fill="none" stroke="#F1F5F9" strokeWidth={7} />
        <circle
          cx="45"
          cy="45"
          r={r}
          fill="none"
          stroke="#10B981"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="tabular-nums text-slate-900 font-extrabold text-base font-mono">
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
    <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm justify-between text-slate-900">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Salud Vascular Pélvica</h3>
          </div>
          {isDoreyCompliant && (
            <span title="Cumplimiento Semanal Alcanzado">
              <Flame className="size-4 text-emerald-500 animate-pulse" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 py-1">
          <Dial done={profile.doreySessionsPerWeek} total={4} />
          <div className="flex flex-col gap-1">
            <span className="text-slate-900 font-bold text-xs">Protocolo Dorey</span>
            <span className="text-slate-600 text-xs font-medium">
              {profile.doreySessionsPerWeek} / 4 Sesiones Cumplidas
            </span>
            <span className="text-slate-500 text-xs leading-relaxed">
              3×15 contracciones submáximas (10s sostener, 10s relajar)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-slate-600 text-xs font-medium">Acondicionamiento (Hoy)</span>
        <button
          type="button"
          onClick={toggleDaily}
          className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
            isDailyDone ? "bg-emerald-500" : "bg-slate-200"
          }`}
          aria-pressed={isDailyDone}
          aria-label="Alternar sesión de protocolo Dorey de hoy"
        >
          <span
            className="absolute top-0.5 size-5 rounded-full bg-white shadow-xs transition-all duration-200"
            style={{ left: isDailyDone ? "1.375rem" : "0.125rem" }}
          />
        </button>
      </div>
    </div>
  );
}
