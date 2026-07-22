import { ReactNode } from "react";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export function mono() {
  return MONO;
}

export function Panel({
  title,
  code,
  icon,
  accent = "#00F0FF",
  children,
  className = "",
}: {
  title: string;
  code: string;
  icon?: ReactNode;
  accent?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative flex flex-col rounded-xl border overflow-hidden backdrop-blur-xl ${className}`}
      style={{
        background: "rgba(15, 19, 34, 0.72)",
        borderColor: "#1E293B",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <header
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "#1E293B" }}
      >
        <div className="flex items-center gap-2.5">
          {icon && <span style={{ color: accent }}>{icon}</span>}
          <h2
            className="uppercase tracking-[0.18em] text-[#E2E8F0] font-bold"
            style={{ fontFamily: MONO, fontSize: 12 }}
          >
            {title}
          </h2>
        </div>
        <span
          className="uppercase tracking-[0.22em] text-[#475569] font-mono text-xs"
          style={{ fontFamily: MONO }}
        >
          {code}
        </span>
      </header>
      <div className="flex-1 min-h-0 p-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block mb-1.5 uppercase tracking-[0.16em] text-[#64748B] font-mono text-xs"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export function FeedLine({ label }: { label: string }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "#00F0FF", boxShadow: "0 0 8px #00F0FF" }}
      />
      <div
        className="h-px flex-1"
        style={{
          background: "linear-gradient(90deg, #00F0FF, rgba(0,240,255,0.05))",
        }}
      />
      <span
        className="uppercase tracking-[0.14em] text-[#00F0FF]/70 font-mono text-xs"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
    </div>
  );
}
