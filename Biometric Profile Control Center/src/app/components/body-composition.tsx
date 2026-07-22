import { Activity } from "lucide-react";
import { Panel } from "./panel-shell";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

function DataRow({
  label,
  value,
  unit,
  accent,
  bar,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
  bar: number;
}) {
  return (
    <div
      className="rounded-md border px-3 py-2.5"
      style={{ borderColor: "#1E293B", background: "#070A13" }}
    >
      <div className="flex items-baseline justify-between">
        <span
          className="uppercase tracking-[0.16em] text-[#64748B]"
          style={{ fontFamily: MONO, fontSize: 10 }}
        >
          {label}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: accent }}>
          {value}
          <span className="ml-1 text-[#475569]" style={{ fontSize: 11, fontWeight: 400 }}>
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-2 h-1 w-full rounded-full" style={{ background: "#1E293B" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${bar}%`, background: accent, boxShadow: `0 0 8px ${accent}` }}
        />
      </div>
    </div>
  );
}

export function BodyComposition({
  bodyFat,
  setBodyFat,
  weight,
}: {
  bodyFat: number;
  setBodyFat: (v: number) => void;
  weight: number;
}) {
  const fatMass = (weight * bodyFat) / 100;
  const ffm = weight - fatMass;
  const ffmPct = (ffm / weight) * 100;

  return (
    <Panel title="Body Composition" code="ADIPOSE//02" icon={<Activity size={15} />} className="h-full">
      <div className="flex h-full flex-col">
        {/* Big readout */}
        <div className="mb-4 text-center">
          <span
            className="uppercase tracking-[0.24em] text-[#64748B]"
            style={{ fontFamily: MONO, fontSize: 10 }}
          >
            Body Fat Percentage
          </span>
          <div className="mt-1 flex items-end justify-center gap-1">
            <span style={{ fontFamily: MONO, fontSize: 56, fontWeight: 800, color: "#00F0FF", lineHeight: 1 }}>
              {bodyFat.toFixed(1)}
            </span>
            <span className="mb-2 text-[#475569]" style={{ fontFamily: MONO, fontSize: 20 }}>
              %
            </span>
          </div>
        </div>

        {/* High-precision slider */}
        <div className="mb-2">
          <input
            type="range"
            value={bodyFat}
            min={3}
            max={50}
            step={0.1}
            onChange={(e) => setBodyFat(Number(e.target.value))}
            className="w-full h-2 appearance-none rounded-full cursor-pointer accent-[#00F0FF]"
            style={{
              background: `linear-gradient(90deg, #00F0FF ${((bodyFat - 3) / 47) * 100}%, #1E293B ${((bodyFat - 3) / 47) * 100}%)`,
            }}
          />
          <div className="mt-1 flex justify-between text-[#334155]" style={{ fontFamily: MONO, fontSize: 9 }}>
            <span>3%</span>
            <span>ESSENTIAL</span>
            <span>ATHLETIC</span>
            <span>50%</span>
          </div>
        </div>

        {/* Composition split bar */}
        <div className="my-3 flex h-3 w-full overflow-hidden rounded-full border" style={{ borderColor: "#1E293B" }}>
          <div style={{ width: `${ffmPct}%`, background: "#39FF14", boxShadow: "0 0 10px #39FF14" }} />
          <div style={{ width: `${bodyFat}%`, background: "#00F0FF" }} />
        </div>

        {/* Data-table style readout */}
        <div className="mt-auto grid grid-cols-2 gap-3">
          <DataRow label="Lean Mass · FFM" value={ffm.toFixed(1)} unit="kg" accent="#39FF14" bar={ffmPct} />
          <DataRow label="Fat Mass · FM" value={fatMass.toFixed(1)} unit="kg" accent="#00F0FF" bar={bodyFat} />
        </div>
        <div
          className="mt-3 flex items-center justify-between rounded-md border px-3 py-2"
          style={{ borderColor: "#1E293B", background: "rgba(57,255,20,0.04)" }}
        >
          <span className="uppercase tracking-[0.16em] text-[#64748B]" style={{ fontFamily: MONO, fontSize: 10 }}>
            Scale Weight
          </span>
          <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: "#E2E8F0" }}>
            {weight.toFixed(1)} <span className="text-[#475569]" style={{ fontSize: 11 }}>kg</span>
          </span>
        </div>
      </div>
    </Panel>
  );
}
