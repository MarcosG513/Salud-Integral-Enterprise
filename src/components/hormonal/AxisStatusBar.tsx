import { Activity, ShieldCheck, ShieldAlert, Edit3, Check, X } from "lucide-react";
import { useClinicalEngine, HormonalLabValues } from "../../context/clinical-engine-context";
import { COLORS, mono } from "./tokens";
import { GlossaryTooltip } from "../../app/components/widgets/ClinicalGlossary";
import { useState } from "react";

interface AxisStatusBarProps {
  suppressed: boolean;
}

// ── Inline editable lab value cell ──────────────────────────────────────────
function InlineLabValue({
  label,
  value,
  unit,
  color,
  tooltip,
  labKey,
  onUpdate,
}: {
  label: string;
  value: number;
  unit?: string;
  color: string;
  tooltip?: React.ReactNode;
  labKey: keyof HormonalLabValues;
  onUpdate: (key: keyof HormonalLabValues, val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdate(labKey, parsed);
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1 p-3 border border-slate-100 rounded-2xl bg-slate-50/70 w-full min-w-0 transition-all hover:border-slate-200">
      <span className="uppercase text-[10px] tracking-wider flex items-center justify-between font-bold text-slate-500">
        <span className="truncate">{label}</span>
        {tooltip}
      </span>

      {editing ? (
        <div className="flex items-center gap-1 mt-0.5">
          <input
            autoFocus
            type="number"
            step="any"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            onBlur={commit}
            className="w-full min-w-0 text-center bg-white border border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-2 py-1 font-mono text-sm font-bold text-slate-900 outline-none shadow-xs"
          />
          <button onClick={commit} className="text-emerald-600 shrink-0 p-1"><Check size={14} /></button>
          <button onClick={() => setEditing(false)} className="text-slate-400 shrink-0 p-1"><X size={14} /></button>
        </div>
      ) : (
        <button
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          className="group flex items-center gap-1 cursor-pointer text-left w-full justify-between mt-0.5"
          title={`Editar ${label}`}
        >
          <span className="font-mono font-black text-sm sm:text-base truncate" style={{ color }}>
            {value}
            {unit && <span className="text-slate-400 text-[10px] ml-1 font-semibold">{unit}</span>}
          </span>
          <Edit3 size={12} className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400" />
        </button>
      )}
    </div>
  );
}

export function AxisStatusBar({ suppressed }: AxisStatusBarProps) {
  const { hormonalLabValues, updateHormonalLab } = useClinicalEngine();

  const statusColor = suppressed ? "#EF4444" : "#10B981";
  const statusText = suppressed ? "RIESGO DE SUPRESIÓN CRÍTICA (RED-S)" : "FUNCIONAL / OPTIMO";

  const lhColor = hormonalLabValues.lh < 1.5 ? "#EF4444" : "#10B981";
  const fshColor = hormonalLabValues.fsh < 1.5 ? "#EF4444" : "#10B981";
  const testoColor = hormonalLabValues.testosterone < 300 ? "#EF4444" : "#06B6D4";
  const cortisolColor = hormonalLabValues.cortisol > 22 ? "#EF4444" : "#06B6D4";

  return (
    <div
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-3xl p-5 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 w-full min-w-0"
    >
      <div className="flex items-center justify-between gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/10">
            <Activity size={20} className="text-rose-500" />
          </div>
          <div className="flex flex-col leading-tight">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              Análisis Hormonal y Laboratorio
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Estado de Telemetría HPG & Cortisol
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 border ${
            suppressed ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {suppressed ? (
            <ShieldAlert size={16} className="text-rose-600 animate-pulse shrink-0" />
          ) : (
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-extrabold tracking-wide">
            {statusText}
          </span>
        </div>
      </div>

      {/* Inline-editable lab value metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full">
        <InlineLabValue
          label="Pulso LH"
          labKey="lh"
          value={hormonalLabValues.lh}
          unit="UI/L"
          color={lhColor}
          tooltip={<GlossaryTooltip term="lh" position="bottom" />}
          onUpdate={updateHormonalLab}
        />
        <InlineLabValue
          label="FSH"
          labKey="fsh"
          value={hormonalLabValues.fsh}
          unit="UI/L"
          color={fshColor}
          tooltip={<GlossaryTooltip term="fsh" position="bottom" />}
          onUpdate={updateHormonalLab}
        />
        <InlineLabValue
          label="Testo Total"
          labKey="testosterone"
          value={hormonalLabValues.testosterone}
          unit="ng/dL"
          color={testoColor}
          onUpdate={updateHormonalLab}
        />
        <InlineLabValue
          label="SHBG"
          labKey="shbg"
          value={hormonalLabValues.shbg}
          unit="nmol/L"
          color={COLORS.textMute}
          tooltip={<GlossaryTooltip term="shbg" position="bottom" />}
          onUpdate={updateHormonalLab}
        />
        <InlineLabValue
          label="Cortisol"
          labKey="cortisol"
          value={hormonalLabValues.cortisol}
          unit="µg/dL"
          color={cortisolColor}
          tooltip={<GlossaryTooltip term="cortisol" position="bottom" />}
          onUpdate={updateHormonalLab}
        />
      </div>
    </div>
  );
}
