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
  const eaColor = suppressed ? "#EF4444" : ea < 35 ? "#0284C7" : "#10B981";

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
      <div className="flex h-full flex-col gap-4 text-left">
        {/* Lipid hard clamp */}
        <div
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="uppercase text-xs tracking-[0.14em] font-mono font-bold text-slate-600">
              Cierre Graso de 0.6 g/kg
            </span>
            <span 
              className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border ${
                metrics.isHardClampActive 
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {metrics.isHardClampActive ? "CIERRE ACTIVO" : "PROTEGIDO"}
            </span>
          </div>
          <div className="mt-2.5 flex justify-between items-end gap-2">
            <div>
              <span style={{ ...mono }} className="font-mono text-2xl font-black text-slate-900 leading-none">{liveLipids}</span>
              <span className="font-mono text-xs text-slate-500 font-semibold ml-1.5">g lípidos / día</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs text-slate-500 font-semibold">mínimo: </span>
              <span className="font-mono text-sm font-bold text-sky-700">{lipidFloor}g</span>
            </div>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div 
              className="h-full rounded-full transition-all duration-300" 
              style={{ 
                width: `${Math.min(100, (liveLipids / Number(lipidFloor)) * 100)}%`, 
                background: "#10B981"
              }} 
            />
          </div>
          <p className="mt-2 text-xs font-mono leading-relaxed text-slate-500 font-medium">
            Sustrato de síntesis de testosterona asegurado · precursor de colesterol mantenido
          </p>
        </div>

        {/* EA trend graph */}
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="uppercase text-xs tracking-[0.14em] font-mono font-bold text-slate-600">
              Disponibilidad Energética (kcal/kg FFM/día)
            </span>
            <span 
              className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg border"
              style={{ 
                color: eaColor,
                backgroundColor: suppressed ? "#FEF2F2" : ea < 35 ? "#F0F9FF" : "#ECFDF5",
                borderColor: suppressed ? "#FECACA" : ea < 35 ? "#BAE6FD" : "#A7F3D0"
              }}
            >
              {ea.toFixed(1)} kcal
            </span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={buildTrend(ea)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={eaColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={eaColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <YAxis domain={[20, 45]} hide />
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#0F172A", fontWeight: 700 }}
                  labelStyle={{ color: "#64748B", fontWeight: 600 }}
                  itemStyle={{ color: eaColor }}
                />
                <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.8} />
                <Area type="monotone" dataKey="ea" stroke={eaColor} strokeWidth={2.5} fill="url(#eaFill)" dot={{ r: 3, fill: eaColor }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive EA control */}
          <div className="mt-3">
            <input
              type="range"
              min={20}
              max={45}
              step="0.5"
              value={ea}
              onChange={(e) => onEaChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
              style={{ accentColor: eaColor }}
            />
            <div className="mt-1.5 flex justify-between font-mono text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="text-rose-600">20 · REPRESIÓN</span>
              <span className="text-sky-600">30 · UMBRAL</span>
              <span className="text-emerald-600">45 · ÓPTIMO</span>
            </div>
          </div>
        </div>

        {/* Suppression alert */}
        {suppressed && (
          <div
            className="flex items-start gap-2.5 rounded-2xl p-3.5 bg-rose-50 border border-rose-200 text-rose-900 shadow-sm"
          >
            <AlertTriangle size={18} className="text-rose-600 mt-0.5 shrink-0" />
            <span className="font-mono text-xs leading-relaxed font-semibold flex items-center flex-wrap text-rose-800">
              REPRESIÓN DEL EJE HPG DETECTADA: Pulsos de LH/FSH Inhibidos debido a Baja Disponibilidad Energética Crónica (&lt;30 kcal/kg 
              <span className="mx-1 inline-flex items-center text-slate-900 font-bold">
                FFM
                <GlossaryTooltip term="FFM" />
              </span>
              /día)
              <span className="ml-1.5 inline-flex items-center text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-lg font-bold">
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
