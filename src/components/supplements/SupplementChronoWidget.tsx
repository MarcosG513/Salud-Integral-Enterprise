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
      className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Timer size={16} className="text-indigo-500" /> Cronómetro de Suplementos
        </h3>
        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 font-bold uppercase px-2.5 py-0.5 rounded-full">
          CUENTA REGRESIVA
        </span>
      </div>

      {/* Countdown & Next compound display */}
      <div className="my-3 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white border border-slate-200 font-mono text-2xl font-black text-slate-900 shadow-xs">
          <Zap size={16} className="text-amber-500 animate-pulse" />
          {pendingCompound ? `${mm}:${ss}` : "00:00"}
        </div>

        <div className="mt-2 text-xs font-mono">
          {pendingCompound ? (
            <div className="text-slate-800 font-medium">
              <span className="text-slate-500 uppercase tracking-widest font-bold block text-[10px] mb-0.5">
                SIGUIENTE VÍA CRÍTICA:
              </span>
              <span className="text-indigo-700 font-extrabold text-xs">{pendingCompound.name.toUpperCase()}</span>
              {" "}
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold text-[10px]">[{nextRealDose}]</span>
            </div>
          ) : (
            <span className="text-emerald-700 font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" /> STACK DIARIO COMPLETADO (100%)
            </span>
          )}
        </div>
      </div>

      {/* Stack stats counter */}
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-2 px-1 font-bold">
        <span>CUMPLIMIENTO DIARIO:</span>
        <span className="font-extrabold text-emerald-700">
          {completedCount} / {supplements.length} ({Math.round((completedCount / supplements.length) * 100)}%)
        </span>
      </div>

      {/* Synchronized Supplement Checklist */}
      <div className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100 text-xs max-h-[220px] overflow-y-auto">
        {supplements.map((compound) => {
          const isCompleted = !!supplementChecklist[compound.id];
          const custom = customSupplementDose[compound.id];
          const realDose = custom?.doseOverride || compound.dose;
          const isAtoRecommended = isSupplementAtoRecommended(compound, atoDirective?.supplementAlerts);

          return (
            <div
              key={`chrono-sup-${compound.id}`}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                isCompleted
                  ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950"
                  : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
                <span
                  className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border ${
                    isCompleted
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {compound.abbr}
                </span>

                <span className="font-medium text-slate-800 text-xs truncate max-w-[160px] sm:max-w-none">
                  {compound.name}
                </span>

                <span className="font-mono text-[10px] text-slate-500 font-semibold">
                  ({realDose})
                </span>

                {/* ATO AI Recommendation Badge */}
                {isAtoRecommended && (
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 shadow-2xs"
                    title="Recomendación activa en Directiva ATO AI"
                  >
                    <Sparkles size={8} className="text-amber-600" />
                    ATO Recomendado
                  </span>
                )}
              </div>

              {/* Interactive Status Badge Button */}
              <button
                onClick={() => toggleSupplementChecked(compound.id)}
                className={`font-mono text-[9px] font-bold px-2.5 py-1 rounded-lg transition-all uppercase tracking-wider shrink-0 cursor-pointer spring-bounce ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                    : "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
                title={`Marcar ${compound.name} como ${isCompleted ? 'Pendiente' : 'Completado'}`}
              >
                {isCompleted ? "✓ Hecho" : "○ Pendiente"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SupplementChronoWidget;
