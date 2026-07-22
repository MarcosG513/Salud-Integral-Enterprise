import { ReactNode } from "react";

/* ── Shared design tokens for the Clinical Ergogenic Dispensary ── */
export const COLORS = {
  space: "#070A13",
  fill: "#0F1322",
  border: "#1E293B",
  lime: "#39FF14", // Class A Evidence
  cyan: "#00F0FF", // Class B / Active cycles
  coral: "#FF4D4D", // Timing disruption
};

export const mono = { fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" };

/* High-density glassmorphism card */
export function GlassCard({
  children,
  className = "",
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden backdrop-blur-xl ${className}`}
      style={{
        background:
          "linear-gradient(160deg, rgba(15,19,34,0.92) 0%, rgba(9,12,22,0.94) 100%)",
        border: `1px solid ${COLORS.border}`,
        boxShadow: glow
          ? `0 0 0 1px rgba(30,41,59,0.4), 0 0 24px -6px ${glow}`
          : "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {children}
    </div>
  );
}

/* Section header with a tick label */
export function PanelHeader({
  index,
  title,
  accent,
  right,
}: {
  index: string;
  title: string;
  accent: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={{ borderBottom: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
          style={{
            ...mono,
            color: accent,
            border: `1px solid ${accent}44`,
            background: `${accent}12`,
          }}
        >
          {index}
        </span>
        <span
          className="uppercase tracking-[0.18em] text-[11px] text-slate-200"
          style={{ fontWeight: 600 }}
        >
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

/* Thin telemetry meter */
export function Meter({
  value,
  accent,
  height = 6,
}: {
  value: number;
  accent: string;
  height?: number;
}) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: "#0A0E1A", border: `1px solid ${COLORS.border}` }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${accent}55, ${accent})`,
          boxShadow: `0 0 10px ${accent}99`,
        }}
      />
    </div>
  );
}

export function StatusDot({ accent }: { accent: string }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: 7,
        height: 7,
        background: accent,
        boxShadow: `0 0 8px ${accent}`,
      }}
    />
  );
}
