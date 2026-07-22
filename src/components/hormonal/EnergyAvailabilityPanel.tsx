import { AlertTriangle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, ReferenceLine, YAxis, Tooltip } from "recharts";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { GlassCard } from "./GlassCard";
import { COLORS, mono } from "./tokens";
import { GlossaryTooltip } from "../../app/components/widgets/ClinicalGlossary";

interface EnergyAvailabilityPanelProps {
  ea: number;
  onEaChange: (v: number) => void;
}

// 7-day EA trend, last point tracks the live slider.
function buildTrend(current: number) {
  const base = [41, 38, 36, 33, 31, 29];
  return [...base, current].map((v, i) => ({ day: `D${i + 1}`, ea: v }));
}

export function EnergyAvailabilityPanel({ ea, onEaChange }: EnergyAvailabilityPanelProps) {
  const { profile, metrics } = useClinicalEngine();

  const suppressed = ea < 30;
  const liveLipids = metrics.macros.fat;
  const lipidFloor = (metrics.trendWeight * 0.6).toFixed(1); // 0.6 g/kg hard clamp floor
  const eaColor = suppressed ? COLORS.crimson : ea < 35 ? COLORS.cyan : COLORS.lime;

  return (
    <GlassCard 
      title={
        <span className="flex items-center">
          Disponibilidad Energética
          <GlossaryTooltip term="EA" />
          <span className="mx-1">·</span>
          Piso Androgénico
        </span>
      } 
      code="EA//ANDRO-01" 
      accent={eaColor}
    >
      <div className="flex h-full flex-col gap-4">
        {/* Lipid hard clamp */}
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(7,10,19,0.6)", border: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center justify-between">
            <span className="uppercase text-xs tracking-[0.14em]" style={{ color: COLORS.textDim }}>
              Cierre Graso de 0.6 g/kg
            </span>
            <span style={{ ...mono, color: COLORS.lime, fontSize: 11 }}>
              {metrics.isHardClampActive ? "CIERRE ACTIVO" : "PROTEGIDO"}
            </span>
          </div>
          <div className="mt-2 flex justify-between items-end gap-2">
            <div>
              <span style={{ ...mono, color: "#E2E8F0", fontSize: 26, lineHeight: 1 }}>{liveLipids}</span>
              <span style={{ ...mono, color: COLORS.textDim, fontSize: 11, marginLeft: 2 }}>g lípidos / día</span>
            </div>
            <div className="text-right">
              <span style={{ ...mono, color: COLORS.textDim, fontSize: 10 }}>mínimo: </span>
              <span style={{ ...mono, color: COLORS.cyan, fontSize: 13, fontWeight: "bold" }}>{lipidFloor}g</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: COLORS.border }}>
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${Math.min(100, (liveLipids / Number(lipidFloor)) * 100)}%`, 
                background: COLORS.lime, 
                boxShadow: `0 0 10px ${COLORS.lime}` 
              }} 
            />
          </div>
          <p className="mt-1 text-xs font-mono leading-normal" style={{ color: COLORS.textDim }}>
            Sustrato de síntesis de testosterona asegurado · precursor de colesterol mantenido
          </p>
        </div>

        {/* EA trend graph */}
        <div className="flex flex-col">
          <div className="mb-1 flex items-center justify-between">
            <span className="uppercase text-xs tracking-[0.14em]" style={{ color: COLORS.textDim }}>
              Disponibilidad Energética (kcal/kg FFM/día)
            </span>
            <span style={{ ...mono, color: eaColor, fontSize: 13, fontWeight: "bold" }}>{ea.toFixed(1)} kcal</span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={buildTrend(ea)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={eaColor} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={eaColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={[20, 45]} hide />
                <Tooltip
                  contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                  labelStyle={{ color: COLORS.textMute }}
                  itemStyle={{ color: eaColor }}
                />
                <ReferenceLine y={30} stroke={COLORS.crimson} strokeDasharray="4 4" strokeOpacity={0.7} />
                <Area type="monotone" dataKey="ea" stroke={eaColor} strokeWidth={2} fill="url(#eaFill)" dot={{ r: 2, fill: eaColor }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive EA control */}
          <div className="mt-3">
            <input
              type="range"
              min={20}
              max={45}
              value={ea}
              onChange={(e) => onEaChange(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full"
              style={{ accentColor: eaColor, background: COLORS.border }}
            />
            <div className="mt-1 flex justify-between" style={{ ...mono, color: COLORS.textDim, fontSize: 9 }}>
              <span style={{ color: COLORS.crimson }}>20 · REPRESIÓN</span>
              <span style={{ color: COLORS.cyan }}>30 · UMBRAL</span>
              <span style={{ color: COLORS.lime }}>45 · ÓPTIMO</span>
            </div>
          </div>
        </div>

        {/* Suppression alert */}
        {suppressed && (
          <div
            className="flex items-start gap-2 rounded-lg p-3"
            style={{ background: "rgba(255,77,77,0.1)", border: `1px solid ${COLORS.crimson}`, animation: "hpgFlash 1.1s ease-in-out infinite" }}
          >
            <AlertTriangle size={16} color={COLORS.crimson} className="mt-0.5 shrink-0" />
            <span style={{ ...mono, color: COLORS.crimson, fontSize: 10, lineHeight: 1.5 }} className="flex items-center flex-wrap">
              REPRESIÓN DEL EJE HPG DETECTADA: Pulsos de LH/FSH Inhibidos debido a Baja Disponibilidad Energética Crónica (&lt;30 kcal/kg 
              <span className="mx-1 flex items-center">
                FFM
                <GlossaryTooltip term="FFM" />
              </span>
              /día)
              <span className="ml-1.5 flex items-center text-white bg-red-900/60 px-1 rounded">
                RED-S
                <GlossaryTooltip term="RED-S" />
              </span>
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
