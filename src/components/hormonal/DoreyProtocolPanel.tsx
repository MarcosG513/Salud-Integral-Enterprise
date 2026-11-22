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
  const color = pct >= 100 ? "#10B981" : "#0284C7";
  return (
    <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
      {/* SVG Progress Ring */}
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F1F5F9" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * Math.min(100, pct)) / 100}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>

      {/* Centered Content Overlay con ancho estricto menor al círculo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="max-w-[125px] w-full text-center px-2 flex flex-col items-center justify-center">
          <span
            className="text-3xl sm:text-4xl font-black font-mono tabular-nums"
            style={{ color, lineHeight: 1 }}
          >
            {Math.round(pct)}%
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider mt-1.5 leading-tight text-slate-800">
            FLUJO ENDOTELIAL
          </span>
          <span className="text-[9px] uppercase tracking-normal mt-1 leading-tight text-slate-500 font-semibold font-mono whitespace-normal">
            RESISTENCIA CIRCULATORIA
          </span>
        </div>
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
    <GlassCard title="Resistencia Eréctil · Protocolo Dorey" code="PELVIC//VASC-03" accent="#0284C7">
      <div className="flex h-full flex-col items-center gap-4 text-left">
        <ArcMeter pct={pct} />

        {/* Weekly Sessions Info */}
        <div className="flex items-center justify-between w-full text-xs font-mono text-slate-600 font-semibold">
          <span>CUMPLIMIENTO SEMANAL:</span>
          <div className="flex items-center gap-2">
            <span className="text-sky-700 font-bold px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200">
              {profile.doreySessionsPerWeek} / 4 sesiones
            </span>
            <button 
              onClick={handleResetWeeklyCount}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold"
            >
              (reiniciar)
            </button>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2.5">
          {Array.from({ length: SETS }).map((_, si) => {
            const setDone = Math.max(0, Math.min(REPS, done - si * REPS));
            const active = currentSet === si + 1 && done < TOTAL;
            return (
              <div
                key={`dorey-set-${si}`}
                className={`rounded-2xl p-3 border transition-all ${
                  active 
                    ? "border-sky-300 bg-sky-50/60 shadow-sm" 
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="uppercase text-[11px] font-mono tracking-wider font-bold text-slate-500 block mb-0.5">
                  SERIE {si + 1}
                </span>
                <div style={{ ...mono }} className="font-mono text-base font-black text-slate-900">
                  {setDone}/{REPS}
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(setDone / REPS) * 100}%`, 
                      background: setDone === REPS ? "#10B981" : "#0284C7" 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex w-full items-center justify-between rounded-2xl px-4 py-2.5 bg-slate-50 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Timer size={15} className="text-sky-600" />
            <span style={{ ...mono }} className="font-mono text-xs text-slate-600 font-semibold">10s sostener máx / contracción</span>
          </div>
          <span style={{ ...mono }} className="font-mono text-xs font-bold text-slate-500">{done}/{TOTAL} TOTAL</span>
        </div>

        <div className="flex w-full gap-2 mt-auto">
          <button
            onClick={handleLogContraction}
            disabled={profile.doreySessionsPerWeek >= 4 && done === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 px-4 transition-all disabled:opacity-40 bg-sky-600 hover:bg-sky-700 text-white font-mono text-xs font-bold shadow-sm"
          >
            <Zap size={15} /> REGISTRAR CONTRACCIÓN
          </button>
          <button
            onClick={handleResetSession}
            title="Reiniciar progreso de sesión actual"
            className="flex items-center justify-center rounded-2xl px-3.5 transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
