import { useMemo, useState } from "react";
import {
  Clock,
  Edit3,
  Check,
  X,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
} from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import {
  evaluateSupplementPlan,
  type EvaluatedSupplement,
  type SupplementPlanOutput,
} from "../../engine/supplementEngine";
import { GlossaryTooltip } from "../../app/components/widgets/ClinicalGlossary";
import { GlassCard, PanelHeader, Meter } from "./telemetry-primitives";

function ClassTag({ cls }: { cls: "A" | "B" }) {
  const isA = cls === "A";
  return (
    <span
      className={`whitespace-nowrap shrink-0 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-[0.12em] font-mono font-bold border ${
        isA
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-sky-50 text-sky-700 border-sky-200"
      }`}
    >
      Clase {cls}
    </span>
  );
}

function InlineEdit({
  value,
  placeholder,
  onCommit,
  accent,
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
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="flex items-center gap-1 group cursor-pointer text-left min-w-0"
        title={`Editar ${placeholder}`}
      >
        <span
          className="text-xs font-mono font-bold whitespace-nowrap"
          style={{ color: value ? accent : "#475569" }}
        >
          {value || placeholder}
        </span>
        <Edit3
          size={11}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400"
        />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="w-28 text-xs bg-slate-50 border border-sky-400 rounded-xl px-2 py-0.5 font-mono text-sky-700 font-bold outline-none shadow-xs"
      />
      <button
        type="button"
        onClick={commit}
        className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
      >
        <Check size={12} />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function SupplementCard({
  item,
  onToggle,
  onUpdateCustom,
  onOpenHepaticGate,
}: {
  item: EvaluatedSupplement;
  onToggle: (id: string) => void;
  onUpdateCustom: (id: string, patch: { doseOverride?: string; timingSlot?: string }) => void;
  onOpenHepaticGate?: () => void;
}) {
  const accent = item.isBlocked
    ? "#E11D48"
    : item.isTaken
    ? "#10B981"
    : item.evidenceClass === "A"
    ? "#0284C7"
    : "#6366F1";

  return (
    <div
      className={`rounded-2xl p-4 transition-all border shadow-sm ${
        item.isBlocked
          ? "bg-amber-50/40 border-amber-200"
          : item.isTaken
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-white border-slate-200/80 hover:border-slate-300"
      }`}
      style={{
        borderLeft: `4px solid ${accent}`,
      }}
    >
      {/* Cabecera en 2 filas independientes sin solapamiento ni truncamiento */}
      <div className="flex flex-col gap-2.5 w-full min-w-0">
        {/* Fila 1 (Identidad) */}
        <div className="flex items-start justify-between gap-2 w-full min-w-0">
          <span className="text-xs px-2.5 py-1 rounded-xl shrink-0 font-mono font-bold whitespace-nowrap bg-slate-100 text-slate-800 border border-slate-200 shadow-xs">
            {item.abbr}
          </span>
          <h4 className="flex-1 min-w-0 whitespace-normal break-words leading-snug font-bold text-slate-900 text-xs sm:text-sm">
            {item.name}
          </h4>
          <div className="shrink-0 -mt-1 -mr-1">
            <GlossaryTooltip term={item.id} />
          </div>
        </div>

        {/* Fila 2 (Acción + Clase) */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          {item.requiresHepaticGate ? (
            <button
              type="button"
              onClick={onOpenHepaticGate}
              className="shrink-0 whitespace-nowrap text-[11px] px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold cursor-pointer min-h-[36px] flex items-center gap-1"
            >
              🔒 Compuerta Hepática
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              disabled={item.isBlocked}
              className={`shrink-0 whitespace-nowrap text-[11px] px-3.5 py-1.5 rounded-xl border transition-all font-bold select-none min-h-[36px] flex items-center justify-center shadow-xs ${
                item.isBlocked
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : item.isTaken
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 cursor-pointer"
                  : "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700 cursor-pointer"
              }`}
            >
              {item.isBlocked ? "BLOQUEADA" : item.isTaken ? "✓ TOMADO" : "☐ REGISTRAR"}
            </button>
          )}
          <ClassTag cls={item.evidenceClass} />
        </div>
      </div>

      {/* Badge Condicional si aplica (omite pill redundante de compuerta hepática) */}
      {item.conditionalBadge &&
        !item.requiresHepaticGate &&
        item.conditionalBadge !== "Compuerta Hepática Obligatoria" && (
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                item.isBlocked
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-sky-50 text-sky-700 border-sky-200"
              }`}
            >
              {item.conditionalBadge}
            </span>
          </div>
        )}

      {/* Métricas completas (2 arriba + Vía Metabólica completa abajo) */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-left w-full">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.10em] text-slate-500 font-mono font-semibold mb-1 whitespace-normal">
            Dosis Eficaz
          </div>
          <InlineEdit
            value={item.resolvedDose === item.standardDose ? "" : item.resolvedDose}
            placeholder={item.resolvedDose}
            accent={accent}
            onCommit={(v) => onUpdateCustom(item.id, { doseOverride: v })}
          />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.10em] text-slate-500 font-mono font-semibold mb-1 whitespace-normal">
            Estado / Seguimiento
          </div>
          <div className="text-xs text-slate-700 font-mono font-bold whitespace-normal break-words">
            {item.trackedLabel}
          </div>
        </div>
        <div className="col-span-2 min-w-0 bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
          <div className="text-[10px] uppercase tracking-[0.10em] text-slate-500 font-mono font-semibold mb-0.5 whitespace-normal">
            Vía Metabólica
          </div>
          <div className="text-xs text-slate-700 font-medium leading-snug whitespace-normal break-words">
            {item.pathway}
          </div>
        </div>
      </div>

      {/* Nota Condicional / Clínica */}
      {(item.conditionalNote || item.editorialDisclaimer) && (
        <p className="mt-2.5 text-[11px] leading-snug text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl p-2.5">
          {item.conditionalNote || item.editorialDisclaimer}
        </p>
      )}

      {/* Insignia Horaria en UNA sola línea limpia */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 w-full flex-nowrap">
        <div className="bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <Clock size={11} className="text-sky-600 shrink-0" />
          <span className="uppercase tracking-wider">Horario</span>
        </div>
        <div className="min-w-0 overflow-x-auto scrollbar-none flex items-center">
          <InlineEdit
            value={item.timingSlot === item.timingGuide ? "" : item.timingSlot}
            placeholder={item.timingSlot}
            accent="#0284C7"
            onCommit={(v) => onUpdateCustom(item.id, { timingSlot: v })}
          />
        </div>
      </div>

      {/* Saturation meter */}
      <div className="mt-2.5 flex items-center gap-2.5">
        <Meter value={item.saturationPct} accent={accent} height={6} />
        <span className="text-xs tabular-nums shrink-0 font-mono font-extrabold" style={{ color: accent }}>
          {item.saturationPct}%
        </span>
      </div>
    </div>
  );
}

export function DispensaryMatrix({ plan: externalPlan }: { plan?: SupplementPlanOutput } = {}) {
  const {
    profile,
    metrics,
    hormonalLabValues,
    supplementChecklist,
    toggleSupplementChecked,
    customSupplementDose,
    updateSupplementCustom,
    updateProfileVariable,
    clearAshwagandhaSafetyGate,
  } = useClinicalEngine();

  const [showContextual, setShowContextual] = useState(false);
  const [hepaticModalOpen, setHepaticModalOpen] = useState(false);
  const [hepaticChecks, setHepaticChecks] = useState<[boolean, boolean, boolean]>([
    false,
    false,
    false,
  ]);

  const plan = useMemo(() => {
    if (externalPlan) return externalPlan;
    return evaluateSupplementPlan({
      sexoBiologico: profile.sexoBiologico || "male",
      peso: profile.peso || 75,
      horarioEntreno: profile.horarioEntreno || "afternoon",
      bedtimeHour: profile.bedtimeHour ?? 23,
      sleepProtection: metrics.sleepProtection,
      hormonalLabValues,
      supplementChecklist: supplementChecklist || {},
      customSupplementDose: customSupplementDose || {},
      creatineActivatedAt: profile.creatineActivatedAt ?? null,
      ashwagandhaSafetyCleared: Boolean(profile.ashwagandhaSafetyCleared),
      optInVascularVitality: Boolean(profile.optInVascularVitality),
      citrullineGrams: profile.citrullineGrams ?? 8,
      citrullineTimingMin: profile.citrullineTimingMin ?? 35,
      doreySessionsPerWeek: profile.doreySessionsPerWeek ?? 0,
    });
  }, [
    externalPlan,
    profile,
    metrics.sleepProtection,
    hormonalLabValues,
    supplementChecklist,
    customSupplementDose,
  ]);

  const allHepaticChecked = hepaticChecks[0] && hepaticChecks[1] && hepaticChecks[2];
  const ashSpec = plan.coreSupplements.find((s) => s.id === "ash");

  const handleConfirmHepaticGate = () => {
    if (!allHepaticChecked) return;
    clearAshwagandhaSafetyGate?.();
    setHepaticModalOpen(false);
    setHepaticChecks([false, false, false]);
  };

  return (
    <GlassCard className="h-full flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/40">
      <PanelHeader
        index="01"
        title="Dispensario Condicional (Evidencia 2026)"
        accent="#10B981"
        right={
          <span className="text-xs uppercase tracking-wider font-bold text-slate-500 font-mono whitespace-nowrap">
            Núcleo + Opcionales
          </span>
        }
      />

      {/* Compuerta Hepática Modal/Panel para Ashwagandha */}
      {hepaticModalOpen && ashSpec && (
        <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              Compuerta de Seguridad Hepática · Ashwagandha KSM-66
            </div>
            <button
              type="button"
              onClick={() => setHepaticModalOpen(false)}
              className="text-amber-700 hover:text-amber-900 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            {ashSpec.hepaticSafetyWarning}
          </p>
          <div className="space-y-2">
            {(ashSpec.hepaticChecks || []).map((txt, idx) => (
              <label
                key={`hep-chk-${idx}`}
                className="flex items-start gap-2.5 bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={hepaticChecks[idx]}
                  onChange={(e) => {
                    const next: [boolean, boolean, boolean] = [...hepaticChecks] as [
                      boolean,
                      boolean,
                      boolean
                    ];
                    next[idx] = e.target.checked;
                    setHepaticChecks(next);
                  }}
                  className="mt-0.5 accent-amber-600 shrink-0"
                />
                <span className="leading-snug">{txt}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!allHepaticChecked}
            onClick={handleConfirmHepaticGate}
            className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              allHepaticChecked
                ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                : "bg-amber-200 text-amber-500 cursor-not-allowed"
            }`}
          >
            Confirmar Descarte Hepático y Habilitar Ashwagandha
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-1 space-y-4">
        {/* Sección 1: Núcleo Condicional */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
            Núcleo Condicional de Alto Impacto
          </div>
          {plan.coreSupplements.map((item) => (
            <SupplementCard
              key={`core-${item.id}`}
              item={item}
              onToggle={toggleSupplementChecked}
              onUpdateCustom={updateSupplementCustom}
              onOpenHepaticGate={() => setHepaticModalOpen(true)}
            />
          ))}
        </div>

        {/* Sección 2: Soporte Base Contextual (Colapsable / Opcional) */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowContextual((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="text-left">
              <span className="text-xs font-extrabold text-slate-800 block">
                Soporte Base Contextual ({plan.contextualSupplements.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Beta-Alanina · Omega-3 · Vitamina D3 (c/ grasa) · Magnesio · Suero WPI
              </span>
            </div>
            {showContextual ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showContextual && (
            <div className="mt-3 space-y-3">
              {plan.contextualSupplements.map((item) => (
                <SupplementCard
                  key={`ctx-${item.id}`}
                  item={item}
                  onToggle={toggleSupplementChecked}
                  onUpdateCustom={updateSupplementCustom}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sección 3: Módulo Privado Opt-In ("Vitalidad y Salud Vascular") */}
        <div className="border-t border-slate-100 pt-3">
          <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="size-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <HeartHandshake size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                    {plan.vascularVitalityModule.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {plan.vascularVitalityModule.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateProfileVariable(
                    "optInVascularVitality",
                    !plan.vascularVitalityModule.enabled
                  )
                }
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                  plan.vascularVitalityModule.enabled
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                {plan.vascularVitalityModule.enabled ? "Activo (Opt-In)" : "Activar Módulo"}
              </button>
            </div>

            {plan.vascularVitalityModule.enabled && (
              <div className="space-y-3 pt-2 border-t border-indigo-200/60">
                <SupplementCard
                  item={plan.vascularVitalityModule.citrullineSupplement}
                  onToggle={toggleSupplementChecked}
                  onUpdateCustom={updateSupplementCustom}
                />
                <div className="rounded-xl bg-white border border-indigo-100 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-indigo-700">
                    <span>Protocolo Dorey Vascular</span>
                    <span>
                      NOx: {plan.vascularVitalityModule.noxScore}% · Dorey:{" "}
                      {plan.vascularVitalityModule.doreyPercentage}%
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium leading-snug">
                    {plan.vascularVitalityModule.doreyProtocolSummary}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {plan.vascularVitalityModule.clinicalDisclaimer}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
