import { Activity } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
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
          className="uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs"
          style={{ fontFamily: MONO }}
        >
          {label}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: accent }} className="font-mono">
          {value}
          <span className="ml-1 text-[#475569] font-normal" style={{ fontSize: 11 }}>
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

export function BodyComposition() {
  const { profile, metrics, updateProfileVariable } = useClinicalEngine();

  const bodyFat = profile?.bodyFat ?? 15;
  const setBodyFat = (val: number) => updateProfileVariable?.("bodyFat", val);

  // Safe fallback weight rules
  const currentWeight = profile?.weightLogs?.[profile?.weightLogs?.length - 1] ?? profile?.peso ?? 70;
  const weight = metrics?.trendWeight ?? currentWeight;
  const ffm = metrics?.ffm ?? Number((weight * (1 - bodyFat / 100)).toFixed(2));
  const fatMass = Math.max(0, weight - ffm);
  const ffmPct = weight > 0 ? (ffm / weight) * 100 : 0;

  return (
    <Panel title="Composición Corporal" code="ADIPOSE//02" icon={<Activity size={15} />} className="h-full">
      <div className="flex h-full flex-col text-left">
        {/* Big readout */}
        <div className="mb-4 text-center">
          <span
            className="uppercase tracking-[0.24em] text-[#64748B] font-mono text-xs"
            style={{ fontFamily: MONO }}
          >
            Porcentaje de Grasa Corporal
          </span>
          <div className="mt-1 flex items-end justify-center gap-1">
            <span style={{ fontFamily: MONO, fontSize: 56, fontWeight: 800, color: "#00F0FF", lineHeight: 1 }} className="font-mono">
              {bodyFat.toFixed(1)}
            </span>
            <span className="mb-2 text-[#475569] font-mono text-[20px]" style={{ fontFamily: MONO }}>
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
          <div className="mt-1 flex justify-between text-[#334155] font-mono text-xs" style={{ fontFamily: MONO }}>
            <span>3%</span>
            <span>ESENCIAL</span>
            <span>ATLÉTICO</span>
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
          <DataRow label="Masa Magra · FFM" value={ffm.toFixed(1)} unit="kg" accent="#39FF14" bar={ffmPct} />
          <DataRow label="Masa Grasa · FM" value={fatMass.toFixed(1)} unit="kg" accent="#00F0FF" bar={bodyFat} />
        </div>
        <div
          className="mt-3 flex items-center justify-between rounded-md border px-3 py-2"
          style={{ borderColor: "#1E293B", background: "rgba(57,255,20,0.04)" }}
        >
          <span className="uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs" style={{ fontFamily: MONO }}>
            Peso de Báscula (Tendencia EMA)
          </span>
          <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: "#E2E8F0" }} className="font-mono">
            {weight.toFixed(1)} <span className="text-[#475569] text-xs">kg</span>
          </span>
        </div>
      </div>
    </Panel>
  );
}
