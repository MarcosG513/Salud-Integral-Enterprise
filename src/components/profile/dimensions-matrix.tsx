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
      className="flex items-stretch rounded-md border overflow-hidden"
      style={{ borderColor: "#1E293B", background: "#070A13" }}
    >
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent px-3 py-2.5 outline-none text-[#E2E8F0] font-mono"
        style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600 }}
      />
      <span
        className="flex items-center px-3 text-[#475569] border-l font-mono text-[11px]"
        style={{ borderColor: "#1E293B", fontFamily: MONO }}
      >
        {unit}
      </span>
      <div className="flex flex-col border-l" style={{ borderColor: "#1E293B" }}>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex-1 px-2.5 text-[#64748B] hover:text-[#00F0FF] hover:bg-[#00F0FF]/5 font-mono text-[11px]"
          style={{ fontFamily: MONO }}
        >
          ▲
        </button>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex-1 px-2.5 text-[#64748B] hover:text-[#00F0FF] hover:bg-[#00F0FF]/5 border-t font-mono text-[11px]"
          style={{ borderColor: "#1E293B", fontFamily: MONO }}
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
      className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-[#00F0FF]"
      style={{
        background: `linear-gradient(90deg, #00F0FF ${pct}%, #1E293B ${pct}%)`,
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
  const deficitTarget = Number(profile?.superavit ?? 0);
  const proteinMult = Number(profile?.factorProteina ?? 2.0);
  const fatMult = Number(profile?.factorGrasa ?? 1.0);
  const activityFactor = Number(profile?.activityFactor ?? 1.55);

  return (
    <Panel title="Dimensiones y Configuración" code="MTX//01" icon={<Ruler size={15} />}>
      <div className="flex flex-col gap-5 text-left">
        <div>
          <Field label="Altura">
            <NumberStepper value={height} onChange={setHeight} min={120} max={220} step={1} unit="cm" />
          </Field>
          <MicroSlider value={height} onChange={setHeight} min={120} max={220} step={1} />
          <FeedLine label="→ MOTOR" />
        </div>

        <div>
          <Field label="Edad">
            <NumberStepper value={age} onChange={setAge} min={12} max={99} step={1} unit="años" />
          </Field>
          <MicroSlider value={age} onChange={setAge} min={12} max={99} step={1} />
          <FeedLine label="→ MOTOR" />
        </div>

        <div>
          <span
            className="block mb-1.5 uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs"
            style={{ fontFamily: MONO }}
          >
            Sexo Biológico
          </span>
          <div
            className="relative grid grid-cols-2 rounded-md border p-1"
            style={{ borderColor: "#1E293B", background: "#070A13" }}
          >
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded transition-transform duration-300 ease-out"
              style={{
                transform: sex === "F" ? "translateX(calc(100% + 4px))" : "translateX(0)",
                background: "rgba(0,240,255,0.14)",
                border: "1px solid rgba(0,240,255,0.5)",
              }}
            />
            {(["M", "F"] as const).map((s) => (
              <button
                key={`sex-${s}`}
                onClick={() => setSex(s)}
                className="relative z-10 flex items-center justify-center gap-2 py-2 transition-colors font-mono text-[12px] font-bold"
                style={{
                  fontFamily: MONO,
                  color: sex === s ? "#00F0FF" : "#64748B",
                }}
              >
                {s === "M" ? <Mars size={14} /> : <Venus size={14} />}
                {s === "M" ? "MASCULINO" : "FEMENINO"}
              </button>
            ))}
          </div>
          <FeedLine label="→ MOTOR" />
        </div>

        {/* Daily Activity Level Dropdown */}
        <div>
          <span
            className="block mb-1.5 uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs"
            style={{ fontFamily: MONO }}
          >
            Nivel de Actividad Diaria
          </span>
          <select
            value={activityFactor}
            onChange={(e) => updateProfileVariable?.("activityFactor", Number(e.target.value))}
            className="w-full rounded-md border p-2 bg-[#070A13] text-[#E2E8F0] font-mono text-xs border-[#1E293B] outline-none h-9"
          >
            <option value={1.2}>Sedentario (1.2x TMB)</option>
            <option value={1.375}>Ligero (1.375x TMB)</option>
            <option value={1.55}>Moderado (1.55x TMB)</option>
            <option value={1.725}>Intenso (1.725x TMB)</option>
            <option value={1.9}>Muy Intenso (1.9x TMB)</option>
          </select>
          <FeedLine label="→ MOTOR" />
        </div>

        {/* Deficit / Surplus Slider */}
        <div>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs" style={{ fontFamily: MONO }}>
              Déficit / Superávit Calórico
            </span>
            <span style={{ fontFamily: MONO, color: "#00F0FF", fontSize: 13, fontWeight: "bold" }}>
              {deficitTarget > 0 ? `Déficit: ${deficitTarget} kcal` : deficitTarget < 0 ? `Superávit: ${Math.abs(deficitTarget)} kcal` : "Mantenimiento"}
            </span>
          </div>
          <input
            type="range"
            min={-1000}
            max={1500}
            step={50}
            value={deficitTarget}
            onChange={(e) => updateProfileVariable?.("superavit", Number(e.target.value))}
            className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-[#00F0FF]"
            style={{
              background: `linear-gradient(90deg, #00F0FF ${((deficitTarget + 1000) / 2500) * 100}%, #1E293B ${((deficitTarget + 1000) / 2500) * 100}%)`,
            }}
          />
          <FeedLine label="→ MOTOR" />
        </div>

        {/* Protein Multiplier Slider */}
        <div>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs" style={{ fontFamily: MONO }}>
              Multiplicador de Proteína
            </span>
            <span style={{ fontFamily: MONO, color: "#39FF14", fontSize: 13, fontWeight: "bold" }}>
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
            className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-[#39FF14]"
            style={{
              background: `linear-gradient(90deg, #39FF14 ${((proteinMult - 1.2) / 2.3) * 100}%, #1E293B ${((proteinMult - 1.2) / 2.3) * 100}%)`,
            }}
          />
          <FeedLine label="→ MOTOR" />
        </div>

        {/* Fat Multiplier Slider */}
        <div>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs" style={{ fontFamily: MONO }}>
              Multiplicador de Grasa
            </span>
            <span style={{ fontFamily: MONO, color: "#F5A623", fontSize: 13, fontWeight: "bold" }}>
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
            className="w-full mt-2 h-1.5 appearance-none rounded-full cursor-pointer accent-[#F5A623]"
            style={{
              background: `linear-gradient(90deg, #F5A623 ${((fatMult - 0.4) / 1.6) * 100}%, #1E293B ${((fatMult - 0.4) / 1.6) * 100}%)`,
            }}
          />
          <FeedLine label="→ MOTOR" />
        </div>
      </div>
    </Panel>
  );
}
