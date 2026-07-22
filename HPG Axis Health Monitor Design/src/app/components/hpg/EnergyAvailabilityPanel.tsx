import { AlertTriangle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, ReferenceLine, YAxis, Tooltip } from "recharts";
import { GlassCard } from "./GlassCard";
import { COLORS, mono } from "./tokens";

interface EnergyAvailabilityPanelProps {
  ea: number;
  onEaChange: (v: number) => void;
}

const bodyMass = 82; // kg
const ffm = 68; // kg fat-free mass

// 7-day EA trend, last point tracks the live slider.
function buildTrend(current: number) {
  const base = [41, 38, 36, 33, 31, 29];
  return [...base, current].map((v, i) => ({ day: `D${i + 1}`, ea: v }));
}

export function EnergyAvailabilityPanel({ ea, onEaChange }: EnergyAvailabilityPanelProps) {
  const suppressed = ea < 30;
  const lipidFloor = (0.6 * bodyMass).toFixed(1); // 0.6 g/kg hard clamp
  const eaColor = suppressed ? COLORS.crimson : ea < 35 ? COLORS.cyan : COLORS.lime;

  return (
    <GlassCard title="Energy Availability · Androgenic Floor" code="EA//ANDRO-01" accent={eaColor}>
      <div className="flex h-full flex-col gap-4">
        {/* Lipid hard clamp */}
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(7,10,19,0.6)", border: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center justify-between">
            <span className="uppercase" style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.14em" }}>
              0.6 g/kg Lipid Hard Clamp
            </span>
            <span style={{ ...mono, color: COLORS.lime, fontSize: 11 }}>PROTECTED</span>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span style={{ ...mono, color: "#E2E8F0", fontSize: 26, lineHeight: 1 }}>{lipidFloor}</span>
            <span style={{ ...mono, color: COLORS.textDim, fontSize: 11, marginBottom: 3 }}>g lipids / day floor</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: COLORS.border }}>
            <div className="h-full rounded-full" style={{ width: "100%", background: COLORS.lime, boxShadow: `0 0 10px ${COLORS.lime}` }} />
          </div>
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 9 }}>
            Testosterone synthesis substrate secured · cholesterol precursor maintained
          </span>
        </div>

        {/* EA trend graph */}
        <div className="flex flex-1 flex-col">
          <div className="mb-1 flex items-center justify-between">
            <span className="uppercase" style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.14em" }}>
              Energy Availability (kcal/kg FFM/day)
            </span>
            <span style={{ ...mono, color: eaColor, fontSize: 13 }}>{ea} kcal</span>
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
              <span style={{ color: COLORS.crimson }}>20 · REPRESSION</span>
              <span style={{ color: COLORS.cyan }}>30 · THRESHOLD</span>
              <span style={{ color: COLORS.lime }}>45 · OPTIMAL</span>
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
            <span style={{ ...mono, color: COLORS.crimson, fontSize: 10, lineHeight: 1.5 }}>
              HPG AXIS REPRESSION DETECTED: LH/FSH Pulses Inhibited due to Chronic Low Energy Availability
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
