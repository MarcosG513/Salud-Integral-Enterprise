import { ReactNode } from "react";
import { COLORS, mono } from "./tokens";

interface GlassCardProps {
  title: ReactNode;
  code?: string;
  accent?: string;
  children: ReactNode;
  className?: string;
}

export function GlassCard({ title, code, accent = COLORS.cyan, children, className = "" }: GlassCardProps) {
  return (
    <section
      className={`relative flex flex-col overflow-visible rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 text-slate-900 ${className}`}
    >
      <header
        className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block h-3.5 w-1 rounded-full"
            style={{ background: accent }}
          />
          <h2 className="uppercase tracking-[0.16em] text-slate-900 font-bold text-xs">
            {title}
          </h2>
        </div>
        {code && (
          <span className="whitespace-nowrap shrink-0" style={{ ...mono, color: COLORS.textDim, fontSize: 11, letterSpacing: "0.1em", fontWeight: 600 }}>
            {code}
          </span>
        )}
      </header>
      <div className="flex-1 overflow-visible">{children}</div>
    </section>
  );
}
