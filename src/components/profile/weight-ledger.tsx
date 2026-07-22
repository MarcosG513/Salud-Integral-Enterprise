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
      <polyline points={pts} fill="none" stroke="#00F0FF" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
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
    <Panel title="Registro de Bitácora de Peso" code="LEDGER//03" icon={<Scale size={15} />} className="h-full">
      <div className="flex h-full flex-col text-left">
        {/* Append input */}
        <div className="flex gap-2 shrink-0">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="KG REAL DE BÁSCULA"
            className="w-full rounded-md border bg-[#070A13] px-3 py-2 outline-none text-[#E2E8F0] placeholder:text-[#334155] focus:border-[#00F0FF] font-mono text-[13px]"
            style={{ borderColor: "#1E293B" }}
          />
          <button
            onClick={add}
            className="flex items-center gap-1.5 rounded-md border px-3 transition-colors hover:bg-[#00F0FF]/10 font-mono text-[12px] font-bold"
            style={{ borderColor: "rgba(0,240,255,0.4)", color: "#00F0FF" }}
          >
            <Plus size={14} /> REGISTRAR
          </button>
        </div>

        {/* EMA-20 preview */}
        <div className="mt-3 rounded-md border p-3 shrink-0" style={{ borderColor: "#1E293B", background: "#070A13" }}>
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs" style={{ fontFamily: MONO }}>
              SUAVIZADO EMA-20
            </span>
            <span
              className="flex items-center gap-1 font-mono text-[11px] font-bold"
              style={{ color: trendDown ? "#39FF14" : "#00F0FF" }}
            >
              {trendDown ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
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
          <div className="flex flex-col gap-1">
            {(profile?.weightLogs || []).map((w: number, i: number) => {
              const isLast = i === (profile?.weightLogs || []).length - 1;
              return (
                <div
                  key={`weight-log-${i}`}
                  className="flex items-center justify-between rounded border px-3 py-1.5"
                  style={{
                    borderColor: isLast ? "rgba(57,255,20,0.4)" : "#1E293B",
                    background: isLast ? "rgba(57,255,20,0.05)" : "transparent",
                  }}
                >
                  <span className="text-[#475569] font-mono text-xs" style={{ fontFamily: MONO }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: "#E2E8F0" }} className="font-mono">
                    {w.toFixed(1)}
                  </span>
                  <span className="text-[#334155] font-mono text-xs" style={{ fontFamily: MONO }}>
                    {smoothed[i]?.toFixed(2)}
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
