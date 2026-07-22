import { Ruler, Calendar, Venus, Mars } from "lucide-react";
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
        className="w-full bg-transparent px-3 py-2.5 outline-none text-[#E2E8F0]"
        style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600 }}
      />
      <span
        className="flex items-center px-3 text-[#475569] border-l"
        style={{ borderColor: "#1E293B", fontFamily: MONO, fontSize: 11 }}
      >
        {unit}
      </span>
      <div className="flex flex-col border-l" style={{ borderColor: "#1E293B" }}>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex-1 px-2.5 text-[#64748B] hover:text-[#00F0FF] hover:bg-[#00F0FF]/5"
          style={{ fontFamily: MONO, fontSize: 11 }}
        >
          ▲
        </button>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex-1 px-2.5 text-[#64748B] hover:text-[#00F0FF] hover:bg-[#00F0FF]/5 border-t"
          style={{ borderColor: "#1E293B", fontFamily: MONO, fontSize: 11 }}
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

export function DimensionsMatrix({
  height,
  setHeight,
  age,
  setAge,
  sex,
  setSex,
}: {
  height: number;
  setHeight: (v: number) => void;
  age: number;
  setAge: (v: number) => void;
  sex: "M" | "F";
  setSex: (v: "M" | "F") => void;
}) {
  return (
    <Panel title="Physical Dimensions" code="MTX//01" icon={<Ruler size={15} />}>
      <div className="flex flex-col gap-5">
        <div>
          <Field label="Height">
            <NumberStepper value={height} onChange={setHeight} min={120} max={220} step={1} unit="cm" />
          </Field>
          <MicroSlider value={height} onChange={setHeight} min={120} max={220} step={1} />
          <FeedLine label="→ ENGINE" />
        </div>

        <div>
          <Field label="Age">
            <NumberStepper value={age} onChange={setAge} min={12} max={99} step={1} unit="yrs" />
          </Field>
          <MicroSlider value={age} onChange={setAge} min={12} max={99} step={1} />
          <FeedLine label="→ ENGINE" />
        </div>

        <div>
          <span
            className="block mb-1.5 uppercase tracking-[0.16em] text-[#64748B]"
            style={{ fontFamily: MONO, fontSize: 10 }}
          >
            Biological Sex
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
                key={s}
                onClick={() => setSex(s)}
                className="relative z-10 flex items-center justify-center gap-2 py-2 transition-colors"
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 600,
                  color: sex === s ? "#00F0FF" : "#64748B",
                }}
              >
                {s === "M" ? <Mars size={14} /> : <Venus size={14} />}
                {s === "M" ? "MALE" : "FEMALE"}
              </button>
            ))}
          </div>
          <FeedLine label="→ ENGINE" />
        </div>
      </div>
    </Panel>
  );
}
