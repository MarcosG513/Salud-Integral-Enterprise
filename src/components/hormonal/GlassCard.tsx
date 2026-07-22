import { ReactNode } from "react";
import { COLORS, mono } from "./tokens";

interface GlassCardProps {
  title: string;
  code?: string;
  accent?: string;
  children: ReactNode;
  className?: string;
}

export function GlassCard({ title, code, accent = COLORS.textMute, children, className = "" }: GlassCardProps) {
  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-xl backdrop-blur-xl ${className}`}
      style={{
        background: "linear-gradient(160deg, rgba(15,19,34,0.92), rgba(7,10,19,0.85))",
        border: `1px solid ${COLORS.border}`,
        boxShadow: "0 20px 60px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <header
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-[3px] rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <h2 className="uppercase tracking-[0.16em]" style={{ color: "#E2E8F0", fontSize: 12 }}>
            {title}
          </h2>
        </div>
        {code && (
          <span style={{ ...mono, color: COLORS.textDim, fontSize: 10, letterSpacing: "0.1em" }}>{code}</span>
        )}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}
