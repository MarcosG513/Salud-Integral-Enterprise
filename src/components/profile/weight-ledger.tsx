import { useState } from "react";
import { Scale, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { Panel } from "./panel-shell";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

function ema(values: number[], period: number) {
  if (!values || !values.length) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={pts} fill="none" stroke="#0284C7" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function WeightLedger() {
  const { profile, addWeightLog } = useClinicalEngine();
  const [draft, setDraft] = useState("");

  const weights = profile?.weightLogs || [];
  const smoothed = ema(weights, 20);
  const emaLast = smoothed[smoothed.length - 1] ?? 70;
  const emaPrev = smoothed[smoothed.length - 2] ?? emaLast;
  const trendDown = emaLast <= emaPrev;
  const delta = emaLast - emaPrev;

  const add = () => {
    const v = parseFloat(draft.replace(",", "."));
    if (!isNaN(v) && v > 0) {
      addWeightLog?.(Number(v.toFixed(1)));
      setDraft("");
    }
  };

  return (
    <Panel title="Registro de Bitácora de Peso" code="LEDGER//03" icon={<Scale size={16} />} className="h-full">
      <div className="flex h-full flex-col text-left">
        {/* Append input */}
        <div className="flex gap-2 shrink-0">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="KG REAL DE BÁSCULA"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none text-slate-900 placeholder:text-slate-400 focus:border-sky-500 font-mono text-xs font-semibold shadow-xs"
            style={{ fontFamily: MONO }}
          />
          <button
            onClick={add}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 font-mono text-xs font-bold transition-colors shadow-xs shrink-0"
            style={{ fontFamily: MONO }}
          >
            <Plus size={14} /> REGISTRAR
          </button>
        </div>

        {/* EMA-20 preview */}
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 shrink-0 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-bold" style={{ fontFamily: MONO }}>
              SUAVIZADO EMA-20
            </span>
            <span
              className={`flex items-center gap-1 font-mono text-xs font-bold ${
                trendDown ? "text-emerald-700" : "text-sky-700"
              }`}
              style={{ fontFamily: MONO }}
            >
              {trendDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)} kg
            </span>
          </div>
          <div className="mt-2">
            <Sparkline values={smoothed} />
          </div>
        </div>

        {/* Ledger list */}
        <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            {(profile?.weightLogs || []).map((w: number, i: number) => {
              const isLast = i === (profile?.weightLogs || []).length - 1;
              return (
                <div
                  key={`weight-log-${i}`}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2 transition-colors ${
                    isLast
                      ? "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-xs font-bold"
                      : "border-slate-100 bg-white hover:bg-slate-50 text-slate-900"
                  }`}
                >
                  <span className="text-slate-400 font-mono text-xs font-semibold" style={{ fontFamily: MONO }}>
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontFamily: MONO }} className="font-mono text-sm font-extrabold">
                    {w.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg</span>
                  </span>
                  <span className="text-slate-500 font-mono text-xs font-semibold" style={{ fontFamily: MONO }}>
                    EMA: {smoothed[i]?.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}
