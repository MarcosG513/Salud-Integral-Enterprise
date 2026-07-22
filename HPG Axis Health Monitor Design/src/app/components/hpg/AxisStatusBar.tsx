import { Activity, ShieldCheck, ShieldAlert } from "lucide-react";
import { COLORS, mono } from "./tokens";

interface AxisStatusBarProps {
  suppressed: boolean;
}

function Metric({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 px-4" style={{ borderLeft: `1px solid ${COLORS.border}` }}>
      <span className="uppercase" style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.14em" }}>
        {label}
      </span>
      <span style={{ ...mono, color, fontSize: 15 }}>
        {value}
        {unit && <span style={{ color: COLORS.textDim, fontSize: 10 }}> {unit}</span>}
      </span>
    </div>
  );
}

export function AxisStatusBar({ suppressed }: AxisStatusBarProps) {
  const statusColor = suppressed ? COLORS.crimson : COLORS.lime;
  const statusText = suppressed ? "CRITICAL SUPPRESSION RISK" : "FUNCTIONAL / DOMINANT";

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-5 py-3 backdrop-blur-xl"
      style={{
        background: "linear-gradient(90deg, rgba(15,19,34,0.95), rgba(7,10,19,0.85))",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity size={18} color={COLORS.cyan} />
          <div className="flex flex-col leading-tight">
            <span className="uppercase" style={{ color: "#E2E8F0", fontSize: 13, letterSpacing: "0.12em" }}>
              HPG Axis Homeostasis
            </span>
            <span style={{ ...mono, color: COLORS.textDim, fontSize: 9, letterSpacing: "0.1em" }}>
              HYPOTHALAMIC · PITUITARY · GONADAL TELEMETRY
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 rounded-md px-3 py-2"
          style={{
            background: suppressed ? "rgba(255,77,77,0.08)" : "rgba(57,255,20,0.06)",
            border: `1px solid ${statusColor}55`,
          }}
        >
          {suppressed ? (
            <ShieldAlert size={16} color={statusColor} className="animate-pulse" />
          ) : (
            <ShieldCheck size={16} color={statusColor} />
          )}
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 10 }}>AXIS STATUS:</span>
          <span
            style={{ ...mono, color: statusColor, fontSize: 12, letterSpacing: "0.06em" }}
            className={suppressed ? "animate-pulse" : ""}
          >
            {statusText}
          </span>
        </div>
      </div>

      <div className="flex items-stretch">
        <Metric label="LH Pulse" value="0.9" unit="IU/L" color={suppressed ? COLORS.crimson : COLORS.lime} />
        <Metric label="FSH" value="2.1" unit="IU/L" color={suppressed ? COLORS.crimson : COLORS.lime} />
        <Metric label="Total T" value="642" unit="ng/dL" color={COLORS.cyan} />
        <Metric label="SHBG" value="34" unit="nmol/L" color={COLORS.textMute} />
        <Metric label="Cortisol" value="14.2" unit="µg/dL" color={COLORS.cyan} />
      </div>
    </div>
  );
}
