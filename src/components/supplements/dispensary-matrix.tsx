import { useState } from "react";
import { Clock, Edit3, Check, X } from "lucide-react";
import { useClinicalEngine, CLINICAL_SUPPLEMENTS } from "../../context/clinical-engine-context";
import { GlossaryTooltip } from "../../app/components/widgets/ClinicalGlossary";
import { GlassCard, PanelHeader, Meter } from "./telemetry-primitives";

type Compound = {
  id: string;
  name: string;
  abbr: string;
  dose: string;
  tracked: string;
  saturation: number;
  pathway: string;
  cls: "A" | "B";
};

function ClassTag({ cls }: { cls: "A" | "B" }) {
  const isA = cls === "A";
  return (
    <span
      className={`whitespace-nowrap flex-shrink-0 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-[0.12em] font-mono font-bold shrink-0 border ${
        isA 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
          : "bg-sky-50 text-sky-700 border-sky-200"
      }`}
    >
      Clase {cls}
    </span>
  );
}

// ── Inline editable dose/timing cell ────────────────────────────────────────
function InlineEdit({
  value,
  placeholder,
  onCommit,
  accent
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
  accent: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onCommit(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className="flex items-center gap-1 group cursor-pointer text-left"
        title={`Editar ${placeholder}`}
      >
        <span
          className="text-xs font-mono font-bold truncate"
          style={{ color: value ? accent : "#64748B" }}
        >
          {value || placeholder}
        </span>
        <Edit3 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        onBlur={commit}
        placeholder={placeholder}
        className="w-28 text-xs bg-slate-50 border border-sky-400 rounded-xl px-2 py-0.5 font-mono text-sky-700 font-bold outline-none shadow-xs"
      />
      <button onClick={commit} className="text-emerald-600 hover:text-emerald-700 p-0.5"><Check size={12} /></button>
      <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={12} /></button>
    </div>
  );
}

export function DispensaryMatrix() {
  const { profile, supplementChecklist, toggleSupplementChecked, customSupplementDose, updateSupplementCustom } = useClinicalEngine();

  // Dynamic override for Caffeine based on Circadian Intercept Cutoff (Past 14:00)
  const isCaffeineBlocked = new Date().getHours() >= 14;

  const compounds: Compound[] = (CLINICAL_SUPPLEMENTS || []).map((s) => {
    const isTaken = supplementChecklist?.[s.id] ?? false;
    const custom = customSupplementDose?.[s.id];
    
    let saturation = s.saturationBase;
    let tracked = s.dose;
    
    if (s.id === "cre") {
      saturation = isTaken ? 100 : 33;
      tracked = isTaken ? "5000 / 5000 mg" : "0 / 5000 mg";
    } else if (s.id === "cit") {
      const citPercent = Math.min(100, Math.round((profile?.citrullineGrams / 8.0) * 100));
      const citTracked = `${(profile?.citrullineGrams * 1000).toFixed(0)} / 8000 mg`;
      saturation = isTaken ? 100 : citPercent;
      tracked = isTaken ? "8000 / 8000 mg" : citTracked;
    } else if (s.id === "ash") {
      saturation = isTaken ? 100 : 25;
      tracked = isTaken ? "600 / 600 mg" : "0 / 600 mg";
    } else if (s.id === "caf") {
      saturation = isCaffeineBlocked ? 0 : (isTaken ? 100 : 15);
      tracked = isCaffeineBlocked ? "0 / 200 mg (BLOQUEADO)" : (isTaken ? "200 / 200 mg" : "0 / 200 mg");
    } else if (s.id === "bet") {
      saturation = isTaken ? 100 : 50;
      tracked = isTaken ? "3200 / 3200 mg" : "1600 / 3200 mg";
    } else if (s.id === "the") {
      saturation = isTaken ? 100 : 20;
      tracked = isTaken ? "100 / 100 mg" : "0 / 100 mg";
    } else {
      saturation = isTaken ? 100 : Math.round(s.saturationBase / 3);
      tracked = isTaken ? `${s.dose} / ${s.dose}` : `0 / ${s.dose}`;
    }

    // Apply dose override if set
    const doseDisplay = custom?.doseOverride || s.dose;

    return {
      ...s,
      dose: doseDisplay,
      tracked,
      saturation
    };
  });

  return (
    <GlassCard className="h-full flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/40">
      <PanelHeader
        index="01"
        title="Mis Suplementos Diarios"
        accent="#10B981"
        right={
          <span className="text-xs uppercase tracking-wider font-bold text-slate-500 font-mono">
            {compounds.length} Suplementos
          </span>
        }
      />
      <div className="flex-1 overflow-auto p-1 space-y-3">
        {compounds.map((c) => {
          const isCitEmpty = c.id === "cit" && !supplementChecklist?.[c.id] && c.saturation === 0;
          const isCafBlocked = c.id === "caf" && isCaffeineBlocked;
          const custom = customSupplementDose?.[c.id];
          
          let cardBorderColor = "border-slate-200/80";
          let cardBgColor = "bg-white";
          let accent = c.cls === "A" ? "#10B981" : "#0284C7";

          if (isCitEmpty) {
            cardBorderColor = "border-rose-200";
            cardBgColor = "bg-rose-50/40";
            accent = "#EF4444";
          } else if (isCafBlocked) {
            cardBorderColor = "border-amber-200";
            cardBgColor = "bg-amber-50/40";
            accent = "#F59E0B";
          }

          const isTaken = supplementChecklist?.[c.id] ?? false;

          return (
            <div
              key={`compound-${c.id}`}
              className={`rounded-2xl p-4 transition-all border shadow-sm ${
                isTaken 
                  ? "bg-emerald-50/50 border-emerald-200" 
                  : `${cardBgColor} ${cardBorderColor} hover:border-slate-300`
              }`}
              style={{
                borderLeft: `4px solid ${isTaken ? "#10B981" : accent}`,
              }}
            >
              {/* Top row: abbr + name + toggle + class */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="text-xs px-2.5 py-1 rounded-xl shrink-0 font-mono font-bold whitespace-nowrap bg-slate-100 text-slate-800 border border-slate-200 shadow-xs"
                  >
                    {c.abbr}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm whitespace-normal break-words leading-snug">
                    {c.name}
                  </h4>
                  <div className="shrink-0">
                    <GlossaryTooltip term={c.id} />
                  </div>
                  {isCafBlocked && (
                    <span className="text-[10px] sm:text-xs font-bold text-rose-700 border border-rose-200 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap">
                      Pausa Circadiana
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleSupplementChecked?.(c.id)}
                    disabled={isCafBlocked}
                    className={`text-[10px] sm:text-xs px-3.5 py-1.5 rounded-xl border transition-all font-bold select-none cursor-pointer min-h-[36px] flex items-center justify-center whitespace-nowrap shadow-xs ${
                      isTaken
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                        : "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700"
                    }`}
                  >
                    {isTaken ? "✓ TOMADO" : "☐ REGISTRAR"}
                  </button>
                  <ClassTag cls={c.cls} />
                </div>
              </div>

              {/* Data row: 2 columnas superiores + vía metabólica col-span-2 completa */}
              <div className="mt-3 grid grid-cols-2 gap-3 text-left w-full">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.10em] text-slate-500 font-mono font-semibold mb-1 whitespace-normal">
                    Dosis Eficaz
                  </div>
                  <InlineEdit
                    value={custom?.doseOverride || ""}
                    placeholder={c.dose}
                    accent={accent}
                    onCommit={(v) => updateSupplementCustom(c.id, { doseOverride: v })}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.10em] text-slate-500 font-mono font-semibold mb-1 whitespace-normal">
                    Registro Bruto
                  </div>
                  <div className="text-xs text-slate-700 font-mono font-bold whitespace-normal break-words">
                    {c.tracked}
                  </div>
                </div>
                <div className="col-span-2 min-w-0 bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase tracking-[0.10em] text-slate-500 font-mono font-semibold mb-0.5 whitespace-normal">
                    Vía Metabólica
                  </div>
                  <div className="text-xs text-slate-700 font-medium leading-snug whitespace-normal break-words">
                    {c.pathway}
                  </div>
                </div>
              </div>

              {/* Timing slot row with circadian badge */}
              <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2 w-full min-w-0 flex-nowrap overflow-hidden">
                <div className="bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap flex-shrink-0">
                  <Clock size={11} className="text-sky-600" />
                  <span className="uppercase tracking-wider">Horario</span>
                </div>
                <div className="flex-1 min-w-0">
                  <InlineEdit
                    value={custom?.timingSlot || ""}
                    placeholder="Ej: 07:30 · Pre-entreno"
                    accent="#0284C7"
                    onCommit={(v) => updateSupplementCustom(c.id, { timingSlot: v })}
                  />
                </div>
              </div>

              {/* Saturation meter */}
              <div className="mt-2.5 flex items-center gap-2.5">
                <Meter value={c.saturation} accent={accent} height={6} />
                <span
                  className="text-xs tabular-nums shrink-0 font-mono font-extrabold"
                  style={{ color: accent }}
                >
                  {c.saturation}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
