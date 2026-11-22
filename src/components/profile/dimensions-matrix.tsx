import { Ruler, Mars, Venus } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { Panel, Field, FeedLine } from "./panel-shell";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  return (
    <div
      className="flex items-stretch rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs"
    >
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent px-3 py-2.5 outline-none text-slate-900 font-mono font-bold text-lg"
        style={{ fontFamily: MONO }}
      />
      <span
        className="flex items-center px-3 text-slate-500 border-l border-slate-200 font-mono text-xs font-semibold"
        style={{ fontFamily: MONO }}
      >
        {unit}
      </span>
      <div className="flex flex-col border-l border-slate-200 bg-white">
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex-1 px-3 text-slate-600 hover:text-sky-600 hover:bg-slate-50 font-mono text-xs font-bold transition-colors"
          style={{ fontFamily: MONO }}
        >
          ▲
        </button>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex-1 px-3 text-slate-600 hover:text-sky-600 hover:bg-slate-50 border-t border-slate-200 font-mono text-xs font-bold transition-colors"
          style={{ fontFamily: MONO }}
        >
          ▼
        </button>
      </div>
    </div>
  );
}

function MicroSlider({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-sky-600"
      style={{
        background: `linear-gradient(90deg, #0284C7 ${pct}%, #E2E8F0 ${pct}%)`,
      }}
    />
  );
}

