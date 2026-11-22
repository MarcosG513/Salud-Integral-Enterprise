import { useEffect, useState } from "react";
import { Activity, Timer, Zap } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { COLORS, mono, StatusDot } from "./telemetry-primitives";

const WINDOWS = [
  { label: "Ayuno AM", time: "06:00", state: "done" },
  { label: "Carga de Creatina", time: "09:30", state: "done" },
  { label: "Pre-Entrenamiento", time: "16:24", state: "active" },
  { label: "Intra-Entrenamiento", time: "17:10", state: "next" },
  { label: "Post / Anabólico", time: "18:45", state: "pending" },
  { label: "Relajación Circadiana", time: "21:30", state: "pending" },
];

export function ChronoStrip() {
  const { supplements: contextSupplements, supplementChecklist = {}, customSupplementDose = {}, profile } = useClinicalEngine();

  const timingMinutes = profile.citrullineTimingMin;

  const [secs, setSecs] = useState(timingMinutes * 60);

  useEffect(() => {
    setSecs(timingMinutes * 60);
  }, [timingMinutes]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => (s <= 0 ? timingMinutes * 60 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timingMinutes]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const pendingCompound = contextSupplements?.find((s: any) => !supplementChecklist[s.id]) || null;
  const nextRealDose = pendingCompound ? (customSupplementDose[pendingCompound.id]?.doseOverride || pendingCompound.dose) : "";

  return (
    <div
      className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 text-slate-900"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 shadow-xs"
          >
            <Timer size={14} className="text-sky-600" />
            <span className="text-xs uppercase tracking-[0.15em] font-mono font-bold text-sky-700" style={mono}>
              Cronómetro de Ingesta Activo
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-[0.12em] text-slate-500 font-bold font-mono">Siguiente Ventana:</span>
            <span className="text-sm text-slate-900 font-extrabold">
              {pendingCompound ? pendingCompound.name : "Todos los Suplementos Ingeridos"}
            </span>
            {pendingCompound && (
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
                [{nextRealDose}]
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.15em] text-slate-500 font-mono font-semibold">Cuenta Regresiva</span>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 shadow-xs"
          >
            <Zap size={14} className="text-emerald-600" />
            <span className="text-xl tabular-nums font-mono font-black text-emerald-700">
              {mm}:{ss}
            </span>
          </div>
          <span
            className="text-xs px-3 py-1.5 rounded-xl uppercase tracking-[0.10em] font-mono font-bold bg-sky-50 border border-sky-200 text-sky-700"
          >
            Fase Pre-Entreno
          </span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="mt-5 w-full overflow-x-auto scrollbar-none py-2">
        <div className="relative min-w-[500px]">
          <div className="absolute left-0 right-0 top-[7px] h-1 bg-slate-100 rounded-full" />
          <div
            className="absolute left-0 top-[7px] h-1 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300"
            style={{ width: "45%" }}
          />
          <div className="relative flex justify-between items-center gap-3">
            {WINDOWS.map((w) => {
              const accent =
                w.state === "active" ? "#0284C7" : w.state === "done" ? "#10B981" : "#94A3B8";
              return (
                <div key={`chrono-window-${w.label}`} className="flex flex-col items-center gap-1.5 flex-1 min-w-[80px]">
                  <div className="flex items-center justify-center" style={{ height: 16 }}>
                    {w.state === "active" ? (
                      <Activity size={16} className="text-sky-600 animate-pulse" />
                    ) : (
                      <StatusDot accent={accent} />
                    )}
                  </div>
                  <span className="text-xs font-mono font-extrabold" style={{ color: accent }}>{w.time}</span>
                  <span
                    className="text-xs uppercase tracking-[0.06em] text-center font-mono font-semibold whitespace-nowrap px-1"
                    style={{ color: w.state === "pending" ? "#94A3B8" : "#334155" }}
                  >
                    {w.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
