import { useState } from "react";
import { Timer, Zap, RotateCcw } from "lucide-react";
import { useClinicalEngine } from "../../context/clinical-engine-context";
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
    <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
      {/* SVG Progress Ring — fills container, rotated to start from 12 o'clock */}
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
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
          style={{ transition: "stroke-dashoffset 0.5s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>

      {/* Perfectly Centered Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
        <span
          className="text-3xl sm:text-4xl font-bold font-mono tabular-nums"
          style={{ color, lineHeight: 1 }}
        >
          {Math.round(pct)}%
        </span>
        <span
          className="text-xs font-semibold uppercase tracking-wider mt-1 leading-tight"
          style={{ color: COLORS.textDim }}
        >
          FLUJO ENDOTELIAL
        </span>
        <span
          className="text-xs uppercase tracking-wider mt-0.5 leading-tight"
          style={{ color: COLORS.textMute }}
        >
          RESISTENCIA CIRCULATORIA
        </span>
      </div>
    </div>
  );
}

export function DoreyProtocolPanel() {
  const { profile, metrics, updateProfileVariable } = useClinicalEngine();
  const [done, setDone] = useState(0);

  const pct = metrics.doreyPercentage; // bound to weekly compliance %
  const currentSet = Math.min(SETS, Math.floor(done / REPS) + (done % REPS === 0 && done > 0 ? 0 : 1)) || 1;

  const handleLogContraction = () => {
    const nextDone = done + 1;
    if (nextDone >= TOTAL) {
      setDone(0);
      updateProfileVariable("doreySessionsPerWeek", Math.min(4, profile.doreySessionsPerWeek + 1));
    } else {
      setDone(nextDone);
    }
  };

  const handleResetSession = () => {
    setDone(0);
  };

  const handleResetWeeklyCount = () => {
    updateProfileVariable("doreySessionsPerWeek", 0);
  };

  return (
    <GlassCard title="Resistencia Eréctil · Protocolo Dorey" code="PELVIC//VASC-03" accent={COLORS.cyan}>
      <div className="flex h-full flex-col items-center gap-4">
        <ArcMeter pct={pct} />

        {/* Weekly Sessions Info */}
        <div className="flex items-center justify-between w-full text-xs font-mono text-slate-400">
          <span>CUMPLIMIENTO SEMANAL:</span>
          <div className="flex items-center gap-2">
            <span className="text-[#00F0FF] font-bold">{profile.doreySessionsPerWeek} / 4 sesiones</span>
            <button 
              onClick={handleResetWeeklyCount}
              className="text-xs text-[#FF4D4D] hover:underline"
            >
              (reiniciar)
            </button>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          {Array.from({ length: SETS }).map((_, si) => {
            const setDone = Math.max(0, Math.min(REPS, done - si * REPS));
            const active = currentSet === si + 1 && done < TOTAL;
            return (
              <div
                key={`dorey-set-${si}`}
                className="rounded-lg p-2"
                style={{
                  background: "rgba(7,10,19,0.6)",
                  border: `1px solid ${active ? COLORS.cyan : COLORS.border}`,
                  boxShadow: active ? `0 0 12px ${COLORS.cyan}33` : "none",
                }}
              >
                <span className="uppercase text-xs tracking-[0.1em]" style={{ color: COLORS.textDim }}>
                  SERIE {si + 1}
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
            <span style={{ ...mono, color: COLORS.textMute, fontSize: 11 }}>10s sostener máx / contracción</span>
          </div>
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 10 }}>{done}/{TOTAL} TOTAL</span>
        </div>

        <div className="flex w-full gap-2">
          <button
            onClick={handleLogContraction}
            disabled={profile.doreySessionsPerWeek >= 4 && done === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors disabled:opacity-40"
            style={{ background: `${COLORS.cyan}18`, border: `1px solid ${COLORS.cyan}`, color: COLORS.cyan, ...mono, fontSize: 12 }}
          >
            <Zap size={14} /> REGISTRAR CONTRACCIÓN
          </button>
          <button
            onClick={handleResetSession}
            title="Reiniciar progreso de sesión actual"
            className="flex items-center justify-center rounded-lg px-3 transition-colors hover:bg-white/[0.05]"
            style={{ background: "rgba(7,10,19,0.6)", border: `1px solid ${COLORS.border}`, color: COLORS.textMute }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
