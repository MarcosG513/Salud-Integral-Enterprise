import React, { useState, useEffect, useMemo } from "react";
import { Timer, Zap, CheckCircle2, Sparkles } from "lucide-react";
import { useClinicalEngine, SupplementItem, CLINICAL_SUPPLEMENTS } from "../../context/clinical-engine-context";

// Helper function to check if a compound is recommended by ATO AI directive
export function isSupplementAtoRecommended(compound: SupplementItem, alerts?: string[]): boolean {
  if (!alerts || !Array.isArray(alerts) || alerts.length === 0) return false;
  const id = compound.id.toLowerCase();
  const name = compound.name.toLowerCase();
  const abbr = compound.abbr.toLowerCase();

  return alerts.some((alert) => {
    if (!alert) return false;
    const a = alert.toLowerCase();
    if (a.includes(id) || a.includes(name) || a.includes(abbr)) return true;
    if (id === "ash" && (a.includes("ksm") || a.includes("ashwa") || a.includes("cortisol"))) return true;
    if (id === "zn" && a.includes("zinc")) return true;
    if (id === "d3" && (a.includes("d3") || a.includes("vitamina d"))) return true;
    if (id === "cre" && a.includes("creatina")) return true;
    if (id === "cit" && (a.includes("citrulina") || a.includes("citm"))) return true;
    if (id === "caf" && (a.includes("cafeína") || a.includes("cafeina"))) return true;
    if (id === "bet" && (a.includes("beta") || a.includes("alanina"))) return true;
    if (id === "mg" && (a.includes("magnesio") || a.includes("glicinato"))) return true;
    if (id === "o3" && (a.includes("omega") || a.includes("pescado"))) return true;
    if (id === "wpi" && (a.includes("proteína") || a.includes("suero") || a.includes("whey"))) return true;
    if (id === "mel" && a.includes("melatonina")) return true;
    return false;
  });
}

