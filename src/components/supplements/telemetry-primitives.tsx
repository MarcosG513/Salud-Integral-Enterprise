import { ReactNode } from "react";

/* ── Shared design tokens for the Clinical Ergogenic Dispensary (Clean Bento) ── */
export const COLORS = {
  space: "#F8FAFC",
  fill: "#FFFFFF",
  border: "#E2E8F0",
  lime: "#10B981", // Class A Evidence (Emerald)
  cyan: "#0284C7", // Class B / Active cycles (Sky-600)
  coral: "#EF4444", // Timing disruption (Rose-500)
  textDim: "#64748B",
  textMute: "#475569",
};

export const mono = { fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" };

/* High-density Bento card */
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
      className={`relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 text-slate-900 ${className}`}
      style={glow ? { boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 0 16px -4px ${glow}` } : undefined}
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
      className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="text-xs px-2 py-0.5 rounded-lg font-mono font-bold"
          style={{
            ...mono,
            color: accent,
            border: `1px solid ${accent}33`,
            background: `${accent}15`,
          }}
        >
          {index}
        </span>
        <span
          className="uppercase tracking-[0.18em] text-xs text-slate-900 font-bold"
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
  height = 8,
}: {
  value: number;
  accent: string;
  height?: number;
}) {
  return (
    <div
      className="w-full rounded-full overflow-hidden bg-slate-100 border border-slate-200"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: accent,
        }}
      />
    </div>
  );
}

export function StatusDot({ accent }: { accent: string }) {
  return (
    <span
      className="inline-block rounded-full size-2.5 shrink-0"
      style={{
        background: accent,
      }}
    />
  );
}