export function DimensionsMatrix() {
  const { profile, updateProfileVariable } = useClinicalEngine();

  const height = profile?.height ?? 180;
  const age = profile?.age ?? 30;
  const sex = profile?.sex === "male" ? "M" : "F";

  const setHeight = (val: number) => updateProfileVariable?.("height", val);
  const setAge = (val: number) => updateProfileVariable?.("age", val);
  const setSex = (val: "M" | "F") => updateProfileVariable?.("sex", val === "M" ? "male" : "female");

  // Macro override overrides with strict Number parsing
  const deficitTarget = Number(profile?.deficitTarget ?? profile?.superavit ?? 0);
  const proteinMult = Number(profile?.factorProteina ?? 2.0);
  const fatMult = Number(profile?.factorGrasa ?? 1.0);
  const activityFactor = Number(profile?.activityFactor ?? 1.55);

  return (
    <Panel title="Dimensiones y Configuración" code="MTX//01" icon={<Ruler size={16} />}>
      <div className="flex flex-col gap-5 text-left">
        <div>
          <Field label="Altura">
            <NumberStepper value={height} onChange={setHeight} min={120} max={220} step={1} unit="cm" />
          </Field>
          <MicroSlider value={height} onChange={setHeight} min={120} max={220} step={1} />
          <FeedLine label="→ MOTOR CUNNINGHAM" />
        </div>

        <div>
          <Field label="Edad">
            <NumberStepper value={age} onChange={setAge} min={12} max={99} step={1} unit="años" />
          </Field>
          <MicroSlider value={age} onChange={setAge} min={12} max={99} step={1} />
          <FeedLine label="→ MOTOR TMB" />
        </div>

        <div>
          <span
            className="block mb-1.5 uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-semibold"
            style={{ fontFamily: MONO }}
          >
            Sexo Biológico
          </span>
          <div
            className="relative grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1"
          >
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-out bg-white shadow-sm border border-slate-200/80"
              style={{
                transform: sex === "F" ? "translateX(calc(100% + 4px))" : "translateX(0)",
              }}
            />
            {(["M", "F"] as const).map((s) => (
              <button
                key={`sex-${s}`}
                onClick={() => setSex(s)}
                className="relative z-10 flex items-center justify-center gap-2 py-2 transition-colors font-mono text-xs font-bold"
                style={{
                  fontFamily: MONO,
                  color: sex === s ? "#0284C7" : "#64748B",
                }}
              >
                {s === "M" ? <Mars size={14} /> : <Venus size={14} />}
                {s === "M" ? "MASCULINO" : "FEMENINO"}
              </button>
            ))}
          </div>
          <FeedLine label="→ COEFICIENTE HORMONAL" />
        </div>

        {/* Daily Activity Level Dropdown */}
        <div>
          <span
            className="block mb-1.5 uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-semibold"
            style={{ fontFamily: MONO }}
          >
            Nivel de Actividad Diaria
          </span>
          <select
            value={activityFactor}
            onChange={(e) => updateProfileVariable?.("activityFactor", Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900 font-mono text-xs font-bold outline-none focus:border-sky-500 shadow-xs"
            style={{ fontFamily: MONO }}
          >
            <option value={1.2}>Sedentario (1.2x TMB)</option>
            <option value={1.375}>Ligero (1.375x TMB)</option>
            <option value={1.55}>Moderado (1.55x TMB)</option>
            <option value={1.725}>Intenso (1.725x TMB)</option>
            <option value={1.9}>Muy Intenso (1.9x TMB)</option>
          </select>
          <FeedLine label="→ FACTOR TDEE" />
        </div>

        {/* Deficit / Surplus Slider */}
        <div>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-semibold" style={{ fontFamily: MONO }}>
              Déficit / Superávit Calórico
            </span>
            <span 
              className="px-2 py-0.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 font-mono text-xs font-bold"
              style={{ fontFamily: MONO }}
            >
              {deficitTarget > 0 ? `Déficit: ${deficitTarget} kcal` : deficitTarget < 0 ? `Superávit: ${Math.abs(deficitTarget)} kcal` : "Mantenimiento"}
            </span>
          </div>
          <input
            type="range"
            min={-1000}
            max={1500}
            step={50}
            value={deficitTarget}
            onChange={(e) => updateProfileVariable?.("deficitTarget", Number(e.target.value))}
            className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-sky-600"
            style={{
              background: `linear-gradient(90deg, #0284C7 ${((deficitTarget + 1000) / 2500) * 100}%, #E2E8F0 ${((deficitTarget + 1000) / 2500) * 100}%)`,
            }}
          />
          <FeedLine label="→ ENERGÍA META" />
        </div>

        {/* Protein Multiplier Slider */}
        <div>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-semibold" style={{ fontFamily: MONO }}>
              Multiplicador de Proteína
            </span>
            <span 
              className="px-2 py-0.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono text-xs font-bold"
              style={{ fontFamily: MONO }}
            >
              {proteinMult.toFixed(1)} g/kg
            </span>
          </div>
          <input
            type="range"
            min={1.2}
            max={3.5}
            step={0.1}
            value={proteinMult}
            onChange={(e) => updateProfileVariable?.("factorProteina", Number(e.target.value))}
            className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-emerald-600"
            style={{
              background: `linear-gradient(90deg, #10B981 ${((proteinMult - 1.2) / 2.3) * 100}%, #E2E8F0 ${((proteinMult - 1.2) / 2.3) * 100}%)`,
            }}
          />
          <FeedLine label="→ DISTRIBUCIÓN MPS" />
        </div>

        {/* Fat Multiplier Slider */}
        <div>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-semibold" style={{ fontFamily: MONO }}>
              Multiplicador de Grasa
            </span>
            <span 
              className="px-2 py-0.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-mono text-xs font-bold"
              style={{ fontFamily: MONO }}
            >
              {fatMult.toFixed(1)} g/kg
            </span>
          </div>
          <input
            type="range"
            min={0.4}
            max={2.0}
            step={0.1}
            value={fatMult}
            onChange={(e) => updateProfileVariable?.("factorGrasa", Number(e.target.value))}
            className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-amber-600"
            style={{
              background: `linear-gradient(90deg, #F59E0B ${((fatMult - 0.4) / 1.6) * 100}%, #E2E8F0 ${((fatMult - 0.4) / 1.6) * 100}%)`,
            }}
          />
          <FeedLine label="→ PISO HORMONAL (0.6g/kg)" />
        </div>
      </div>
    </Panel>
  );
}
