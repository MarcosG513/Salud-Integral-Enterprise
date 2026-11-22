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
      className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 shadow-xs"
    >
      <div className="flex items-baseline justify-between">
        <span
          className="uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-semibold"
          style={{ fontFamily: MONO }}
        >
          {label}
        </span>
        <span style={{ fontFamily: MONO }} className="font-mono text-lg font-extrabold text-slate-900">
          {value}
          <span className="ml-1 text-slate-500 font-normal text-xs" style={{ fontFamily: MONO }}>
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${bar}%`, background: accent }}
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
    <Panel title="Composición Corporal" code="ADIPOSE//02" icon={<Activity size={16} />} className="h-full">
      <div className="flex h-full flex-col text-left">
        {/* Big readout */}
        <div className="mb-4 text-center">
          <span
            className="uppercase tracking-[0.24em] text-slate-500 font-mono text-xs font-semibold"
            style={{ fontFamily: MONO }}
          >
            Porcentaje de Grasa Corporal
          </span>
          <div className="mt-1 flex items-end justify-center gap-1">
            <span style={{ fontFamily: MONO }} className="font-mono text-5xl sm:text-6xl font-black text-sky-600 leading-none">
              {bodyFat.toFixed(1)}
            </span>
            <span className="mb-1 text-slate-400 font-mono text-xl font-bold" style={{ fontFamily: MONO }}>
              %
            </span>
          </div>
        </div>

        {/* High-precision slider */}
        <div className="mb-3">
          <input
            type="range"
            value={bodyFat}
            min={3}
            max={50}
            step={0.1}
            onChange={(e) => setBodyFat(Number(e.target.value))}
            className="w-full h-2 appearance-none rounded-full cursor-pointer accent-sky-600"
            style={{
              background: `linear-gradient(90deg, #0284C7 ${((bodyFat - 3) / 47) * 100}%, #E2E8F0 ${((bodyFat - 3) / 47) * 100}%)`,
            }}
          />
          <div className="mt-1.5 flex justify-between text-slate-500 font-mono text-xs font-semibold" style={{ fontFamily: MONO }}>
            <span>3%</span>
            <span>ESENCIAL</span>
            <span>ATLÉTICO</span>
            <span>50%</span>
          </div>
        </div>

        {/* Composition split bar */}
        <div className="my-3 flex h-3 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner">
          <div style={{ width: `${ffmPct}%` }} className="bg-emerald-500 transition-all duration-300" />
          <div style={{ width: `${bodyFat}%` }} className="bg-sky-500 transition-all duration-300" />
        </div>

        {/* Data-table style readout */}
        <div className="mt-auto grid grid-cols-2 gap-3">
          <DataRow label="Masa Magra · FFM" value={ffm.toFixed(1)} unit="kg" accent="#10B981" bar={ffmPct} />
          <DataRow label="Masa Grasa · FM" value={fatMass.toFixed(1)} unit="kg" accent="#0284C7" bar={bodyFat} />
        </div>
        <div
          className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 shadow-xs"
        >
          <span className="uppercase tracking-[0.16em] text-slate-700 font-mono text-xs font-bold" style={{ fontFamily: MONO }}>
            Peso de Báscula (Tendencia EMA)
          </span>
          <span style={{ fontFamily: MONO }} className="font-mono text-base font-black text-emerald-700">
            {weight.toFixed(1)} <span className="text-emerald-600/70 text-xs font-semibold">kg</span>
          </span>
        </div>
      </div>
    </Panel>
  );
}
