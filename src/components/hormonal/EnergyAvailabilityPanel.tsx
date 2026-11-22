import { AlertTriangle, ShieldCheck } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  ReferenceLine,
  YAxis,
  Tooltip,
} from "recharts";
import { useClinicalEngine } from "../../context/clinical-engine-context";
import { GlassCard } from "./GlassCard";
import { mono } from "./tokens";
import { GlossaryTooltip } from "../../app/components/widgets/ClinicalGlossary";

interface EnergyAvailabilityPanelProps {
  ea?: number;
}

function buildTrend(current: number) {
  const base = [38, 36, 35, 34, 33, 32];
  return [...base, current].map((v, i) => ({ day: `D${i + 1}`, ea: v }));
}

export function EnergyAvailabilityPanel({ ea: propEa }: EnergyAvailabilityPanelProps) {
  const { profile, metrics } = useClinicalEngine();

  const ea = propEa ?? metrics.energyAvailability;
  const shield = metrics.endocrineShield;
  const eaThreshold = shield?.eaThreshold ?? (profile.sexoBiologico === "female" ? 30 : 25);
  const suppressed = Boolean(metrics.isREDSTriggered);
  const liveLipids = metrics.totalMacros?.fat ?? metrics.macros.fat;
  const lipidFloor = shield?.fatFloorGrams ?? Number((metrics.trendWeight * 0.6).toFixed(1));
  const carbFloor = shield?.carbFloorGrams ?? Math.round(metrics.trendWeight * 2);
  const eaColor = suppressed ? "#F43F5E" : ea < eaThreshold + 5 ? "#0284C7" : "#10B981";

  return (
    <GlassCard
      title={
        <span className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="min-w-0">Disponibilidad Energética</span>
          <span className="shrink-0 -my-1.5">
            <GlossaryTooltip term="EA" />
          </span>
          <span className="text-slate-400">·</span>
          <span className="min-w-0">Diagnóstico Solo Lectura</span>
        </span>
      }
      code="EA//IOC-2023"
      accent={eaColor}
    >
      <div className="flex h-full flex-col gap-4 text-left">
        {/* Pisos Protegidos Simultáneos (Lípidos + Carbohidratos) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="uppercase text-xs tracking-[0.12em] font-mono font-bold text-slate-600">
              Escudo Endocrino Simultáneo
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border ${
                metrics.isHardClampActive || suppressed
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {suppressed ? "COMPENSANDO" : "PROTEGIDO"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-white border border-slate-200/80 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Piso Lípidos (0.6 g/kg)
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span style={{ ...mono }} className="font-mono text-lg font-black text-slate-900">
                  {liveLipids}g
                </span>
                <span className="font-mono text-[11px] text-sky-700 font-semibold">
                  (mín {lipidFloor}g)
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200/80 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Piso Glúcidos Seguro
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span style={{ ...mono }} className="font-mono text-lg font-black text-slate-900">
                  {metrics.totalMacros?.carbs ?? metrics.macros.carbs}g
                </span>
                <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                  (mín {carbFloor}g)
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs font-mono leading-relaxed text-slate-600 font-medium">
            {shield?.advisoryMessage ||
              "Sustrato lipídico y glucídico protegido automáticamente (nunca comprimido a 0g)."}
          </p>
        </div>

        {/* Gráfica EA Solo Lectura */}
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="uppercase text-xs tracking-[0.12em] font-mono font-bold text-slate-600">
              EA Actual (Umbral {eaThreshold} kcal/kg FFM)
            </span>
            <span
              className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg border whitespace-nowrap"
              style={{
                color: eaColor,
                backgroundColor: suppressed
                  ? "#FFF1F2"
                  : ea < eaThreshold + 5
                  ? "#F0F9FF"
                  : "#ECFDF5",
                borderColor: suppressed
                  ? "#FECDD3"
                  : ea < eaThreshold + 5
                  ? "#BAE6FD"
                  : "#A7F3D0",
              }}
            >
              {ea.toFixed(1)} kcal
            </span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={buildTrend(ea)}
                margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
              >
                <defs key="ea-defs">
                  <linearGradient id="eaFill" x1="0" y1="0" x2="0" y2="1" key="ea-grad">
                    <stop offset="0%" stopColor={eaColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={eaColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <YAxis key="ea-yaxis" domain={[15, 50]} hide />
                <Tooltip
                  key="ea-tooltip"
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: "#0F172A",
                    fontWeight: 700,
                  }}
                  labelStyle={{ color: "#64748B", fontWeight: 600 }}
                  itemStyle={{ color: eaColor }}
                />
                <ReferenceLine
                  key="ea-refline"
                  y={eaThreshold}
                  stroke="#F43F5E"
                  strokeDasharray="4 4"
                  strokeOpacity={0.85}
                />
                <Area
                  key="ea-area"
                  type="monotone"
                  dataKey="ea"
                  stroke={eaColor}
                  strokeWidth={2.5}
                  fill="url(#eaFill)"
                  dot={{ r: 3, fill: eaColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado IOC 2023 */}
        {suppressed ? (
          <div className="flex items-start gap-2.5 rounded-2xl p-3.5 bg-rose-50 border border-rose-200 text-rose-900 shadow-xs mt-auto">
            <AlertTriangle size={18} className="text-rose-600 mt-0.5 shrink-0" />
            <span className="font-mono text-xs leading-relaxed font-semibold flex items-center flex-wrap gap-1.5 text-rose-800 min-w-0">
              ESCUDO IOC 2023 ACTIVO: Baja disponibilidad sostenida (&lt;{eaThreshold} kcal/kg{" "}
              <span className="inline-flex items-center gap-1 min-w-0 text-slate-900 font-bold">
                <span className="min-w-0">FFM</span>
                <span className="shrink-0 -my-1.5">
                  <GlossaryTooltip term="FFM" />
                </span>
              </span>
              /día). Compensado automáticamente con +calorías o reducción de volumen.
              <span className="inline-flex items-center gap-1 min-w-0 text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-lg font-bold">
                <span className="min-w-0">RED-S</span>
                <span className="shrink-0 -my-1.5">
                  <GlossaryTooltip term="RED-S" />
                </span>
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl p-3 bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs font-medium mt-auto">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>
              Disponibilidad energética estable (&ge;{eaThreshold} kcal/kg FFM/día) calculada autónomamente en segundo plano.
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default EnergyAvailabilityPanel;
