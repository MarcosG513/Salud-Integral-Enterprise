import { useState } from "react";
import { Clock, Edit3, Check, X } from "lucide-react";
import { useClinicalEngine, CLINICAL_SUPPLEMENTS } from "../../context/clinical-engine-context";
import { GlossaryTooltip } from "../../app/components/widgets/ClinicalGlossary";
import { COLORS, GlassCard, PanelHeader, Meter } from "./telemetry-primitives";

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
  const accent = cls === "A" ? COLORS.lime : COLORS.cyan;
  return (
    <span
      className="whitespace-nowrap flex-shrink-0 text-[10px] sm:text-xs px-2 py-0.5 rounded uppercase tracking-[0.12em] font-mono shrink-0"
      style={{ color: accent, border: `1px solid ${accent}55`, background: `${accent}12` }}
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
          className="text-xs font-mono font-semibold"
          style={{ color: value ? accent : COLORS.textDim }}
        >
          {value || placeholder}
        </span>
        <Edit3 size={9} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" style={{ color: COLORS.textDim }} />
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
        className="w-24 text-xs bg-[#070A13] border border-[#00F0FF]/50 rounded px-1.5 py-0.5 font-mono text-[#00F0FF] outline-none"
      />
      <button onClick={commit} className="text-[#39FF14]"><Check size={10} /></button>
      <button onClick={() => setEditing(false)} className="text-slate-500"><X size={10} /></button>
    </div>
  );
}

export function DispensaryMatrix() {
  const { profile, supplementChecklist, toggleSupplementChecked, customSupplementDose, updateSupplementCustom } = useClinicalEngine();

  // Dynamic override for Caffeine based on Circadian Intercept Cutoff (Past 14:00)
  const isCaffeineBlocked = true;

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
    <GlassCard className="h-full flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50">
      <PanelHeader
        index="01"
        title="Mis Suplementos Diarios"
        accent="#10B981"
        right={
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            {compounds.length} Suplementos
          </span>
        }
      />
      <div className="flex-1 overflow-auto p-2 space-y-3">
        {compounds.map((c) => {
          const isCitEmpty = c.id === "cit" && !supplementChecklist?.[c.id] && c.saturation === 0;
          const isCafBlocked = c.id === "caf" && isCaffeineBlocked;
          const custom = customSupplementDose?.[c.id];
          
          let cardBorderColor = "border-slate-100";
          let cardBgColor = "bg-white";
          let accent = c.cls === "A" ? "#10B981" : "#06B6D4";

          if (isCitEmpty) {
            cardBorderColor = "border-rose-200";
            cardBgColor = "bg-rose-50/50";
            accent = "#FF5E7E";
          } else if (isCafBlocked) {
            cardBorderColor = "border-amber-200";
            cardBgColor = "bg-amber-50/50";
            accent = "#F59E0B";
          }

          const isTaken = supplementChecklist?.[c.id] ?? false;

          return (
            <div
              key={`compound-${c.id}`}
              className={`rounded-2xl p-4 transition-all border shadow-md spring-bounce ${
                isTaken 
                  ? "bg-emerald-50/60 border-emerald-200" 
                  : `${cardBgColor} ${cardBorderColor} hover:border-slate-200`
              }`}
              style={{
                borderLeft: `4px solid ${isTaken ? "#10B981" : accent}`,
              }}
            >
              {/* Top row: abbr + name + toggle + class */}
              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className="text-xs px-2.5 py-1 rounded-xl shrink-0 font-mono font-bold whitespace-nowrap bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {c.abbr}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate min-w-0 flex-1">
                    {c.name}
                  </h4>
                  <GlossaryTooltip term={c.id} />
                  {isCafBlocked && (
                    <span className="text-[10px] sm:text-xs font-semibold text-rose-700 border border-rose-200 bg-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0 whitespace-nowrap">
                      Pausa Circadiana
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                  <button
                    onClick={() => toggleSupplementChecked?.(c.id)}
                    disabled={isCafBlocked}
                    className={`text-[10px] sm:text-xs px-3 py-1.5 rounded-xl border transition-all font-bold select-none cursor-pointer min-h-[36px] flex items-center justify-center whitespace-nowrap spring-bounce ${
                      isTaken
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isTaken ? "✓ TOMADO" : "☐ REGISTRAR"}
                  </button>
                  <ClassTag cls={c.cls} />
                </div>
              </div>

              {/* Data row */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-left w-full min-w-0">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.10em] text-slate-500 font-mono mb-0.5 truncate">Dosis Eficaz</div>
                  <InlineEdit
                    value={custom?.doseOverride || ""}
                    placeholder={c.dose}
                    accent={accent}
                    onCommit={(v) => updateSupplementCustom(c.id, { doseOverride: v })}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.10em] text-slate-500 font-mono mb-0.5 truncate">Registro Bruto</div>
                  <div className="text-xs text-slate-300 font-mono truncate font-semibold">{c.tracked}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs uppercase tracking-[0.10em] text-slate-500 font-mono mb-0.5 truncate">Vía Metabólica</div>
                  <div className="text-xs text-slate-300 font-medium leading-tight truncate">{c.pathway}</div>
                </div>
              </div>

              {/* Timing slot row with circadian badge */}
              <div className="mt-2 flex items-center gap-2 border-t border-slate-800/80 pt-2 w-full min-w-0 flex-nowrap overflow-hidden">
                <div className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded-full px-2.5 py-0.5 text-[10px] font-mono flex items-center gap-1.5 shrink-0">
                  <Clock size={10} className="text-cyan-400" />
                  <span className="uppercase tracking-wider font-bold">Horario</span>
                </div>
                <div className="flex-1 min-w-0">
                  <InlineEdit
                    value={custom?.timingSlot || ""}
                    placeholder="Ej: 07:30 · Pre-entreno"
                    accent={COLORS.cyan}
                    onCommit={(v) => updateSupplementCustom(c.id, { timingSlot: v })}
                  />
                </div>
              </div>

              {/* Saturation meter */}
              <div className="mt-2.5 flex items-center gap-2">
                <Meter value={c.saturation} accent={accent} height={5} />
                <span
                  className="text-xs tabular-nums shrink-0 font-mono font-bold"
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
