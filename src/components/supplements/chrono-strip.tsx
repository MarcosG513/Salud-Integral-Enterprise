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
      className="rounded-lg backdrop-blur-xl px-5 py-4"
      style={{
        background: "linear-gradient(160deg, rgba(15,19,34,0.92), rgba(9,12,22,0.94))",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{ border: `1px solid ${COLORS.cyan}44`, background: `${COLORS.cyan}10` }}
          >
            <Timer size={13} style={{ color: COLORS.cyan }} />
            <span className="text-xs uppercase tracking-[0.15em]" style={{ ...mono, color: COLORS.cyan }}>
              Cronómetro de Ingesta Activo
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-[0.12em] text-slate-400">Siguiente Ventana Crítica</span>
            <span className="text-sm text-slate-100 font-semibold">
              {pendingCompound ? pendingCompound.name : "Todos los Suplementos Ingeridos"}
            </span>
            {pendingCompound && (
              <span className="text-sm font-bold font-mono" style={{ color: COLORS.lime }}>
                [{nextRealDose}]
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.15em] text-slate-500 font-mono">Cuenta Regresiva</span>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded"
            style={{ border: `1px solid ${COLORS.lime}55`, background: `${COLORS.lime}0D` }}
          >
            <Zap size={13} style={{ color: COLORS.lime }} />
            <span className="text-xl tabular-nums font-mono font-bold" style={{ color: COLORS.lime }}>
              {mm}:{ss}
            </span>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded uppercase tracking-[0.10em] font-mono"
            style={{ color: COLORS.cyan, border: `1px solid ${COLORS.cyan}33` }}
          >
            Fase Pre-Entreno
          </span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="mt-4 w-full overflow-x-auto scrollbar-none py-2">
        <div className="relative min-w-[500px]">
          <div className="absolute left-0 right-0 top-[7px] h-px bg-[#1E293B]" />
          <div
            className="absolute left-0 top-[7px] h-px"
            style={{ width: "45%", background: `linear-gradient(90deg, ${COLORS.lime}, ${COLORS.cyan})` }}
          />
          <div className="relative flex justify-between items-center gap-3">
            {WINDOWS.map((w) => {
              const accent =
                w.state === "active" ? COLORS.cyan : w.state === "done" ? COLORS.lime : "#334155";
              return (
                <div key={`chrono-window-${w.label}`} className="flex flex-col items-center gap-1.5 flex-1 min-w-[80px]">
                  <div className="flex items-center justify-center" style={{ height: 14 }}>
                    {w.state === "active" ? (
                      <Activity size={14} style={{ color: accent }} />
                    ) : (
                      <StatusDot accent={accent} />
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: accent }}>{w.time}</span>
                  <span
                    className="text-xs uppercase tracking-[0.06em] text-center font-mono whitespace-nowrap px-1"
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
    </div>
  );
}
