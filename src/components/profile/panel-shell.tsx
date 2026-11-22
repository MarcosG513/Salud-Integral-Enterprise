import { ReactNode } from "react";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export function mono() {
  return MONO;
}

export function Panel({
  title,
  code,
  icon,
  accent = "#0284C7",
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
      className={`relative flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 p-6 ${className}`}
    >
      <header className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          {icon && <span style={{ color: accent }}>{icon}</span>}
          <h2
            className="uppercase tracking-[0.18em] text-slate-900 font-bold"
            style={{ fontFamily: MONO, fontSize: 12 }}
          >
            {title}
          </h2>
        </div>
        <span
          className="uppercase tracking-[0.22em] text-slate-500 font-mono text-xs font-semibold"
          style={{ fontFamily: MONO }}
        >
          {code}
        </span>
      </header>
      <div className="flex-1 min-h-0">{children}</div>
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
        className="block mb-1.5 uppercase tracking-[0.16em] text-slate-600 font-mono text-xs font-semibold"
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
    <div className="mt-2.5 flex items-center gap-2">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500 shadow-xs"
      />
      <div className="h-px flex-1 bg-slate-100" />
      <span
        className="uppercase tracking-[0.14em] text-sky-600 font-mono text-xs font-semibold"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
    </div>
  );
}
