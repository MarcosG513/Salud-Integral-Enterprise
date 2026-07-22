import { useState } from "react";
import { Timer, Zap, RotateCcw } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { COLORS, mono } from "./tokens";

const SETS = 3;
const REPS = 15;
const TOTAL = SETS * REPS;

function ArcMeter({ pct }: { pct: number }) {
  const size = 168;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 100 ? COLORS.lime : COLORS.cyan;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.border} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.4s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ ...mono, color, fontSize: 34, lineHeight: 1 }}>{Math.round(pct)}%</span>
        <span className="uppercase" style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.14em", marginTop: 4 }}>
          Endothelial Flow
        </span>
        <span className="uppercase" style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.14em" }}>
          Circulatory Stamina
        </span>
      </div>
    </div>
  );
}

export function DoreyProtocolPanel() {
  const [done, setDone] = useState(0);
  const pct = (done / TOTAL) * 100;
  const currentSet = Math.min(SETS, Math.floor(done / REPS) + (done % REPS === 0 && done > 0 ? 0 : 1)) || 1;

  return (
    <GlassCard title="Erectile Stamina · Dorey Protocol" code="PELVIC//VASC-03" accent={COLORS.cyan}>
      <div className="flex h-full flex-col items-center gap-4">
        <ArcMeter pct={pct} />

        <div className="grid w-full grid-cols-3 gap-2">
          {Array.from({ length: SETS }).map((_, si) => {
            const setDone = Math.max(0, Math.min(REPS, done - si * REPS));
            const active = currentSet === si + 1 && done < TOTAL;
            return (
              <div
                key={si}
                className="rounded-lg p-2"
                style={{
                  background: "rgba(7,10,19,0.6)",
                  border: `1px solid ${active ? COLORS.cyan : COLORS.border}`,
                  boxShadow: active ? `0 0 12px ${COLORS.cyan}33` : "none",
                }}
              >
                <span className="uppercase" style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.1em" }}>
                  SET {si + 1}
                </span>
                <div style={{ ...mono, color: setDone === REPS ? COLORS.lime : "#E2E8F0", fontSize: 15 }}>
                  {setDone}/{REPS}
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ background: COLORS.border }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(setDone / REPS) * 100}%`, background: setDone === REPS ? COLORS.lime : COLORS.cyan }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex w-full items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(7,10,19,0.6)", border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2">
            <Timer size={14} color={COLORS.cyan} />
            <span style={{ ...mono, color: COLORS.textMute, fontSize: 11 }}>10s max hold / contraction</span>
          </div>
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 10 }}>{done}/{TOTAL} TOTAL</span>
        </div>

        <div className="flex w-full gap-2">
          <button
            onClick={() => setDone((d) => Math.min(TOTAL, d + 1))}
            disabled={done >= TOTAL}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors disabled:opacity-40"
            style={{ background: `${COLORS.cyan}18`, border: `1px solid ${COLORS.cyan}`, color: COLORS.cyan, ...mono, fontSize: 12 }}
          >
            <Zap size={14} /> LOG CONTRACTION
          </button>
          <button
            onClick={() => setDone(0)}
            className="flex items-center justify-center rounded-lg px-3 transition-colors"
            style={{ background: "rgba(7,10,19,0.6)", border: `1px solid ${COLORS.border}`, color: COLORS.textMute }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