export function SupplementChronoWidget({ className = "" }: { className?: string }) {
  const {
    supplements: contextSupplements,
    supplementChecklist = {},
    toggleSupplementChecked,
    customSupplementDose = {},
    atoDirective,
    profile,
  } = useClinicalEngine();

  // Fallback to CLINICAL_SUPPLEMENTS if not present in context
  const supplements: SupplementItem[] = contextSupplements || CLINICAL_SUPPLEMENTS;

  // Citrulline timing sync for countdown base (in seconds)
  const timingMinutes = profile?.citrullineTimingMin || 35;
  const [secs, setSecs] = useState(timingMinutes * 60);

  useEffect(() => {
    setSecs(timingMinutes * 60);
  }, [timingMinutes]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setSecs((s) => (s <= 0 ? timingMinutes * 60 : s - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timingMinutes]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  // Dynamic calculation for next pending compound
  const pendingCompound = useMemo(() => {
    return supplements.find((s) => !supplementChecklist[s.id]) || null;
  }, [supplements, supplementChecklist]);

  // Real dose calculation considering customSupplementDose overrides
  const nextRealDose = useMemo(() => {
    if (!pendingCompound) return "";
    const custom = customSupplementDose[pendingCompound.id];
    return custom?.doseOverride || pendingCompound.dose;
  }, [pendingCompound, customSupplementDose]);

  const completedCount = useMemo(() => {
    return supplements.filter((s) => !!supplementChecklist[s.id]).length;
  }, [supplements, supplementChecklist]);

  return (
    <div
      className={`rounded-2xl border border-[#1E293B] bg-white/[0.03] p-5 backdrop-blur-xl flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
          <Timer size={14} className="text-[#00F0FF]" /> Cronómetro de Suplementos
        </h3>
        <span className="font-mono text-xs text-slate-500 font-bold uppercase text-[#00F0FF]">
          CUENTA REGRESIVA
        </span>
      </div>

      {/* Countdown & Next compound display */}
      <div className="my-3 text-center bg-black/30 p-3 rounded-xl border border-[#1E293B]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-[#00F0FF]/5 border border-[#00F0FF]/30 font-mono text-2xl font-bold text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.15)]">
          <Zap size={16} className="text-[#39FF14] animate-pulse" />
          {pendingCompound ? `${mm}:${ss}` : "00:00"}
        </div>

        <div className="mt-2 text-xs font-mono">
          {pendingCompound ? (
            <span className="text-slate-300 font-medium">
              <span className="text-slate-500 uppercase tracking-widest font-semibold block text-[10px] mb-0.5">
                SIGUIENTE VÍA CRÍTICA:
              </span>
              <span className="text-[#00F0FF] font-bold">{pendingCompound.name.toUpperCase()}</span>
              {" "}
              <span className="text-[#39FF14] font-bold">[{nextRealDose}]</span>
            </span>
          ) : (
            <span className="text-[#39FF14] font-bold flex items-center justify-center gap-1">
              <CheckCircle2 size={13} /> STACK DIARIO COMPLETADO (100%)
            </span>
          )}
        </div>
      </div>

      {/* Stack stats counter */}
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-2 px-1">
        <span>CUMPLIMIENTO DIARIO:</span>
        <span className="font-bold text-[#39FF14]">
          {completedCount} / {supplements.length} ({Math.round((completedCount / supplements.length) * 100)}%)
        </span>
      </div>

      {/* Synchronized Supplement Checklist */}
      <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-[#1E293B] text-[10px] max-h-[220px] overflow-y-auto">
        {supplements.map((compound) => {
          const isCompleted = !!supplementChecklist[compound.id];
          const custom = customSupplementDose[compound.id];
          const realDose = custom?.doseOverride || compound.dose;
          const isAtoRecommended = isSupplementAtoRecommended(compound, atoDirective?.supplementAlerts);

          return (
            <div
              key={`chrono-sup-${compound.id}`}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
                isCompleted
                  ? "bg-[#39FF14]/10 border-[#39FF14]/30 text-slate-200"
                  : "bg-black/20 border-[#1E293B] text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
                <span
                  className="font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border"
                  style={{
                    borderColor: isCompleted ? "rgba(57,255,20,0.4)" : "#334155",
                    color: isCompleted ? "#39FF14" : "#94A3B8",
                    background: isCompleted ? "rgba(57,255,20,0.1)" : "rgba(15,23,42,0.6)",
                  }}
                >
                  {compound.abbr}
                </span>

                <span className="font-mono font-semibold text-slate-200 text-[11px] truncate max-w-[180px] sm:max-w-none">
                  {compound.name}
                </span>

                <span className="font-mono text-[10px] text-[#00F0FF] font-medium">
                  ({realDose})
                </span>

                {/* ATO AI Recommendation Glowing Badge */}
                {isAtoRecommended && (
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-[#00F0FF]/60 bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.4)] animate-pulse"
                    title="Recomendación activa en Directiva ATO AI"
                  >
                    <Sparkles size={8} className="text-[#39FF14]" />
                    🤖 ATO Recomendado
                  </span>
                )}
              </div>

              {/* Bi-directional Interactive Status Badge */}
              <button
                onClick={() => toggleSupplementChecked(compound.id)}
                className={`font-mono text-[9px] font-bold px-2 py-1 rounded transition-all uppercase tracking-wider shrink-0 ${
                  isCompleted
                    ? "bg-[#39FF14]/20 border border-[#39FF14]/50 text-[#39FF14] hover:bg-[#39FF14]/30 shadow-[0_0_6px_rgba(57,255,20,0.2)]"
                    : "bg-[#1E293B] border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-[#00F0FF]/60 hover:bg-[#00F0FF]/10"
                }`}
                title={`Marcar ${compound.name} como ${isCompleted ? 'Pendiente' : 'Completado'}`}
              >
                {isCompleted ? "✓ COMPLETADO" : "○ PENDIENTE"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SupplementChronoWidget;
